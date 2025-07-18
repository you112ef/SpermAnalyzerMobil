import type { DetectedCell } from '@/types/analysis';

interface TrackState {
  id: string;
  bbox: { x: number; y: number; width: number; height: number };
  velocity: { vx: number; vy: number };
  acceleration: { ax: number; ay: number };
  confidence: number;
  age: number;
  hitStreak: number;
  timeSinceUpdate: number;
  motilityHistory: string[];
  track: Array<{ x: number; y: number; timestamp: number; velocity?: number }>;
}

interface Detection {
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
  features: number[];
  motilityType: 'progressive' | 'non-progressive' | 'immotile';
}

export class AdvancedTracker {
  private tracks: Map<string, TrackState> = new Map();
  private nextId: number = 0;
  private maxAge: number = 30; // frames
  private minHits: number = 3;
  private iouThreshold: number = 0.3;
  private featureThreshold: number = 0.7;

  /**
   * DeepSORT-style tracking with feature matching and Kalman filtering
   */
  async track(detections: Detection[], timestamp: number): Promise<DetectedCell[]> {
    // Predict new locations for existing tracks
    this.predict();
    
    // Associate detections with existing tracks
    const { matches, unmatchedDets, unmatchedTrks } = await this.associate(detections);
    
    // Update matched tracks
    for (const [detIdx, trkIdx] of matches) {
      const detection = detections[detIdx];
      const trackId = Array.from(this.tracks.keys())[trkIdx];
      const track = this.tracks.get(trackId)!;
      
      this.updateTrack(track, detection, timestamp);
    }
    
    // Create new tracks for unmatched detections
    for (const detIdx of unmatchedDets) {
      const detection = detections[detIdx];
      this.createTrack(detection, timestamp);
    }
    
    // Mark unmatched tracks as lost
    for (const trkIdx of unmatchedTrks) {
      const trackId = Array.from(this.tracks.keys())[trkIdx];
      const track = this.tracks.get(trackId)!;
      track.timeSinceUpdate += 1;
    }
    
    // Remove old tracks
    this.cleanup();
    
    // Convert to DetectedCell format
    return this.getActiveCells();
  }

  private predict(): void {
    for (const track of this.tracks.values()) {
      // Simple motion model: position = position + velocity + 0.5 * acceleration
      track.bbox.x += track.velocity.vx + 0.5 * track.acceleration.ax;
      track.bbox.y += track.velocity.vy + 0.5 * track.acceleration.ay;
      
      // Update velocity with acceleration
      track.velocity.vx += track.acceleration.ax;
      track.velocity.vy += track.acceleration.ay;
      
      // Apply damping to prevent unrealistic velocities
      track.velocity.vx *= 0.95;
      track.velocity.vy *= 0.95;
      track.acceleration.ax *= 0.9;
      track.acceleration.ay *= 0.9;
      
      track.age += 1;
      track.timeSinceUpdate += 1;
    }
  }

  private async associate(detections: Detection[]): Promise<{
    matches: Array<[number, number]>;
    unmatchedDets: number[];
    unmatchedTrks: number[];
  }> {
    const tracks = Array.from(this.tracks.values());
    
    if (tracks.length === 0 || detections.length === 0) {
      return {
        matches: [],
        unmatchedDets: Array.from({ length: detections.length }, (_, i) => i),
        unmatchedTrks: Array.from({ length: tracks.length }, (_, i) => i)
      };
    }
    
    // Calculate cost matrix (IoU + feature similarity)
    const costMatrix: number[][] = [];
    
    for (let i = 0; i < detections.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < tracks.length; j++) {
        const iou = this.calculateIoU(detections[i].bbox, tracks[j].bbox);
        const featureSim = this.calculateFeatureSimilarity(detections[i].features, tracks[j]);
        
        // Combined cost: lower is better
        const cost = 1 - (0.6 * iou + 0.4 * featureSim);
        row.push(cost);
      }
      costMatrix.push(row);
    }
    
    // Hungarian algorithm approximation (greedy matching for now)
    const matches: Array<[number, number]> = [];
    const usedDets = new Set<number>();
    const usedTrks = new Set<number>();
    
    // Find best matches
    for (let iteration = 0; iteration < Math.min(detections.length, tracks.length); iteration++) {
      let bestCost = Infinity;
      let bestMatch: [number, number] | null = null;
      
      for (let i = 0; i < detections.length; i++) {
        if (usedDets.has(i)) continue;
        
        for (let j = 0; j < tracks.length; j++) {
          if (usedTrks.has(j)) continue;
          
          if (costMatrix[i][j] < bestCost && costMatrix[i][j] < 0.7) {
            bestCost = costMatrix[i][j];
            bestMatch = [i, j];
          }
        }
      }
      
      if (bestMatch) {
        matches.push(bestMatch);
        usedDets.add(bestMatch[0]);
        usedTrks.add(bestMatch[1]);
      } else {
        break;
      }
    }
    
    const unmatchedDets = Array.from({ length: detections.length }, (_, i) => i)
      .filter(i => !usedDets.has(i));
    const unmatchedTrks = Array.from({ length: tracks.length }, (_, i) => i)
      .filter(i => !usedTrks.has(i));
    
    return { matches, unmatchedDets, unmatchedTrks };
  }

  private calculateIoU(bbox1: { x: number; y: number; width: number; height: number }, 
                      bbox2: { x: number; y: number; width: number; height: number }): number {
    const x1 = Math.max(bbox1.x, bbox2.x);
    const y1 = Math.max(bbox1.y, bbox2.y);
    const x2 = Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width);
    const y2 = Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height);
    
    if (x2 <= x1 || y2 <= y1) return 0;
    
    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = bbox1.width * bbox1.height;
    const area2 = bbox2.width * bbox2.height;
    const union = area1 + area2 - intersection;
    
    return intersection / union;
  }

  private calculateFeatureSimilarity(features1: number[], track: TrackState): number {
    // Simplified feature similarity - in real implementation, this would use deep features
    if (!features1 || features1.length === 0) return 0.5;
    
    // Use motion consistency as a feature
    const motionConsistency = this.calculateMotionConsistency(track);
    const sizeConsistency = Math.exp(-Math.abs(features1[0] - track.bbox.width) / 10);
    
    return (motionConsistency + sizeConsistency) / 2;
  }

  private calculateMotionConsistency(track: TrackState): number {
    if (track.track.length < 3) return 0.5;
    
    // Calculate motion smoothness
    let velocityChanges = 0;
    let totalChanges = 0;
    
    for (let i = 2; i < track.track.length; i++) {
      const prev = track.track[i - 1];
      const curr = track.track[i];
      const next = track.track[i + 1];
      
      if (prev && curr && next) {
        const vel1 = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
        const vel2 = Math.sqrt(Math.pow(next.x - curr.x, 2) + Math.pow(next.y - curr.y, 2));
        
        velocityChanges += Math.abs(vel2 - vel1);
        totalChanges += 1;
      }
    }
    
    if (totalChanges === 0) return 0.5;
    
    const avgChange = velocityChanges / totalChanges;
    return Math.exp(-avgChange / 5); // Exponential decay for smoothness
  }

  private updateTrack(track: TrackState, detection: Detection, timestamp: number): void {
    // Update position with detection
    const prevX = track.bbox.x;
    const prevY = track.bbox.y;
    
    track.bbox = { ...detection.bbox };
    track.confidence = detection.confidence;
    track.timeSinceUpdate = 0;
    track.hitStreak += 1;
    
    // Update velocity and acceleration
    const dt = 1; // Assuming 1 frame = 1 time unit
    const newVx = (track.bbox.x - prevX) / dt;
    const newVy = (track.bbox.y - prevY) / dt;
    
    track.acceleration.ax = (newVx - track.velocity.vx) / dt;
    track.acceleration.ay = (newVy - track.velocity.vy) / dt;
    
    track.velocity.vx = newVx;
    track.velocity.vy = newVy;
    
    // Update motility history
    track.motilityHistory.push(detection.motilityType);
    if (track.motilityHistory.length > 10) {
      track.motilityHistory.shift();
    }
    
    // Add to track
    const velocity = Math.sqrt(newVx * newVx + newVy * newVy);
    track.track.push({
      x: track.bbox.x + track.bbox.width / 2,
      y: track.bbox.y + track.bbox.height / 2,
      timestamp,
      velocity
    });
    
    // Limit track length
    if (track.track.length > 50) {
      track.track.shift();
    }
  }

  private createTrack(detection: Detection, timestamp: number): void {
    const id = `track_${this.nextId++}`;
    
    const track: TrackState = {
      id,
      bbox: { ...detection.bbox },
      velocity: { vx: 0, vy: 0 },
      acceleration: { ax: 0, ay: 0 },
      confidence: detection.confidence,
      age: 1,
      hitStreak: 1,
      timeSinceUpdate: 0,
      motilityHistory: [detection.motilityType],
      track: [{
        x: detection.bbox.x + detection.bbox.width / 2,
        y: detection.bbox.y + detection.bbox.height / 2,
        timestamp
      }]
    };
    
    this.tracks.set(id, track);
  }

  private cleanup(): void {
    const toRemove: string[] = [];
    
    for (const [id, track] of this.tracks.entries()) {
      if (track.timeSinceUpdate > this.maxAge || 
          (track.hitStreak < this.minHits && track.age > this.maxAge)) {
        toRemove.push(id);
      }
    }
    
    for (const id of toRemove) {
      this.tracks.delete(id);
    }
  }

  private getActiveCells(): DetectedCell[] {
    const cells: DetectedCell[] = [];
    
    for (const track of this.tracks.values()) {
      if (track.hitStreak >= this.minHits && track.timeSinceUpdate < 3) {
        // Determine dominant motility type from history
        const motilityCounts = track.motilityHistory.reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const dominantMotility = Object.entries(motilityCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] as 'progressive' | 'non-progressive' | 'immotile' || 'immotile';
        
        cells.push({
          id: track.id,
          x: track.bbox.x,
          y: track.bbox.y,
          width: track.bbox.width,
          height: track.bbox.height,
          motilityType: dominantMotility,
          track: track.track,
          confidence: track.confidence
        });
      }
    }
    
    return cells;
  }

  /**
   * Reset tracker state
   */
  reset(): void {
    this.tracks.clear();
    this.nextId = 0;
  }

  /**
   * Get tracking statistics
   */
  getStats(): {
    activeTracks: number;
    totalTracks: number;
    avgTrackLength: number;
    avgConfidence: number;
  } {
    const activeTracks = Array.from(this.tracks.values())
      .filter(t => t.hitStreak >= this.minHits && t.timeSinceUpdate < 3);
    
    const totalTracks = this.tracks.size;
    const avgTrackLength = activeTracks.length > 0 
      ? activeTracks.reduce((sum, t) => sum + t.track.length, 0) / activeTracks.length 
      : 0;
    const avgConfidence = activeTracks.length > 0
      ? activeTracks.reduce((sum, t) => sum + t.confidence, 0) / activeTracks.length
      : 0;
    
    return {
      activeTracks: activeTracks.length,
      totalTracks,
      avgTrackLength,
      avgConfidence
    };
  }
}

export const advancedTracker = new AdvancedTracker();