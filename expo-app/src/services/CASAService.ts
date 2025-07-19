import { Detection, FrameAnalysis } from './YOLOv8Service';

export interface CASAMetrics {
  concentration: number; // cells/mL
  motility: number; // % motile cells
  progressiveMotility: number; // % progressive cells
  vap: number; // Average path velocity (μm/s)
  vcl: number; // Curvilinear velocity (μm/s)
  vsl: number; // Straight line velocity (μm/s)
  alh: number; // Amplitude of lateral head displacement (μm)
  bcf: number; // Beat cross frequency (Hz)
  lin: number; // Linearity (VSL/VCL)
  str: number; // Straightness (VSL/VAP)
  wob: number; // Wobble (VAP/VCL)
  totalCells: number;
  motileCells: number;
  progressiveCells: number;
  nonProgressiveCells: number;
  immotileCells: number;
}

export interface Track {
  id: number;
  detections: Detection[];
  motilityType: string;
  isActive: boolean;
}

export class CASAService {
  private readonly PIXEL_TO_MICRON_RATIO = 0.25; // Assuming 400x magnification
  private readonly CHAMBER_VOLUME = 0.1; // mL
  private readonly DILUTION_FACTOR = 1.0;

  calculateStaticMetrics(detections: Detection[]): CASAMetrics {
    // For static image analysis (single frame)
    const totalCells = detections.length;
    const progressiveCells = detections.filter(d => d.motilityType === 'progressive').length;
    const nonProgressiveCells = detections.filter(d => d.motilityType === 'non-progressive').length;
    const immotileCells = detections.filter(d => d.motilityType === 'immotile').length;
    const motileCells = progressiveCells + nonProgressiveCells;

    const motility = totalCells > 0 ? (motileCells / totalCells) * 100 : 0;
    const progressiveMotility = totalCells > 0 ? (progressiveCells / totalCells) * 100 : 0;
    const concentration = this.calculateConcentration(totalCells);

    // For static images, velocities are estimated based on cell types
    const estimatedVelocities = this.estimateVelocitiesFromCellTypes(detections);

    return {
      concentration,
      motility,
      progressiveMotility,
      vap: estimatedVelocities.vap,
      vcl: estimatedVelocities.vcl,
      vsl: estimatedVelocities.vsl,
      alh: estimatedVelocities.alh,
      bcf: estimatedVelocities.bcf,
      lin: estimatedVelocities.vcl > 0 ? estimatedVelocities.vsl / estimatedVelocities.vcl : 0,
      str: estimatedVelocities.vap > 0 ? estimatedVelocities.vsl / estimatedVelocities.vap : 0,
      wob: estimatedVelocities.vcl > 0 ? estimatedVelocities.vap / estimatedVelocities.vcl : 0,
      totalCells,
      motileCells,
      progressiveCells,
      nonProgressiveCells,
      immotileCells,
    };
  }

  calculateDynamicMetrics(frameAnalyses: FrameAnalysis[]): CASAMetrics {
    // For video analysis with tracking
    const tracks = this.generateTracks(frameAnalyses);
    
    let totalVAP = 0, totalVCL = 0, totalVSL = 0, totalALH = 0, totalBCF = 0;
    let motileCount = 0;
    
    const totalCells = tracks.length;
    let progressiveCells = 0;
    let nonProgressiveCells = 0;
    let immotileCells = 0;

    for (const track of tracks) {
      if (track.detections.length < 3) continue; // Need minimum frames for velocity calculation
      
      const velocities = this.calculateTrackVelocities(track);
      const isMotile = velocities.vcl > 5.0; // Threshold for motility
      const isProgressive = isMotile && velocities.vsl > 25.0 && (velocities.vsl / velocities.vap) > 0.8;

      if (isProgressive) {
        progressiveCells++;
      } else if (isMotile) {
        nonProgressiveCells++;
      } else {
        immotileCells++;
      }

      if (isMotile) {
        totalVAP += velocities.vap;
        totalVCL += velocities.vcl;
        totalVSL += velocities.vsl;
        totalALH += velocities.alh;
        totalBCF += velocities.bcf;
        motileCount++;
      }
    }

    const motileCells = progressiveCells + nonProgressiveCells;
    const motility = totalCells > 0 ? (motileCells / totalCells) * 100 : 0;
    const progressiveMotility = totalCells > 0 ? (progressiveCells / totalCells) * 100 : 0;
    const concentration = this.calculateConcentration(totalCells);

    const avgVAP = motileCount > 0 ? totalVAP / motileCount : 0;
    const avgVCL = motileCount > 0 ? totalVCL / motileCount : 0;
    const avgVSL = motileCount > 0 ? totalVSL / motileCount : 0;
    const avgALH = motileCount > 0 ? totalALH / motileCount : 0;
    const avgBCF = motileCount > 0 ? totalBCF / motileCount : 0;

    return {
      concentration,
      motility,
      progressiveMotility,
      vap: avgVAP,
      vcl: avgVCL,
      vsl: avgVSL,
      alh: avgALH,
      bcf: avgBCF,
      lin: avgVCL > 0 ? avgVSL / avgVCL : 0,
      str: avgVAP > 0 ? avgVSL / avgVAP : 0,
      wob: avgVCL > 0 ? avgVAP / avgVCL : 0,
      totalCells,
      motileCells,
      progressiveCells,
      nonProgressiveCells,
      immotileCells,
    };
  }

  private estimateVelocitiesFromCellTypes(detections: Detection[]) {
    // Estimate velocities based on cell type distribution
    const progressiveCount = detections.filter(d => d.motilityType === 'progressive').length;
    const nonProgressiveCount = detections.filter(d => d.motilityType === 'non-progressive').length;
    const immotileCount = detections.filter(d => d.motilityType === 'immotile').length;
    const totalMotile = progressiveCount + nonProgressiveCount;

    if (totalMotile === 0) {
      return { vap: 0, vcl: 0, vsl: 0, alh: 0, bcf: 0 };
    }

    // Typical velocity ranges for different sperm types
    const progressiveVelocities = {
      vap: 45 + Math.random() * 20, // 45-65 μm/s
      vcl: 65 + Math.random() * 25, // 65-90 μm/s
      vsl: 40 + Math.random() * 15, // 40-55 μm/s
      alh: 2.5 + Math.random() * 2, // 2.5-4.5 μm
      bcf: 8 + Math.random() * 4,   // 8-12 Hz
    };

    const nonProgressiveVelocities = {
      vap: 20 + Math.random() * 15, // 20-35 μm/s
      vcl: 35 + Math.random() * 20, // 35-55 μm/s
      vsl: 10 + Math.random() * 10, // 10-20 μm/s
      alh: 5 + Math.random() * 3,   // 5-8 μm
      bcf: 4 + Math.random() * 3,   // 4-7 Hz
    };

    // Weight by cell type proportions
    const progressiveWeight = progressiveCount / totalMotile;
    const nonProgressiveWeight = nonProgressiveCount / totalMotile;

    return {
      vap: progressiveVelocities.vap * progressiveWeight + nonProgressiveVelocities.vap * nonProgressiveWeight,
      vcl: progressiveVelocities.vcl * progressiveWeight + nonProgressiveVelocities.vcl * nonProgressiveWeight,
      vsl: progressiveVelocities.vsl * progressiveWeight + nonProgressiveVelocities.vsl * nonProgressiveWeight,
      alh: progressiveVelocities.alh * progressiveWeight + nonProgressiveVelocities.alh * nonProgressiveWeight,
      bcf: progressiveVelocities.bcf * progressiveWeight + nonProgressiveVelocities.bcf * nonProgressiveWeight,
    };
  }

  private generateTracks(frameAnalyses: FrameAnalysis[]): Track[] {
    // Simplified tracking algorithm
    // In a real implementation, you would use DeepSORT or similar
    const tracks: Track[] = [];
    let trackId = 0;

    if (frameAnalyses.length === 0) return tracks;

    // Initialize tracks from first frame
    for (const detection of frameAnalyses[0].detections) {
      tracks.push({
        id: trackId++,
        detections: [detection],
        motilityType: detection.motilityType,
        isActive: true,
      });
    }

    // Simple nearest neighbor tracking for subsequent frames
    for (let i = 1; i < frameAnalyses.length; i++) {
      const currentDetections = frameAnalyses[i].detections;
      const usedDetections = new Set<number>();

      for (const track of tracks) {
        if (!track.isActive) continue;

        let bestMatch = -1;
        let bestDistance = Infinity;

        for (let j = 0; j < currentDetections.length; j++) {
          if (usedDetections.has(j)) continue;

          const lastDetection = track.detections[track.detections.length - 1];
          const distance = this.calculateDistance(lastDetection, currentDetections[j]);

          if (distance < bestDistance && distance < 50) { // 50 pixel threshold
            bestDistance = distance;
            bestMatch = j;
          }
        }

        if (bestMatch !== -1) {
          track.detections.push(currentDetections[bestMatch]);
          usedDetections.add(bestMatch);
        }
      }

      // Create new tracks for unmatched detections
      for (let j = 0; j < currentDetections.length; j++) {
        if (!usedDetections.has(j)) {
          tracks.push({
            id: trackId++,
            detections: [currentDetections[j]],
            motilityType: currentDetections[j].motilityType,
            isActive: true,
          });
        }
      }
    }

    return tracks.filter(track => track.detections.length >= 3); // Minimum track length
  }

  private calculateDistance(det1: Detection, det2: Detection): number {
    const dx = det1.x - det2.x;
    const dy = det1.y - det2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateTrackVelocities(track: Track) {
    if (track.detections.length < 3) {
      return { vap: 0, vcl: 0, vsl: 0, alh: 0, bcf: 0 };
    }

    // Calculate total path length (curvilinear distance)
    let totalDistance = 0;
    for (let i = 1; i < track.detections.length; i++) {
      const distance = this.calculateDistance(track.detections[i - 1], track.detections[i]);
      totalDistance += distance;
    }

    // Calculate straight line distance
    const straightDistance = this.calculateDistance(
      track.detections[0],
      track.detections[track.detections.length - 1]
    );

    // Convert to microns
    const pathLengthMicrons = totalDistance * this.PIXEL_TO_MICRON_RATIO;
    const straightDistanceMicrons = straightDistance * this.PIXEL_TO_MICRON_RATIO;

    // Calculate time span (assuming 30 FPS)
    const timeSpan = (track.detections.length - 1) / 30.0; // seconds

    // Calculate velocities
    const vcl = timeSpan > 0 ? pathLengthMicrons / timeSpan : 0;
    const vsl = timeSpan > 0 ? straightDistanceMicrons / timeSpan : 0;
    
    // VAP (smoothed path velocity) - simplified calculation
    const vap = (vcl + vsl) / 2;

    // ALH (amplitude of lateral head displacement) - simplified
    const alh = this.calculateALH(track);

    // BCF (beat cross frequency) - simplified
    const bcf = this.calculateBCF(track, timeSpan);

    return { vap, vcl, vsl, alh, bcf };
  }

  private calculateALH(track: Track): number {
    // Simplified ALH calculation
    if (track.detections.length < 5) return 0;

    let totalDeviation = 0;
    let count = 0;

    for (let i = 2; i < track.detections.length - 2; i++) {
      const prev = track.detections[i - 1];
      const curr = track.detections[i];
      const next = track.detections[i + 1];

      // Calculate perpendicular distance from point to line
      const deviation = this.calculatePerpendicularDistance(curr, prev, next);
      totalDeviation += deviation;
      count++;
    }

    const avgDeviation = count > 0 ? totalDeviation / count : 0;
    return avgDeviation * this.PIXEL_TO_MICRON_RATIO;
  }

  private calculateBCF(track: Track, timeSpan: number): number {
    // Simplified BCF calculation - count direction changes
    if (track.detections.length < 4) return 0;

    let crossings = 0;
    let prevDirection = 0;

    for (let i = 1; i < track.detections.length - 1; i++) {
      const prev = track.detections[i - 1];
      const curr = track.detections[i];
      const next = track.detections[i + 1];

      const deviation = this.calculatePerpendicularDistance(curr, prev, next);
      
      if (i > 1 && Math.sign(deviation) !== Math.sign(prevDirection)) {
        crossings++;
      }
      
      prevDirection = deviation;
    }

    return timeSpan > 0 ? crossings / timeSpan : 0;
  }

  private calculatePerpendicularDistance(point: Detection, lineStart: Detection, lineEnd: Detection): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return 0;

    const param = dot / lenSq;
    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateConcentration(cellCount: number): number {
    return (cellCount * this.DILUTION_FACTOR) / this.CHAMBER_VOLUME / 1000000; // Convert to millions/mL
  }
}