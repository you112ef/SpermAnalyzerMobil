export interface DetectedCell {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  motilityType: 'progressive' | 'non-progressive' | 'immotile';
  track?: Array<{ x: number; y: number; timestamp: number }>;
  confidence?: number;
  class?: string;
}

export interface CASAMetrics {
  concentration: number | null; // cells/mL
  progressiveMotility: number | null; // percentage
  totalMotility: number | null; // percentage
  vap: number | null; // Average Path Velocity (μm/s)
  vcl: number | null; // Curvilinear Velocity (μm/s)
  vsl: number | null; // Straight Line Velocity (μm/s)
  alh: number | null; // Amplitude Lateral Head (μm)
  bcf: number | null; // Beat Cross Frequency (Hz)
}

export interface QualityMetrics {
  morphologyScore: number | null; // percentage
  vitalityScore: number | null; // percentage
  overallScore: number | null; // percentage
}

export interface CellCounts {
  totalCells: number;
  motileCells: number;
  progressiveCells: number;
  nonProgressiveCells: number;
  immotileCells: number;
}

export interface StatisticalData {
  vap?: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
  vcl?: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
  vsl?: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
  alh?: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
  bcf?: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
}

export interface AnalysisResult {
  id: number;
  sampleId: string;
  imageUrl: string;
  filename: string;
  fileSize: number;
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  
  // CASA Metrics
  concentration?: number | null;
  progressiveMotility?: number | null;
  totalMotility?: number | null;
  vap?: number | null;
  vcl?: number | null;
  vsl?: number | null;
  alh?: number | null;
  bcf?: number | null;
  
  // Quality metrics
  morphologyScore?: number | null;
  vitalityScore?: number | null;
  overallScore?: number | null;
  
  // Cell counts
  totalCells?: number | null;
  motileCells?: number | null;
  progressiveCells?: number | null;
  nonProgressiveCells?: number | null;
  immotileCells?: number | null;
  
  // Analysis parameters
  analysisParameters?: any;
  
  // Statistical data
  statisticalData?: StatisticalData | null;
  
  // Metadata
  createdAt?: string | Date;
  completedAt?: string | Date | null;
  processingTime?: number | null;
}

export interface ProgressInfo {
  step: 'preprocessing' | 'detection' | 'tracking' | 'metrics' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
}

export interface VideoData {
  frames: HTMLCanvasElement[];
  frameRate: number;
  duration: number;
  detectedCells: Array<{
    frameIndex: number;
    cells: DetectedCell[];
  }>;
}