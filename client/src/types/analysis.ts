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
  totalCells: number | null;
  motileCells: number | null;
  progressiveCells: number | null;
  nonProgressiveCells: number | null;
  immotileCells: number | null;
}

export interface AnalysisParameters {
  minCellSize: number;
  maxCellSize: number;
  magnification: number;
  temperature: number;
  chamberType: string;
}

export interface StatisticalData {
  vap: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
  vcl: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
  vsl: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
  alh: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
  bcf: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
  };
}

export interface DetectedCell {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  motilityType: 'progressive' | 'non-progressive' | 'immotile';
  track?: Array<{ x: number; y: number; timestamp: number }>;
}

export interface AnalysisProgress {
  step: 'preprocessing' | 'detection' | 'tracking' | 'metrics' | 'complete';
  progress: number; // 0-100
  message: string;
}

export interface AnalysisResult {
  id: number;
  sampleId: string;
  imageUrl: string;
  filename: string;
  fileSize: number;
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  casa: CASAMetrics;
  quality: QualityMetrics;
  cellCounts: CellCounts;
  analysisParameters: AnalysisParameters;
  statisticalData: StatisticalData | null;
  detectedCells?: DetectedCell[];
  processingTime: number | null;
  createdAt: string;
  completedAt: string | null;
}
