import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Calendar, Activity } from 'lucide-react';
import { formatDistance } from 'date-fns';
import type { Analysis } from '@shared/schema';

export default function Reports() {
  const { data: analyses, isLoading } = useQuery({
    queryKey: ['/api/analyses'],
    select: (data) => data as Analysis[]
  });

  const completedAnalyses = analyses?.filter(a => a.analysisStatus === 'completed') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Analysis Reports</h1>
          <p className="text-gray-600">View and manage your sperm analysis reports</p>
        </div>

        {completedAnalyses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports available</h3>
              <p className="text-gray-500 mb-4">Complete an analysis to generate your first report</p>
              <Button>
                <Activity className="h-4 w-4 mr-2" />
                Start New Analysis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {completedAnalyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg truncate">{analysis.filename}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {analysis.createdAt 
                            ? formatDistance(new Date(analysis.createdAt), new Date(), { addSuffix: true })
                            : 'Unknown date'
                          }
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysis.totalMotility?.toFixed(1) || '0'}%
                      </div>
                      <div className="text-xs text-gray-500">Total Motility</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analysis.progressiveMotility?.toFixed(1) || '0'}%
                      </div>
                      <div className="text-xs text-gray-500">Progressive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {analysis.concentration?.toFixed(1) || '0'}M
                      </div>
                      <div className="text-xs text-gray-500">Concentration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {analysis.totalCells || '0'}
                      </div>
                      <div className="text-xs text-gray-500">Total Cells</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}