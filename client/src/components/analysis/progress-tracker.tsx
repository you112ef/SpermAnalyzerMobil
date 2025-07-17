import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, Loader2, Info } from 'lucide-react';
import type { AnalysisProgress } from '@/types/analysis';

interface ProgressTrackerProps {
  progress: AnalysisProgress;
  detectedCells?: number;
  trackedCells?: number;
  processingTime?: number;
  isVideoAnalysis?: boolean;
}

export default function ProgressTracker({ 
  progress, 
  detectedCells = 0, 
  trackedCells = 0, 
  processingTime = 0,
  isVideoAnalysis = false 
}: ProgressTrackerProps) {
  const steps = [
    { 
      key: 'preprocessing', 
      name: isVideoAnalysis ? 'Video Frame Extraction' : 'Image Preprocessing', 
      icon: Check,
      description: isVideoAnalysis ? 'Extracting frames from video for analysis' : 'Enhancing image quality and reducing noise'
    },
    { 
      key: 'detection', 
      name: isVideoAnalysis ? 'Multi-frame Cell Detection' : 'Cell Detection', 
      icon: Loader2,
      description: isVideoAnalysis ? 'Identifying sperm cells across video frames' : 'Identifying sperm cells using AI models'
    },
    { 
      key: 'tracking', 
      name: isVideoAnalysis ? 'Real-time Motility Tracking' : 'Motility Tracking', 
      icon: Loader2,
      description: isVideoAnalysis ? 'Tracking cell movements across video timeline' : 'Analyzing cell movement patterns'
    },
    { 
      key: 'metrics', 
      name: 'CASA Metrics', 
      icon: Loader2,
      description: isVideoAnalysis ? 'Calculating real-time motility parameters' : 'Calculating motility parameters'
    }
  ];

  const getStepStatus = (stepKey: string) => {
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    const currentIndex = steps.findIndex(s => s.key === progress.step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'current': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isVideoAnalysis ? 'Real-time Video Analysis' : 'Analysis Progress'}
        </CardTitle>
        {isVideoAnalysis && (
          <p className="text-sm text-blue-600 font-medium">
            🎥 Processing video frames for motility tracking
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step) => {
            const status = getStepStatus(step.key);
            const Icon = status === 'completed' ? Check : 
                        status === 'current' ? Loader2 : 
                        step.icon;
            
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepColor(status)}`}>
                  <Icon className={`h-4 w-4 text-white ${status === 'current' ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{step.name}</p>
                  <p className="text-xs text-gray-500">
                    {status === 'completed' ? 'Completed' : 
                     status === 'current' ? `Processing... ${progress.progress}%` : 
                     'Waiting'}
                  </p>
                  {status === 'current' && (
                    <Progress value={progress.progress} className="mt-1 h-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Processing Info */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Processing Status:</strong> {progress.message}
              </p>
              <div className="mt-2 text-xs text-blue-700 space-y-1">
                <p>• Detected: {detectedCells} cells</p>
                <p>• Tracked: {trackedCells} cells</p>
                <p>• Processing Time: {processingTime.toFixed(1)}s</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
