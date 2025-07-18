import { tensorflowAnalyzer } from './tensorflow-utils';
import { casaCalculator } from './casa-calculator';
import { imageProcessor } from './image-processor';
import { advancedTracker } from './advanced-tracker';
import { apiRequest } from './queryClient';
import type { DetectedCell, AnalysisResult, ProgressInfo } from '@/types/analysis';

export interface BatchJob {
  id: string;
  files: File[];
  parameters: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    currentFile: number;
    totalFiles: number;
    currentStep: string;
    overallProgress: number;
  };
  results: AnalysisResult[];
  startTime?: Date;
  endTime?: Date;
  errors: string[];
}

export interface BatchProcessingOptions {
  enableAdvancedTracking: boolean;
  saveIndividualResults: boolean;
  generateCombinedReport: boolean;
  maxConcurrentProcessing: number;
  quality: 'fast' | 'balanced' | 'precise';
  outputFormat: 'json' | 'csv' | 'xlsx';
}

export class BatchProcessor {
  private activeJobs: Map<string, BatchJob> = new Map();
  private processingQueue: string[] = [];
  private maxConcurrentJobs: number = 2;

  async createBatchJob(files: File[], parameters: any, options: BatchProcessingOptions): Promise<string> {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: BatchJob = {
      id: jobId,
      files,
      parameters,
      status: 'pending',
      progress: {
        currentFile: 0,
        totalFiles: files.length,
        currentStep: 'Preparing batch job...',
        overallProgress: 0
      },
      results: [],
      errors: []
    };
    
    this.activeJobs.set(jobId, job);
    this.processingQueue.push(jobId);
    
    // Start processing if not at capacity
    this.processQueue();
    
    return jobId;
  }

  private async processQueue(): Promise<void> {
    const activeProcessing = Array.from(this.activeJobs.values())
      .filter(job => job.status === 'processing').length;
    
    if (activeProcessing >= this.maxConcurrentJobs || this.processingQueue.length === 0) {
      return;
    }
    
    const jobId = this.processingQueue.shift()!;
    const job = this.activeJobs.get(jobId);
    
    if (job && job.status === 'pending') {
      this.processBatchJob(job);
    }
  }

  private async processBatchJob(job: BatchJob): Promise<void> {
    job.status = 'processing';
    job.startTime = new Date();
    
    try {
      console.log(`Starting batch job ${job.id} with ${job.files.length} files`);
      
      for (let i = 0; i < job.files.length; i++) {
        if (job.status === 'cancelled') {
          break;
        }
        
        const file = job.files[i];
        job.progress.currentFile = i + 1;
        job.progress.currentStep = `Processing ${file.name}...`;
        job.progress.overallProgress = Math.round((i / job.files.length) * 100);
        
        try {
          const result = await this.processIndividualFile(file, job.parameters, i);
          job.results.push(result);
          
          console.log(`Completed processing file ${i + 1}/${job.files.length}: ${file.name}`);
          
        } catch (error) {
          const errorMsg = `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          job.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      
      if (job.status !== 'cancelled') {
        job.status = 'completed';
        job.progress.overallProgress = 100;
        job.progress.currentStep = 'Batch processing completed';
        
        // Generate combined report if requested
        await this.generateCombinedReport(job);
      }
      
    } catch (error) {
      job.status = 'failed';
      job.errors.push(`Batch job failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`Batch job ${job.id} failed:`, error);
    } finally {
      job.endTime = new Date();
      
      // Process next job in queue
      setTimeout(() => this.processQueue(), 100);
    }
  }

  private async processIndividualFile(file: File, parameters: any, index: number): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    // Create analysis entry
    const formData = new FormData();
    formData.append('image', file);
    formData.append('parameters', JSON.stringify(parameters));
    
    const analysis = await apiRequest('/api/analyses', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set content-type for FormData
    });
    
    if (!analysis) {
      throw new Error('Failed to create analysis entry');
    }
    
    try {
      // Load and preprocess image
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
        setTimeout(() => reject(new Error('Image loading timeout')), 10000);
      });
      
      // Preprocess image
      const preprocessedCanvas = await imageProcessor.preprocessImage(img);
      
      // Detect cells
      const detections = await tensorflowAnalyzer.detectCells(img);
      
      // Advanced tracking (if enabled)
      let trackedCells: DetectedCell[];
      
      // Convert detections to tracking format
      const trackingDetections = detections.map(det => ({
        bbox: { x: det.x, y: det.y, width: det.width, height: det.height },
        confidence: det.confidence,
        features: [det.width, det.height, det.confidence], // Simple features
        motilityType: det.class as 'progressive' | 'non-progressive' | 'immotile'
      }));
      
      // Use advanced tracker
      advancedTracker.reset(); // Reset for individual file processing
      trackedCells = await advancedTracker.track(trackingDetections, Date.now());
      
      // If no advanced tracking results, fallback to basic tracking
      if (trackedCells.length === 0) {
        trackedCells = await tensorflowAnalyzer.trackCells(detections);
      }
      
      // Calculate metrics
      const casaMetrics = casaCalculator.calculateCASAMetrics(trackedCells);
      const qualityMetrics = casaCalculator.calculateQualityMetrics(trackedCells);
      const cellCounts = casaCalculator.calculateCellCounts(trackedCells);
      const statisticalData = casaCalculator.calculateStatisticalData(trackedCells);
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      // Update analysis with results
      const updateData = {
        analysisStatus: 'completed' as const,
        concentration: casaMetrics.concentration,
        progressiveMotility: casaMetrics.progressiveMotility,
        totalMotility: casaMetrics.totalMotility,
        vap: casaMetrics.vap,
        vcl: casaMetrics.vcl,
        vsl: casaMetrics.vsl,
        alh: casaMetrics.alh,
        bcf: casaMetrics.bcf,
        morphologyScore: qualityMetrics.morphologyScore,
        vitalityScore: qualityMetrics.vitalityScore,
        overallScore: qualityMetrics.overallScore,
        totalCells: cellCounts.totalCells,
        motileCells: cellCounts.motileCells,
        progressiveCells: cellCounts.progressiveCells,
        nonProgressiveCells: cellCounts.nonProgressiveCells,
        immotileCells: cellCounts.immotileCells,
        statisticalData: statisticalData,
        processingTime: processingTime,
        completedAt: new Date()
      };
      
      const updatedAnalysis = await apiRequest(`/api/analyses/${analysis.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      
      // Cleanup
      URL.revokeObjectURL(img.src);
      
      return updatedAnalysis || analysis;
      
    } catch (error) {
      // Update analysis as failed
      await apiRequest(`/api/analyses/${analysis.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ analysisStatus: 'failed' })
      });
      
      throw error;
    }
  }

  private async generateCombinedReport(job: BatchJob): Promise<void> {
    if (job.results.length === 0) return;
    
    const combinedMetrics = {
      totalSamples: job.results.length,
      totalCells: job.results.reduce((sum, r) => sum + (r.totalCells || 0), 0),
      avgProgressive: job.results.reduce((sum, r) => sum + (r.progressiveMotility || 0), 0) / job.results.length,
      avgTotalMotility: job.results.reduce((sum, r) => sum + (r.totalMotility || 0), 0) / job.results.length,
      avgConcentration: job.results.reduce((sum, r) => sum + (r.concentration || 0), 0) / job.results.length,
      avgVAP: job.results.reduce((sum, r) => sum + (r.vap || 0), 0) / job.results.length,
      avgVCL: job.results.reduce((sum, r) => sum + (r.vcl || 0), 0) / job.results.length,
      avgVSL: job.results.reduce((sum, r) => sum + (r.vsl || 0), 0) / job.results.length,
      avgMorphology: job.results.reduce((sum, r) => sum + (r.morphologyScore || 0), 0) / job.results.length,
      avgVitality: job.results.reduce((sum, r) => sum + (r.vitalityScore || 0), 0) / job.results.length,
      processingTime: job.results.reduce((sum, r) => sum + (r.processingTime || 0), 0),
      startTime: job.startTime,
      endTime: job.endTime
    };
    
    console.log('Batch processing completed:', combinedMetrics);
  }

  getBatchJob(jobId: string): BatchJob | undefined {
    return this.activeJobs.get(jobId);
  }

  getAllJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values());
  }

  cancelBatchJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (job && (job.status === 'pending' || job.status === 'processing')) {
      job.status = 'cancelled';
      job.progress.currentStep = 'Job cancelled by user';
      
      // Remove from queue if pending
      const queueIndex = this.processingQueue.indexOf(jobId);
      if (queueIndex > -1) {
        this.processingQueue.splice(queueIndex, 1);
      }
      
      return true;
    }
    return false;
  }

  deleteBatchJob(jobId: string): boolean {
    if (this.activeJobs.has(jobId)) {
      this.cancelBatchJob(jobId);
      this.activeJobs.delete(jobId);
      return true;
    }
    return false;
  }

  getQueueStatus(): {
    activeJobs: number;
    pendingJobs: number;
    queueLength: number;
  } {
    const jobs = Array.from(this.activeJobs.values());
    const activeJobs = jobs.filter(j => j.status === 'processing').length;
    const pendingJobs = jobs.filter(j => j.status === 'pending').length;
    
    return {
      activeJobs,
      pendingJobs,
      queueLength: this.processingQueue.length
    };
  }

  exportResults(jobId: string, format: 'json' | 'csv' = 'json'): string {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (format === 'csv') {
      return this.exportToCSV(job.results);
    } else {
      return JSON.stringify(job.results, null, 2);
    }
  }

  private exportToCSV(results: AnalysisResult[]): string {
    if (results.length === 0) return '';
    
    const headers = [
      'Sample ID', 'Filename', 'Total Cells', 'Progressive (%)', 'Total Motility (%)',
      'Concentration', 'VAP', 'VCL', 'VSL', 'ALH', 'BCF',
      'Morphology Score', 'Vitality Score', 'Overall Score',
      'Processing Time (s)', 'Completed At'
    ];
    
    const rows = results.map(r => [
      r.sampleId,
      r.filename,
      r.totalCells || 0,
      r.progressiveMotility || 0,
      r.totalMotility || 0,
      r.concentration || 0,
      r.vap || 0,
      r.vcl || 0,
      r.vsl || 0,
      r.alh || 0,
      r.bcf || 0,
      r.morphologyScore || 0,
      r.vitalityScore || 0,
      r.overallScore || 0,
      r.processingTime || 0,
      r.completedAt || ''
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }
}

export const batchProcessor = new BatchProcessor();