import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  Send, 
  Check, 
  AlertCircle,
  Database,
  FileText,
  Download
} from 'lucide-react';
import LISIntegrationClient, { type LISConfiguration, type LISResult } from '@/lib/lis-integration';
import type { AnalysisResult } from '@/types/analysis';

interface LISIntegrationProps {
  analysis?: AnalysisResult;
  onResultSent?: (result: LISResult) => void;
}

export function LISIntegration({ analysis, onResultSent }: LISIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentResults, setSentResults] = useState<LISResult[]>([]);
  const [lisClient, setLisClient] = useState<LISIntegrationClient | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  const [config, setConfig] = useState<LISConfiguration>({
    endpoint: 'https://lis.example.com/api',
    apiKey: '',
    clientId: 'CASA_CLIENT',
    format: 'JSON',
    version: '1.0',
    testMode: true
  });

  const [patientInfo, setPatientInfo] = useState({
    patientId: '',
    patientName: '',
    dateOfBirth: '',
    gender: 'M',
    orderNumber: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (config.apiKey) {
      const client = new LISIntegrationClient(config);
      setLisClient(client);
    }
  }, [config]);

  const testConnection = async () => {
    if (!lisClient) return;
    
    setIsTesting(true);
    try {
      const connected = await lisClient.testConnection();
      setIsConnected(connected);
      
      toast({
        title: connected ? "اتصال ناجح" : "فشل الاتصال",
        description: connected ? "تم الاتصال بنظام LIS بنجاح" : "تعذر الاتصال بنظام LIS",
        variant: connected ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: error instanceof Error ? error.message : "خطأ غير معروف",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sendResults = async () => {
    if (!lisClient || !analysis) return;
    
    if (!patientInfo.patientId || !patientInfo.patientName) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى إدخال معرف المريض واسمه على الأقل",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const result = await lisClient.sendResults(analysis, patientInfo);
      setSentResults(prev => [...prev, result]);
      onResultSent?.(result);
      
      toast({
        title: "تم إرسال النتائج",
        description: `تم إرسال نتائج العينة ${analysis.sampleId} إلى نظام LIS`,
      });
    } catch (error) {
      toast({
        title: "فشل إرسال النتائج",
        description: error instanceof Error ? error.message : "خطأ في إرسال النتائج",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary' as const,
      in_progress: 'default' as const,
      completed: 'secondary' as const,
      failed: 'destructive' as const
    };
    
    const labels = {
      pending: 'في الانتظار',
      in_progress: 'جاري الإرسال',
      completed: 'مكتمل',
      failed: 'فشل'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              تكامل أنظمة المختبرات (LIS)
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(isConnected)}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfig(!showConfig)}
              >
                <Settings className="h-4 w-4 mr-1" />
                إعدادات
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Panel */}
          {showConfig && (
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <h4 className="font-medium">إعدادات الاتصال</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نقطة النهاية</label>
                  <input
                    type="url"
                    value={config.endpoint}
                    onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                    className="w-full p-2 border rounded-md text-sm"
                    placeholder="https://lis.example.com/api"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">مفتاح API</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full p-2 border rounded-md text-sm"
                    placeholder="أدخل مفتاح API"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">معرف العميل</label>
                  <input
                    type="text"
                    value={config.clientId}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">تنسيق البيانات</label>
                  <select
                    value={config.format}
                    onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value as any }))}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="JSON">JSON</option>
                    <option value="HL7">HL7</option>
                    <option value="XML">XML</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.testMode}
                  onChange={(e) => setConfig(prev => ({ ...prev, testMode: e.target.checked }))}
                  id="test-mode"
                />
                <label htmlFor="test-mode" className="text-sm">وضع الاختبار</label>
              </div>
            </div>
          )}

          {/* Connection Test */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(isConnected)}
              <span className="text-sm font-medium">
                حالة الاتصال: {isConnected ? 'متصل' : 'غير متصل'}
              </span>
            </div>
            <Button
              size="sm"
              onClick={testConnection}
              disabled={isTesting || !config.apiKey}
            >
              {isTesting ? 'جاري الاختبار...' : 'اختبار الاتصال'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Information */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              معلومات المريض والإرسال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">معرف المريض *</label>
                <input
                  type="text"
                  value={patientInfo.patientId}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="P12345"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">اسم المريض *</label>
                <input
                  type="text"
                  value={patientInfo.patientName}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, patientName: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="أحمد محمد"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ الميلاد</label>
                <input
                  type="date"
                  value={patientInfo.dateOfBirth}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">الجنس</label>
                <select
                  value={patientInfo.gender}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="M">ذكر</option>
                  <option value="F">أنثى</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">رقم الطلب</label>
                <input
                  type="text"
                  value={patientInfo.orderNumber}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, orderNumber: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  placeholder={analysis.sampleId}
                />
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h5 className="text-sm font-medium mb-2">ملخص التحليل</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">العينة:</span>
                  <div className="font-medium">{analysis.sampleId}</div>
                </div>
                <div>
                  <span className="text-gray-600">الخلايا:</span>
                  <div className="font-medium">{analysis.totalCells || 0}</div>
                </div>
                <div>
                  <span className="text-gray-600">الحركة التقدمية:</span>
                  <div className="font-medium">{analysis.progressiveMotility?.toFixed(1) || 0}%</div>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={sendResults}
              disabled={isSending || !isConnected || !analysis || !patientInfo.patientId || !patientInfo.patientName}
              className="w-full"
              size="lg"
            >
              {isSending ? (
                <>جاري الإرسال...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  إرسال النتائج إلى LIS
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sent Results History */}
      {sentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              سجل النتائج المرسلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="font-medium">العينة {result.sampleId}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {result.timestamp.toLocaleString('ar-SA')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">المريض:</span>
                      <div className="font-medium">{result.patientId}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">نوع الاختبار:</span>
                      <div className="font-medium">{result.testName}</div>
                    </div>
                  </div>
                  
                  {result.reportUrl && (
                    <div>
                      <a
                        href={result.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        عرض التقرير في LIS
                      </a>
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