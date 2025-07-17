import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DnaOff, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import UploadSection from '@/components/analysis/upload-section';
import ProgressTracker from '@/components/analysis/progress-tracker';
import ResultsDashboard from '@/components/analysis/results-dashboard';
import CASAMetrics from '@/components/analysis/casa-metrics';
import DetailedReport from '@/components/analysis/detailed-report';
import { tensorflowAnalyzer } from '@/lib/tensorflow-utils';
import { casaCalculator } from '@/lib/casa-calculator';
import { imageProcessor } from '@/lib/image-processor';
import { videoProcessor } from '@/lib/video-processor';
import { apiRequest } from '@/lib/queryClient';
import type { AnalysisResult, AnalysisProgress, DetectedCell } from '@/types/analysis';

export default function Home() {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress>({
    step: 'preprocessing',
    progress: 0,
    message: 'Waiting for image upload...'
  });
  const [detectedCells, setDetectedCells] = useState<DetectedCell[]>([]);
  const [processingTime, setProcessingTime] = useState(0);
  const [videoFrames, setVideoFrames] = useState<HTMLCanvasElement[]>([]);
  const [isVideoAnalysis, setIsVideoAnalysis] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load TensorFlow model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tensorflowAnalyzer.loadModel();
        console.log('TensorFlow model loaded successfully');
      } catch (error) {
        console.error('Error loading TensorFlow model:', error);
        toast({
          title: "Model Loading Error",
          description: "Failed to load AI model. Some features may not work properly.",
          variant: "destructive"
        });
      }
    };

    loadModel();

    return () => {
      tensorflowAnalyzer.dispose();
    };
  }, [toast]);

  // Fetch all analyses
  const { data: analyses } = useQuery({
    queryKey: ['/api/analyses'],
    select: (data) => data as AnalysisResult[]
  });

  // Create analysis mutation
  const createAnalysisMutation = useMutation({
    mutationFn: async ({ file, parameters }: { file: File; parameters: any }) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('parameters', JSON.stringify(parameters));
      
      const response = await apiRequest('POST', '/api/analyses', formData);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentAnalysis(data);
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
    },
    onError: (error) => {
      console.error('Error creating analysis:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update analysis mutation
  const updateAnalysisMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/analyses/${id}`, updates);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentAnalysis(data);
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
    }
  });

  const handleFileUpload = async (file: File, parameters: any) => {
    setIsAnalyzing(true);
    setProgress({
      step: 'preprocessing',
      progress: 0,
      message: 'Uploading image and initializing analysis...'
    });

    try {
      // Create analysis record
      const analysis = await createAnalysisMutation.mutateAsync({ file, parameters });
      
      // Start processing
      await processAnalysis(analysis, file);
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVideoUpload = async (file: File, parameters: any) => {
    setIsAnalyzing(true);
    setIsVideoAnalysis(true);
    setProgress({
      step: 'preprocessing',
      progress: 0,
      message: 'Processing video file for real-time motility analysis...'
    });

    try {
      // Create analysis record
      const analysis = await createAnalysisMutation.mutateAsync({ file, parameters });
      
      // Start video processing
      await processVideoAnalysis(analysis, file);
      
    } catch (error) {
      console.error('Video analysis error:', error);
      toast({
        title: "Video Analysis Error",
        description: "Failed to analyze video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setIsVideoAnalysis(false);
    }
  };

  const processVideoAnalysis = async (analysis: AnalysisResult, file: File) => {
    const startTime = Date.now();
    
    try {
      // Process video frames
      const videoData = await videoProcessor.processVideoForMotilityTracking(
        file,
        (frameProgress) => {
          const overallProgress = Math.round((frameProgress.frame / frameProgress.total) * 60) + 20; // 20-80%
          setProgress({
            step: 'detection',
            progress: overallProgress,
            message: frameProgress.message
          });
        }
      );

      setVideoFrames(videoData.frames);

      // Track cells across frames for motility analysis
      setProgress({
        step: 'tracking',
        progress: 85,
        message: 'Tracking cell movements across video frames...'
      });

      const trackedCells = await analyzeVideoMotility(videoData);
      setDetectedCells(trackedCells);

      setProgress({
        step: 'metrics',
        progress: 95,
        message: 'Calculating real-time CASA metrics...'
      });

      // Calculate metrics from video analysis
      const casaMetrics = casaCalculator.calculateCASAMetrics(trackedCells);
      const qualityMetrics = casaCalculator.calculateQualityMetrics(trackedCells);
      const cellCounts = casaCalculator.calculateCellCounts(trackedCells);
      const statisticalData = casaCalculator.calculateStatisticalData(trackedCells);

      const endTime = Date.now();
      const totalProcessingTime = (endTime - startTime) / 1000;
      setProcessingTime(totalProcessingTime);

      // Update analysis with results
      const updates = {
        analysisStatus: 'completed',
        ...casaMetrics,
        ...qualityMetrics,
        ...cellCounts,
        statisticalData,
        processingTime: totalProcessingTime,
        completedAt: new Date().toISOString()
      };

      await updateAnalysisMutation.mutateAsync({ id: analysis.id, updates });

      setProgress({
        step: 'complete',
        progress: 100,
        message: 'Video analysis completed successfully!'
      });

      toast({
        title: "Video Analysis Complete",
        description: `Successfully analyzed ${trackedCells.length} cells across ${videoData.frames.length} frames in ${totalProcessingTime.toFixed(1)}s`,
      });

    } catch (error) {
      console.error('Video processing error:', error);
      
      await updateAnalysisMutation.mutateAsync({ 
        id: analysis.id, 
        updates: { analysisStatus: 'failed' }
      });

      throw error;
    }
  };

  const analyzeVideoMotility = async (videoData: any): Promise<DetectedCell[]> => {
    // Enhanced cell tracking across video frames
    const trackedCells: DetectedCell[] = [];
    const cellTracker = new Map<string, DetectedCell>();

    // Process detected cells from all frames
    for (const frameData of videoData.detectedCells) {
      for (const cell of frameData.cells) {
        const existingCell = Array.from(cellTracker.values()).find(tracked => {
          const distance = Math.sqrt(
            Math.pow(tracked.x - cell.x, 2) + Math.pow(tracked.y - cell.y, 2)
          );
          return distance < 20; // Tracking threshold
        });

        if (existingCell) {
          // Update existing track
          existingCell.track = existingCell.track || [];
          existingCell.track.push({
            x: cell.x,
            y: cell.y,
            timestamp: cell.timestamp * 1000
          });
          
          // Update motility classification based on movement
          if (existingCell.track.length > 3) {
            const movement = calculateMovementPattern(existingCell.track);
            existingCell.motilityType = movement.type;
          }
        } else {
          // New cell
          const newCell: DetectedCell = {
            id: cell.id,
            x: cell.x,
            y: cell.y,
            width: cell.width,
            height: cell.height,
            motilityType: 'immotile', // Will be updated as we track
            track: [{
              x: cell.x,
              y: cell.y,
              timestamp: cell.timestamp * 1000
            }]
          };
          cellTracker.set(cell.id, newCell);
        }
      }
    }

    return Array.from(cellTracker.values());
  };

  const calculateMovementPattern = (track: Array<{ x: number; y: number; timestamp: number }>) => {
    if (track.length < 3) return { type: 'immotile' as const };

    let totalDistance = 0;
    let straightLineDistance = 0;
    
    // Calculate total path distance
    for (let i = 1; i < track.length; i++) {
      const distance = Math.sqrt(
        Math.pow(track[i].x - track[i-1].x, 2) + 
        Math.pow(track[i].y - track[i-1].y, 2)
      );
      totalDistance += distance;
    }

    // Calculate straight line distance
    straightLineDistance = Math.sqrt(
      Math.pow(track[track.length - 1].x - track[0].x, 2) + 
      Math.pow(track[track.length - 1].y - track[0].y, 2)
    );

    const linearity = straightLineDistance / totalDistance;
    const averageSpeed = totalDistance / (track.length - 1);

    if (averageSpeed < 2) return { type: 'immotile' as const };
    if (linearity > 0.7 && averageSpeed > 5) return { type: 'progressive' as const };
    return { type: 'non-progressive' as const };
  };

  const processAnalysis = async (analysis: AnalysisResult, file: File) => {
    const startTime = Date.now();
    
    try {
      // Step 1: Image Preprocessing
      setProgress({
        step: 'preprocessing',
        progress: 10,
        message: 'Preprocessing image for analysis...'
      });

      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const processedCanvas = await imageProcessor.preprocessImage(img);
      
      setProgress({
        step: 'preprocessing',
        progress: 100,
        message: 'Image preprocessing complete'
      });

      // Step 2: Cell Detection
      setProgress({
        step: 'detection',
        progress: 20,
        message: 'Detecting sperm cells using AI models...'
      });

      const detections = await tensorflowAnalyzer.detectCells(img);
      
      setProgress({
        step: 'detection',
        progress: 70,
        message: `Detected ${detections.length} potential cells...`
      });

      // Step 3: Cell Tracking
      setProgress({
        step: 'tracking',
        progress: 80,
        message: 'Tracking cell movement patterns...'
      });

      const trackedCells = await tensorflowAnalyzer.trackCells(detections);
      setDetectedCells(trackedCells);
      
      setProgress({
        step: 'tracking',
        progress: 100,
        message: `Tracked ${trackedCells.length} cells successfully`
      });

      // Step 4: Calculate CASA Metrics
      setProgress({
        step: 'metrics',
        progress: 90,
        message: 'Calculating CASA metrics...'
      });

      const casaMetrics = casaCalculator.calculateCASAMetrics(trackedCells);
      const qualityMetrics = casaCalculator.calculateQualityMetrics(trackedCells);
      const cellCounts = casaCalculator.calculateCellCounts(trackedCells);
      const statisticalData = casaCalculator.calculateStatisticalData(trackedCells);

      const endTime = Date.now();
      const totalProcessingTime = (endTime - startTime) / 1000;
      setProcessingTime(totalProcessingTime);

      // Update analysis with results
      const updates = {
        analysisStatus: 'completed',
        ...casaMetrics,
        ...qualityMetrics,
        ...cellCounts,
        statisticalData,
        processingTime: totalProcessingTime,
        completedAt: new Date().toISOString()
      };

      await updateAnalysisMutation.mutateAsync({ id: analysis.id, updates });

      setProgress({
        step: 'complete',
        progress: 100,
        message: 'Analysis completed successfully!'
      });

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${trackedCells.length} cells in ${totalProcessingTime.toFixed(1)}s`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      
      // Update analysis status to failed
      await updateAnalysisMutation.mutateAsync({ 
        id: analysis.id, 
        updates: { analysisStatus: 'failed' }
      });

      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <DnaOff className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">CASA Pro</h1>
              <span className="ml-2 text-sm text-gray-500">Computer-Assisted Sperm Analysis with Real Video Tracking</span>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="#" className="text-blue-600 font-medium">Analysis</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Reports</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Settings</a>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload and Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <UploadSection 
            onFileUpload={handleFileUpload}
            onVideoUpload={handleVideoUpload}
            isAnalyzing={isAnalyzing}
          />
          
          <ProgressTracker 
            progress={progress}
            detectedCells={detectedCells.length}
            trackedCells={detectedCells.filter(c => c.track && c.track.length > 0).length}
            processingTime={processingTime}
            isVideoAnalysis={isVideoAnalysis}
          />
        </div>

        {/* Results Section */}
        {currentAnalysis && currentAnalysis.analysisStatus === 'completed' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <ResultsDashboard 
                  result={currentAnalysis}
                  detectedCells={detectedCells}
                />
              </div>
              
              <div>
                <CASAMetrics 
                  casa={currentAnalysis.casa}
                  quality={currentAnalysis.quality}
                />
              </div>
            </div>

            {/* Detailed Report */}
            <DetailedReport result={currentAnalysis} />
          </>
        )}
      </main>
    </div>
  );
}
