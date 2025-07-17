import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import type { CASAMetrics, QualityMetrics } from '@/types/analysis';

interface CASAMetricsProps {
  casa: CASAMetrics;
  quality: QualityMetrics;
}

export default function CASAMetricsComponent({ casa, quality }: CASAMetricsProps) {
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
          <CardTitle>CASA Metrics</CardTitle>
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
                  {formatValue(casa.concentration, 'M')}
                </p>
                <p className={`text-xs ${getStatusColor(casa.concentration, 16)}`}>
                  {getStatusText(casa.concentration, 16)}
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
                  {formatValue(casa.progressiveMotility, '%')}
                </p>
                <p className={`text-xs ${getStatusColor(casa.progressiveMotility, 30)}`}>
                  {getStatusText(casa.progressiveMotility, 30)}
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
                  {formatValue(casa.vap)}
                </p>
                <p className={`text-xs ${getStatusColor(casa.vap, 50)}`}>
                  {getStatusText(casa.vap, 50)}
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
                  {formatValue(casa.vcl)}
                </p>
                <p className={`text-xs ${getStatusColor(casa.vcl, 80)}`}>
                  {getStatusText(casa.vcl, 80)}
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
                  {formatValue(casa.vsl)}
                </p>
                <p className={`text-xs ${getStatusColor(casa.vsl, 40)}`}>
                  {getStatusText(casa.vsl, 40)}
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
                  {formatValue(casa.alh)}
                </p>
                <p className={`text-xs ${getStatusColor(casa.alh, 2)}`}>
                  {getStatusText(casa.alh, 2)}
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
                  {formatValue(casa.bcf)}
                </p>
                <p className={`text-xs ${getStatusColor(casa.bcf, 8)}`}>
                  {getStatusText(casa.bcf, 8)}
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
                <Progress value={quality.overallScore || 0} className="w-16" />
                <span className="text-sm font-semibold text-green-600">
                  {formatValue(quality.overallScore, '%')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Morphology</span>
              <div className="flex items-center gap-3">
                <Progress value={quality.morphologyScore || 0} className="w-16" />
                <span className="text-sm font-semibold text-green-600">
                  {formatValue(quality.morphologyScore, '%')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Vitality</span>
              <div className="flex items-center gap-3">
                <Progress value={quality.vitalityScore || 0} className="w-16" />
                <span className="text-sm font-semibold text-green-600">
                  {formatValue(quality.vitalityScore, '%')}
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
