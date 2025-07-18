import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Play, 
  Pause, 
  X, 
  Download, 
  FileImage, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Settings,
  BarChart3
} from 'lucide-react';
import { batchProcessor } from '@/lib/batch-processor';
import type { BatchJob, BatchProcessingOptions } from '@/lib/batch-processor';

interface BatchProcessorProps {
  onJobComplete?: (jobId: string) => void;
}

export function BatchProcessor({ onJobComplete }: BatchProcessorProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeJobs, setActiveJobs] = useState<BatchJob[]>([]);
  const [processingOptions, setProcessingOptions] = useState<BatchProcessingOptions>({
    enableAdvancedTracking: true,
    saveIndividualResults: true,
    generateCombinedReport: true,
    maxConcurrentProcessing: 2,
    quality: 'balanced',
    outputFormat: 'json'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Poll for job updates
    const interval = setInterval(() => {
      const jobs = batchProcessor.getAllJobs();
      setActiveJobs(jobs);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "بعض الملفات غير مدعومة",
        description: "يتم دعم ملفات الصور والفيديو فقط",
        variant: "destructive"
      });
    }
    
    setSelectedFiles(imageFiles);
  };

  const startBatchProcessing = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "لا توجد ملفات محددة",
        description: "يرجى اختيار ملفات للمعالجة",
        variant: "destructive"
      });
      return;
    }

    try {
      const parameters = {
        minCellSize: 2,
        maxCellSize: 10,
        magnification: 400,
        temperature: 37,
        chamberType: "Makler Chamber"
      };

      const jobId = await batchProcessor.createBatchJob(
        selectedFiles, 
        parameters, 
        processingOptions
      );
      
      toast({
        title: "بدء المعالجة المجمعة",
        description: `تم إنشاء مهمة جديدة مع ${selectedFiles.length} ملف`,
      });
      
      setSelectedFiles([]);
      
    } catch (error) {
      toast({
        title: "فشل في بدء المعالجة",
        description: error instanceof Error ? error.message : "خطأ غير معروف",
        variant: "destructive"
      });
    }
  };

  const cancelJob = (jobId: string) => {
    if (batchProcessor.cancelBatchJob(jobId)) {
      toast({
        title: "تم إلغاء المهمة",
        description: "تم إيقاف المعالجة المجمعة",
      });
    }
  };

  const downloadResults = (jobId: string) => {
    try {
      const results = batchProcessor.exportResults(jobId, processingOptions.outputFormat);
      const blob = new Blob([results], { 
        type: processingOptions.outputFormat === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_results_${jobId}.${processingOptions.outputFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تم تحميل النتائج",
        description: "تم حفظ ملف النتائج بنجاح",
      });
    } catch (error) {
      toast({
        title: "فشل في التحميل",
        description: error instanceof Error ? error.message : "خطأ في تحميل النتائج",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary' as const,
      processing: 'default' as const,
      completed: 'secondary' as const,
      failed: 'destructive' as const,
      cancelled: 'outline' as const
    };
    
    const labels = {
      pending: 'في الانتظار',
      processing: 'جاري المعالجة',
      completed: 'مكتمل',
      failed: 'فشل',
      cancelled: 'ملغي'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            المعالجة المجمعة للصور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelection}
              className="hidden"
              id="batch-file-input"
            />
            <label
              htmlFor="batch-file-input"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileImage className="w-8 h-8 mb-2 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">انقر لاختيار الملفات</span> أو اسحبها هنا
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, TIFF, MP4 (حد أقصى 10MB لكل ملف)</p>
              </div>
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">الملفات المحددة ({selectedFiles.length})</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                    <FileImage className="h-4 w-4" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">جودة المعالجة</label>
              <select
                value={processingOptions.quality}
                onChange={(e) => setProcessingOptions(prev => ({ 
                  ...prev, 
                  quality: e.target.value as 'fast' | 'balanced' | 'precise'
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="fast">سريع</option>
                <option value="balanced">متوازن</option>
                <option value="precise">دقيق</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">تنسيق الإخراج</label>
              <select
                value={processingOptions.outputFormat}
                onChange={(e) => setProcessingOptions(prev => ({ 
                  ...prev, 
                  outputFormat: e.target.value as 'json' | 'csv'
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={processingOptions.enableAdvancedTracking}
                onChange={(e) => setProcessingOptions(prev => ({ 
                  ...prev, 
                  enableAdvancedTracking: e.target.checked
                }))}
              />
              <span className="text-sm">تفعيل التتبع المتقدم (DeepSORT)</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={processingOptions.generateCombinedReport}
                onChange={(e) => setProcessingOptions(prev => ({ 
                  ...prev, 
                  generateCombinedReport: e.target.checked
                }))}
              />
              <span className="text-sm">إنشاء تقرير مجمع</span>
            </label>
          </div>

          {/* Start Button */}
          <Button
            onClick={startBatchProcessing}
            disabled={selectedFiles.length === 0}
            className="w-full"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            بدء المعالجة المجمعة
          </Button>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              المهام النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  {/* Job Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">مهمة {job.id.slice(-8)}</span>
                      {getStatusBadge(job.status)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadResults(job.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          تحميل
                        </Button>
                      )}
                      
                      {(job.status === 'pending' || job.status === 'processing') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelJob(job.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          إلغاء
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  {job.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{job.progress.currentStep}</span>
                        <span>{job.progress.currentFile}/{job.progress.totalFiles}</span>
                      </div>
                      <Progress value={job.progress.overallProgress} />
                    </div>
                  )}

                  {/* Job Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">الملفات:</span>
                      <div className="font-medium">{job.files.length}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">النتائج:</span>
                      <div className="font-medium">{job.results.length}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">الأخطاء:</span>
                      <div className="font-medium text-red-500">{job.errors.length}</div>
                    </div>
                  </div>

                  {/* Errors */}
                  {job.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <h5 className="text-sm font-medium text-red-800 mb-1">الأخطاء:</h5>
                      <ul className="text-xs text-red-700 space-y-1">
                        {job.errors.slice(0, 3).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {job.errors.length > 3 && (
                          <li>... و {job.errors.length - 3} أخطاء أخرى</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}