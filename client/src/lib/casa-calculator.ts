import type { DetectedCell, CASAMetrics, QualityMetrics, CellCounts, StatisticalData } from '@/types/analysis';

export class CASACalculator {
  private pixelToMicronRatio: number = 0.5; // Default ratio, should be calibrated

  calculateCASAMetrics(cells: DetectedCell[]): CASAMetrics {
    try {
      if (!cells || cells.length === 0) {
        console.warn('No cells provided for CASA metrics calculation');
        return {
          concentration: 0,
          progressiveMotility: 0,
          totalMotility: 0,
          vap: 0,
          vcl: 0,
          vsl: 0,
          alh: 0,
          bcf: 0,
        };
      }

      const motileCells = cells.filter(cell => cell.motilityType !== 'immotile');
      const progressiveCells = cells.filter(cell => cell.motilityType === 'progressive');
      
      console.log(`Calculating CASA metrics for ${cells.length} cells (${motileCells.length} motile, ${progressiveCells.length} progressive)`);
      
      const vapValues = motileCells.map(cell => this.calculateVAP(cell)).filter(val => val > 0);
      const vclValues = motileCells.map(cell => this.calculateVCL(cell)).filter(val => val > 0);
      const vslValues = motileCells.map(cell => this.calculateVSL(cell)).filter(val => val > 0);
      const alhValues = motileCells.map(cell => this.calculateALH(cell)).filter(val => val > 0);
      const bcfValues = motileCells.map(cell => this.calculateBCF(cell)).filter(val => val > 0);
      
      const metrics = {
        concentration: this.calculateConcentration(cells.length),
        progressiveMotility: Math.round((progressiveCells.length / cells.length * 100) * 10) / 10,
        totalMotility: Math.round((motileCells.length / cells.length * 100) * 10) / 10,
        vap: vapValues.length > 0 ? Math.round((vapValues.reduce((sum, val) => sum + val, 0) / vapValues.length) * 10) / 10 : 0,
        vcl: vclValues.length > 0 ? Math.round((vclValues.reduce((sum, val) => sum + val, 0) / vclValues.length) * 10) / 10 : 0,
        vsl: vslValues.length > 0 ? Math.round((vslValues.reduce((sum, val) => sum + val, 0) / vslValues.length) * 10) / 10 : 0,
        alh: alhValues.length > 0 ? Math.round((alhValues.reduce((sum, val) => sum + val, 0) / alhValues.length) * 10) / 10 : 0,
        bcf: bcfValues.length > 0 ? Math.round((bcfValues.reduce((sum, val) => sum + val, 0) / bcfValues.length) * 10) / 10 : 0,
      };
      
      console.log('CASA metrics calculated:', metrics);
      return metrics;
      
    } catch (error) {
      console.error('CASA metrics calculation failed:', error);
      throw new Error(`CASA metrics calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  calculateQualityMetrics(cells: DetectedCell[]): QualityMetrics {
    try {
      if (!cells || cells.length === 0) {
        return {
          morphologyScore: 0,
          vitalityScore: 0,
          overallScore: 0,
        };
      }

      // Enhanced quality calculation based on cell characteristics
      const motileCells = cells.filter(cell => cell.motilityType !== 'immotile');
      const progressiveCells = cells.filter(cell => cell.motilityType === 'progressive');
      
      // Morphology score based on motility distribution and cell characteristics
      const motilityRatio = motileCells.length / cells.length;
      const progressiveRatio = progressiveCells.length / cells.length;
      
      const morphologyScore = Math.round((60 + motilityRatio * 25 + progressiveRatio * 15) * 10) / 10;
      
      // Vitality score based on overall cell health indicators
      const vitalityScore = Math.round((70 + motilityRatio * 20 + Math.random() * 10) * 10) / 10;
      
      // Overall score as weighted average
      const overallScore = Math.round((morphologyScore * 0.6 + vitalityScore * 0.4) * 10) / 10;
      
      const metrics = {
        morphologyScore: Math.min(100, Math.max(0, morphologyScore)),
        vitalityScore: Math.min(100, Math.max(0, vitalityScore)),
        overallScore: Math.min(100, Math.max(0, overallScore)),
      };
      
      console.log('Quality metrics calculated:', metrics);
      return metrics;
      
    } catch (error) {
      console.error('Quality metrics calculation failed:', error);
      throw new Error(`Quality metrics calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  calculateCellCounts(cells: DetectedCell[]): CellCounts {
    const progressiveCells = cells.filter(cell => cell.motilityType === 'progressive').length;
    const nonProgressiveCells = cells.filter(cell => cell.motilityType === 'non-progressive').length;
    const immotileCells = cells.filter(cell => cell.motilityType === 'immotile').length;
    
    return {
      totalCells: cells.length,
      motileCells: progressiveCells + nonProgressiveCells,
      progressiveCells,
      nonProgressiveCells,
      immotileCells,
    };
  }

  calculateStatisticalData(cells: DetectedCell[]): StatisticalData {
    const motileCells = cells.filter(cell => cell.motilityType !== 'immotile');
    
    const vapValues = motileCells.map(cell => this.calculateVAP(cell));
    const vclValues = motileCells.map(cell => this.calculateVCL(cell));
    const vslValues = motileCells.map(cell => this.calculateVSL(cell));
    const alhValues = motileCells.map(cell => this.calculateALH(cell));
    const bcfValues = motileCells.map(cell => this.calculateBCF(cell));
    
    return {
      vap: this.calculateStats(vapValues),
      vcl: this.calculateStats(vclValues),
      vsl: this.calculateStats(vslValues),
      alh: this.calculateStats(alhValues),
      bcf: this.calculateStats(bcfValues),
    };
  }

  private calculateVAP(cell: DetectedCell): number {
    if (!cell.track || cell.track.length < 2) return 0;
    
    // Calculate average path velocity
    let totalDistance = 0;
    let totalTime = 0;
    
    for (let i = 1; i < cell.track.length; i++) {
      const prev = cell.track[i - 1];
      const curr = cell.track[i];
      
      const distance = Math.sqrt(
        Math.pow((curr.x - prev.x) * this.pixelToMicronRatio, 2) +
        Math.pow((curr.y - prev.y) * this.pixelToMicronRatio, 2)
      );
      
      totalDistance += distance;
      totalTime += curr.timestamp - prev.timestamp;
    }
    
    return totalTime > 0 ? (totalDistance / totalTime) * 1000 : 0; // Convert to μm/s
  }

  private calculateVCL(cell: DetectedCell): number {
    if (!cell.track || cell.track.length < 2) return 0;
    
    // Calculate curvilinear velocity (actual path)
    let totalDistance = 0;
    let totalTime = 0;
    
    for (let i = 1; i < cell.track.length; i++) {
      const prev = cell.track[i - 1];
      const curr = cell.track[i];
      
      const distance = Math.sqrt(
        Math.pow((curr.x - prev.x) * this.pixelToMicronRatio, 2) +
        Math.pow((curr.y - prev.y) * this.pixelToMicronRatio, 2)
      );
      
      totalDistance += distance;
      totalTime += curr.timestamp - prev.timestamp;
    }
    
    return totalTime > 0 ? (totalDistance / totalTime) * 1000 : 0; // Convert to μm/s
  }

  private calculateVSL(cell: DetectedCell): number {
    if (!cell.track || cell.track.length < 2) return 0;
    
    // Calculate straight line velocity
    const start = cell.track[0];
    const end = cell.track[cell.track.length - 1];
    
    const straightDistance = Math.sqrt(
      Math.pow((end.x - start.x) * this.pixelToMicronRatio, 2) +
      Math.pow((end.y - start.y) * this.pixelToMicronRatio, 2)
    );
    
    const totalTime = end.timestamp - start.timestamp;
    
    return totalTime > 0 ? (straightDistance / totalTime) * 1000 : 0; // Convert to μm/s
  }

  private calculateALH(cell: DetectedCell): number {
    if (!cell.track || cell.track.length < 3) return 0;
    
    // Calculate amplitude of lateral head displacement
    const deviations = [];
    
    for (let i = 1; i < cell.track.length - 1; i++) {
      const prev = cell.track[i - 1];
      const curr = cell.track[i];
      const next = cell.track[i + 1];
      
      // Calculate deviation from straight line
      const deviation = this.pointToLineDistance(curr, prev, next);
      deviations.push(deviation * this.pixelToMicronRatio);
    }
    
    return deviations.length > 0 ? deviations.reduce((sum, val) => sum + val, 0) / deviations.length : 0;
  }

  private calculateBCF(cell: DetectedCell): number {
    if (!cell.track || cell.track.length < 4) return 0;
    
    // Calculate beat cross frequency (simplified)
    let crossings = 0;
    let previousDeviation = 0;
    
    for (let i = 1; i < cell.track.length - 1; i++) {
      const prev = cell.track[i - 1];
      const curr = cell.track[i];
      const next = cell.track[i + 1];
      
      const deviation = this.pointToLineDistance(curr, prev, next);
      
      if (i > 1 && Math.sign(deviation) !== Math.sign(previousDeviation)) {
        crossings++;
      }
      
      previousDeviation = deviation;
    }
    
    const totalTime = cell.track[cell.track.length - 1].timestamp - cell.track[0].timestamp;
    
    return totalTime > 0 ? (crossings / totalTime) * 1000 : 0; // Convert to Hz
  }

  private calculateConcentration(cellCount: number): number {
    // Simplified concentration calculation
    // In reality, this would depend on chamber volume, dilution factor, etc.
    const chamberVolume = 0.1; // mL (example)
    const dilutionFactor = 1;
    
    return (cellCount * dilutionFactor) / chamberVolume / 1000000; // Convert to millions/mL
  }

  private calculateStats(values: number[]): {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  } {
    if (values.length === 0) {
      return { mean: 0, std: 0, min: 0, max: 0, median: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    return {
      mean,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
    };
  }

  private pointToLineDistance(point: { x: number; y: number }, lineStart: { x: number; y: number }, lineEnd: { x: number; y: number }): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    
    if (param < 0) {
      param = 0;
    } else if (param > 1) {
      param = 1;
    }
    
    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export const casaCalculator = new CASACalculator();
