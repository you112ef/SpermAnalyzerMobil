import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { formatDistance } from 'date-fns';
import type { Analysis } from '@shared/schema';

export default function Results() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['/api/analyses'],
    select: (data) => data as Analysis[]
  });

  const filteredAnalyses = analyses?.filter(analysis => {
    const matchesSearch = analysis.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.sampleId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || analysis.analysisStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'processing': return <Badge className="bg-blue-100 text-blue-800">قيد المعالجة</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800">فشل</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800">في الانتظار</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">نتائج التحليل</h1>
          <p className="text-gray-600">عرض وإدارة جميع نتائج تحليل الحيوانات المنوية</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              فلاتر البحث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الملفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="حالة التحليل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="processing">قيد المعالجة</SelectItem>
                  <SelectItem value="failed">فشل</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                إحصائيات التحليل
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{analyses?.length || 0}</div>
              <div className="text-sm text-gray-500">إجمالي التحاليل</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {analyses?.filter(a => a.analysisStatus === 'completed').length || 0}
              </div>
              <div className="text-sm text-gray-500">مكتملة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {analyses?.filter(a => a.analysisStatus === 'processing').length || 0}
              </div>
              <div className="text-sm text-gray-500">قيد المعالجة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analyses?.filter(a => a.totalMotility && a.totalMotility > 40).length || 0}
              </div>
              <div className="text-sm text-gray-500">حركة جيدة</div>
            </CardContent>
          </Card>
        </div>

        {/* Results List */}
        {filteredAnalyses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-500">لم يتم العثور على تحاليل تطابق معايير البحث</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(analysis.analysisStatus)}
                      <div>
                        <h3 className="font-medium text-gray-900 truncate">{analysis.filename}</h3>
                        <p className="text-sm text-gray-500">المعرف: {analysis.sampleId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(analysis.analysisStatus)}
                      <Button variant="ghost" size="sm">
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {analysis.analysisStatus === 'completed' && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center text-sm">
                      <div>
                        <div className="font-semibold text-blue-600">
                          {analysis.totalMotility?.toFixed(1) || '0'}%
                        </div>
                        <div className="text-xs text-gray-500">الحركة الكلية</div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-600">
                          {analysis.progressiveMotility?.toFixed(1) || '0'}%
                        </div>
                        <div className="text-xs text-gray-500">الحركة التقدمية</div>
                      </div>
                      <div>
                        <div className="font-semibold text-purple-600">
                          {analysis.concentration?.toFixed(1) || '0'}M
                        </div>
                        <div className="text-xs text-gray-500">التركيز</div>
                      </div>
                      <div>
                        <div className="font-semibold text-orange-600">
                          {analysis.totalCells || '0'}
                        </div>
                        <div className="text-xs text-gray-500">العدد الكلي</div>
                      </div>
                      <div>
                        <div className="font-semibold text-indigo-600">
                          {analysis.overallScore?.toFixed(1) || '0'}%
                        </div>
                        <div className="text-xs text-gray-500">النتيجة العامة</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-600">
                          {analysis.processingTime?.toFixed(1) || '0'}s
                        </div>
                        <div className="text-xs text-gray-500">وقت المعالجة</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      {analysis.createdAt 
                        ? formatDistance(new Date(analysis.createdAt), new Date(), { addSuffix: true })
                        : 'وقت غير معروف'
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      الحجم: {(analysis.fileSize / 1024 / 1024).toFixed(1)} MB
                    </div>
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