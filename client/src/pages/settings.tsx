import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Database, 
  Camera, 
  Bell, 
  Shield, 
  Download, 
  Trash2,
  RefreshCw,
  Save,
  Globe,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // Analysis Settings
    defaultMinCellSize: 2,
    defaultMaxCellSize: 10,
    defaultMagnification: 400,
    defaultTemperature: 37,
    defaultChamberType: 'Makler Chamber',
    
    // AI Model Settings
    detectionThreshold: 0.7,
    trackingAccuracy: 'high',
    
    // Data Settings
    autoSaveResults: true,
    exportFormat: 'pdf',
    dataRetention: '1-year',
    
    // Notifications
    analysisComplete: true,
    errorAlerts: true,
    
    // Interface
    language: 'ar',
    theme: 'light',
    compactView: false,
  });

  const handleSave = () => {
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم حفظ جميع التغييرات بنجاح",
    });
  };

  const handleReset = () => {
    toast({
      title: "تم إعادة تعيين الإعدادات",
      description: "تم إرجاع الإعدادات إلى القيم الافتراضية",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">الإعدادات</h1>
          <p className="text-gray-600">إدارة إعدادات التطبيق والتحليل</p>
        </div>

        <div className="space-y-6">
          {/* Analysis Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                إعدادات التحليل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minCellSize">الحد الأدنى لحجم الخلية (μm)</Label>
                  <Input
                    id="minCellSize"
                    type="number"
                    value={settings.defaultMinCellSize}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      defaultMinCellSize: Number(e.target.value) 
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxCellSize">الحد الأقصى لحجم الخلية (μm)</Label>
                  <Input
                    id="maxCellSize"
                    type="number"
                    value={settings.defaultMaxCellSize}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      defaultMaxCellSize: Number(e.target.value) 
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="magnification">التكبير الافتراضي</Label>
                  <Select 
                    value={settings.defaultMagnification.toString()} 
                    onValueChange={(value) => setSettings(prev => ({ 
                      ...prev, 
                      defaultMagnification: Number(value) 
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100x</SelectItem>
                      <SelectItem value="200">200x</SelectItem>
                      <SelectItem value="400">400x</SelectItem>
                      <SelectItem value="1000">1000x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="temperature">درجة الحرارة (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={settings.defaultTemperature}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      defaultTemperature: Number(e.target.value) 
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="chamberType">نوع الغرفة</Label>
                <Select 
                  value={settings.defaultChamberType} 
                  onValueChange={(value) => setSettings(prev => ({ 
                    ...prev, 
                    defaultChamberType: value 
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Makler Chamber">Makler Chamber</SelectItem>
                    <SelectItem value="Neubauer Chamber">Neubauer Chamber</SelectItem>
                    <SelectItem value="CASA Chamber">CASA Chamber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI Model Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                إعدادات نموذج الذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="detectionThreshold">عتبة الكشف</Label>
                  <Badge variant="secondary">{settings.detectionThreshold}</Badge>
                </div>
                <Input
                  id="detectionThreshold"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.detectionThreshold}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    detectionThreshold: Number(e.target.value) 
                  }))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  قيمة أقل = اكتشاف أكثر حساسية، قيمة أعلى = اكتشاف أكثر دقة
                </p>
              </div>
              
              <div>
                <Label htmlFor="trackingAccuracy">دقة التتبع</Label>
                <Select 
                  value={settings.trackingAccuracy} 
                  onValueChange={(value) => setSettings(prev => ({ 
                    ...prev, 
                    trackingAccuracy: value 
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة (سريعة)</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية (بطيئة)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                إدارة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSave">الحفظ التلقائي للنتائج</Label>
                  <p className="text-sm text-gray-500">حفظ النتائج تلقائياً عند اكتمال التحليل</p>
                </div>
                <Switch
                  id="autoSave"
                  checked={settings.autoSaveResults}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    autoSaveResults: checked 
                  }))}
                />
              </div>
              
              <Separator />
              
              <div>
                <Label htmlFor="exportFormat">تنسيق التصدير الافتراضي</Label>
                <Select 
                  value={settings.exportFormat} 
                  onValueChange={(value) => setSettings(prev => ({ 
                    ...prev, 
                    exportFormat: value 
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dataRetention">فترة الاحتفاظ بالبيانات</Label>
                <Select 
                  value={settings.dataRetention} 
                  onValueChange={(value) => setSettings(prev => ({ 
                    ...prev, 
                    dataRetention: value 
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3-months">3 أشهر</SelectItem>
                    <SelectItem value="6-months">6 أشهر</SelectItem>
                    <SelectItem value="1-year">سنة واحدة</SelectItem>
                    <SelectItem value="indefinite">غير محدود</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analysisComplete">إشعار اكتمال التحليل</Label>
                  <p className="text-sm text-gray-500">إشعار عند انتهاء عملية التحليل</p>
                </div>
                <Switch
                  id="analysisComplete"
                  checked={settings.analysisComplete}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    analysisComplete: checked 
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="errorAlerts">تنبيهات الأخطاء</Label>
                  <p className="text-sm text-gray-500">إشعار عند حدوث خطأ في التحليل</p>
                </div>
                <Switch
                  id="errorAlerts"
                  checked={settings.errorAlerts}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    errorAlerts: checked 
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Interface Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                إعدادات الواجهة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="language">اللغة</Label>
                <Select 
                  value={settings.language} 
                  onValueChange={(value) => setSettings(prev => ({ 
                    ...prev, 
                    language: value 
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="theme">المظهر</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value) => setSettings(prev => ({ 
                    ...prev, 
                    theme: value 
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">فاتح</SelectItem>
                    <SelectItem value="dark">داكن</SelectItem>
                    <SelectItem value="auto">تلقائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compactView">العرض المضغوط</Label>
                  <p className="text-sm text-gray-500">عرض أكثر المعلومات في مساحة أقل</p>
                </div>
                <Switch
                  id="compactView"
                  checked={settings.compactView}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    compactView: checked 
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              حفظ الإعدادات
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة تعيين
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              تصدير الإعدادات
            </Button>
            <Button variant="destructive" className="flex-1">
              <Trash2 className="h-4 w-4 mr-2" />
              حذف جميع البيانات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}