import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import type { AnalysisResult, DetectedCell } from '@/types/analysis';

interface DetailedReportProps {
  analysis: AnalysisResult;
  detectedCells?: DetectedCell[];
  processingTime?: number;
}

export default function DetailedReport({ analysis, detectedCells = [], processingTime = 0 }: DetailedReportProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // In a real implementation, this would generate a PDF
    console.log('Downloading PDF report...');
  };

  const formatValue = (value: number | null, decimals: number = 1) => {
    if (value === null) return 'N/A';
    return value.toFixed(decimals);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Detailed Analysis Report</CardTitle>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sample Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Sample Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Analysis Date:</span>
                <span className="font-medium">{formatDate(analysis.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Analysis Time:</span>
                <span className="font-medium">{formatTime(analysis.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sample ID:</span>
                <span className="font-medium">{analysis.sampleId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chamber Type:</span>
                <span className="font-medium">Makler Chamber</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Magnification:</span>
                <span className="font-medium">400x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Temperature:</span>
                <span className="font-medium">37°C</span>
              </div>
            </div>
          </div>

          {/* WHO Reference Values */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">WHO Reference Values (2021)</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Concentration:</span>
                <span className="font-medium">≥ 16 × 10⁶/mL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Progressive Motility:</span>
                <span className="font-medium">≥ 30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Motility:</span>
                <span className="font-medium">≥ 42%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Normal Morphology:</span>
                <span className="font-medium">≥ 4%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vitality:</span>
                <span className="font-medium">≥ 54%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Summary */}
        {analysis.statisticalData && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Statistical Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-2 text-left">Parameter</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Mean</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Std Dev</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Min</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Max</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Median</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">VAP (μm/s)</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vap.mean)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vap.std)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vap.min)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vap.max)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vap.median)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 font-medium">VCL (μm/s)</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vcl.mean)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vcl.std)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vcl.min)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vcl.max)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vcl.median)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">VSL (μm/s)</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vsl.mean)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vsl.std)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vsl.min)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vsl.max)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.vsl.median)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 font-medium">ALH (μm)</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.alh.mean)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.alh.std)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.alh.min)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.alh.max)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.alh.median)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">BCF (Hz)</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.bcf.mean)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.bcf.std)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.bcf.min)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.bcf.max)}</td>
                    <td className="border border-gray-200 px-4 py-2 text-center">{formatValue(analysis.statisticalData.bcf.median)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
