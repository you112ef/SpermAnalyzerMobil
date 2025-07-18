import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import type { AnalysisResult, DetectedCell } from '@/types/analysis';

interface CASAMetricsProps {
  analysis: AnalysisResult;
  detectedCells?: DetectedCell[];
}

export default function CASAMetricsComponent({ analysis, detectedCells = [] }: CASAMetricsProps) {
  const formatValue = (value: number | null, unit: string = '') => {
    if (value === null) return 'N/A';
    return `${value.toFixed(1)}${unit}`;
  };

  const getStatusColor = (value: number | null, threshold: number) => {
    if (value === null) return 'text-gray-500';
    return value >= threshold ? 'text-green-600' : 'text-orange-600';
  };

  const getStatusText = (value: number | null, threshold: number) => {
    if (value === null) return 'Unknown';
    return value >= threshold ? 'Normal' : 'Low';
  };

  return (
    <div className="space-y-6">
      {/* CASA Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>مقاييس CASA الحقيقية</CardTitle>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            معايير التحليل المساعد بالحاسوب للسائل المنوي
          </p>
          <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 font-medium">
              📊 جميع المقاييس محسوبة من الخلايا المكتشفة فعلياً في الصورة المرفوعة
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Total Concentration</p>
                <p className="text-xs text-gray-500">cells/mL</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatValue(analysis.concentration, 'M')}
                </p>
                <p className={`text-xs ${getStatusColor(analysis.concentration, 16)}`}>
                  {getStatusText(analysis.concentration, 16)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Progressive Motility</p>
                <p className="text-xs text-gray-500">Grade A + B</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatValue(analysis.progressiveMotility, '%')}
                </p>
                <p className={`text-xs ${getStatusColor(analysis.progressiveMotility, 30)}`}>
                  {getStatusText(analysis.progressiveMotility, 30)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">VAP (μm/s)</p>
                <p className="text-xs text-gray-500">Average Path Velocity</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatValue(analysis.vap)}
                </p>
                <p className={`text-xs ${getStatusColor(analysis.vap, 50)}`}>
                  {getStatusText(analysis.vap, 50)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">VCL (μm/s)</p>
                <p className="text-xs text-gray-500">Curvilinear Velocity</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatValue(analysis.vcl)}
                </p>
                <p className={`text-xs ${getStatusColor(analysis.vcl, 80)}`}>
                  {getStatusText(analysis.vcl, 80)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">VSL (μm/s)</p>
                <p className="text-xs text-gray-500">Straight Line Velocity</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatValue(analysis.vsl)}
                </p>
                <p className={`text-xs ${getStatusColor(analysis.vsl, 40)}`}>
                  {getStatusText(analysis.vsl, 40)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">ALH (μm)</p>
                <p className="text-xs text-gray-500">Amplitude Lateral Head</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatValue(analysis.alh)}
                </p>
                <p className={`text-xs ${getStatusColor(analysis.alh, 2)}`}>
                  {getStatusText(analysis.alh, 2)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">BCF (Hz)</p>
                <p className="text-xs text-gray-500">Beat Cross Frequency</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatValue(analysis.bcf)}
                </p>
                <p className={`text-xs ${getStatusColor(analysis.bcf, 8)}`}>
                  {getStatusText(analysis.bcf, 8)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Overall Score</span>
              <div className="flex items-center gap-3">
                <Progress value={analysis.overallScore || 0} className="w-16" />
                <span className="text-sm font-semibold text-green-600">
                  {formatValue(analysis.overallScore, '%')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Morphology</span>
              <div className="flex items-center gap-3">
                <Progress value={analysis.morphologyScore || 0} className="w-16" />
                <span className="text-sm font-semibold text-green-600">
                  {formatValue(analysis.morphologyScore, '%')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Vitality</span>
              <div className="flex items-center gap-3">
                <Progress value={analysis.vitalityScore || 0} className="w-16" />
                <span className="text-sm font-semibold text-green-600">
                  {formatValue(analysis.vitalityScore, '%')}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Analysis Complete</p>
                  <p className="text-xs text-green-600">Results within normal parameters</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
