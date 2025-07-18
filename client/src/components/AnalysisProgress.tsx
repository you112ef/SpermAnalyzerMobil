import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Activity } from 'lucide-react';
import type { ProgressInfo } from '@/types/analysis';

interface AnalysisProgressProps {
  progress: ProgressInfo;
  isAnalyzing: boolean;
  isVideoAnalysis?: boolean;
}

export function AnalysisProgress({ progress, isAnalyzing, isVideoAnalysis = false }: AnalysisProgressProps) {
  const getStepIcon = (step: string, currentStep: string) => {
    if (step === currentStep) {
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    const stepOrder = ['preprocessing', 'detection', 'tracking', 'metrics', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex < currentIndex || currentStep === 'complete') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (currentStep === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
  };

  const getStepName = (step: string) => {
    const names = {
      preprocessing: isVideoAnalysis ? 'معالجة الفيديو' : 'معالجة الصورة',
      detection: 'كشف الخلايا',
      tracking: 'تتبع الحركة',
      metrics: 'حساب المقاييس',
      complete: 'مكتمل'
    };
    return names[step as keyof typeof names] || step;
  };

  const steps = ['preprocessing', 'detection', 'tracking', 'metrics', 'complete'];

  if (!isAnalyzing) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            {isVideoAnalysis ? 'تحليل الفيديو جاري' : 'تحليل الصورة جاري'}
          </CardTitle>
          <Badge variant={progress.step === 'error' ? 'destructive' : 'secondary'}>
            {progress.progress}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress.progress} className="w-full" />
          <p className="text-sm text-gray-600 text-center">{progress.message}</p>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              {getStepIcon(step, progress.step)}
              <div className="flex-1">
                <div className="text-sm font-medium">{getStepName(step)}</div>
                {step === progress.step && (
                  <div className="text-xs text-gray-500 mt-1">
                    {progress.message}
                  </div>
                )}
              </div>
              {step === progress.step && (
                <Badge variant="outline" className="text-xs">
                  جاري...
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Error State */}
        {progress.step === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">حدث خطأ في التحليل</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{progress.message}</p>
          </div>
        )}

        {/* Success State */}
        {progress.step === 'complete' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">تم التحليل بنجاح</span>
            </div>
            <p className="text-sm text-green-600 mt-1">{progress.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}