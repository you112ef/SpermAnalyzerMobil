import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadSectionProps {
  onFileUpload: (file: File, parameters: any) => void;
  onVideoUpload: (file: File, parameters: any) => void;
  isAnalyzing: boolean;
}

export default function UploadSection({ onFileUpload, onVideoUpload, isAnalyzing }: UploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [parameters, setParameters] = useState({
    minCellSize: 2,
    maxCellSize: 10,
    magnification: 400,
    temperature: 37,
    chamberType: 'Makler Chamber'
  });
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    const isVideoFile = file.type.startsWith('video/');
    const isImageFile = file.type.startsWith('image/');

    if (!isVideoFile && !isImageFile) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image (JPG, PNG, TIFF) or video file (MP4, AVI, MOV, WEBM).",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // Increased limit for videos
      toast({
        title: "File too large",
        description: "Please select a file smaller than 50MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setIsVideo(isVideoFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleStartAnalysis = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image or video file first.",
        variant: "destructive"
      });
      return;
    }

    if (isVideo) {
      onVideoUpload(selectedFile, parameters);
    } else {
      onFileUpload(selectedFile, parameters);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Upload className="h-4 w-4 md:h-5 md:w-5" />
          رفع العينة
        </CardTitle>
        <p className="text-xs md:text-sm text-gray-600 mt-1">يدعم الصور والفيديوهات للتحليل</p>
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-800 font-medium">
            ✅ تحليل حقيقي بالكامل: يستخدم خوارزميات الذكاء الاصطناعي للكشف الفعلي عن الخلايا المنوية
          </p>
          <p className="text-xs text-green-700 mt-1">
            لا يتم استخدام أي بيانات وهمية - التحليل يعتمد على محتوى الصورة المرفوعة فقط
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 md:p-8 text-center cursor-pointer transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400 mb-2 md:mb-4" />
          <p className="text-sm md:text-base text-gray-600 mb-1 md:mb-2">Drop your sample here or tap to browse</p>
          <p className="text-xs md:text-sm text-gray-500">Images (JPG, PNG, TIFF) and Videos (MP4, AVI, MOV, WEBM) up to 50MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
        </div>

        {/* File Preview - Mobile Responsive */}
        {imagePreview && (
          <div className="bg-gray-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-xs md:text-sm font-medium text-gray-700">
                Selected {isVideo ? 'Video' : 'Image'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                className="text-red-500 hover:text-red-600 h-6 w-6 md:h-8 md:w-8 p-0"
              >
                <X className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
            
            {isVideo ? (
              <video
                src={imagePreview}
                controls
                className="w-full h-32 md:h-48 object-contain rounded-lg bg-black"
                muted
                playsInline
              />
            ) : (
              <img
                src={imagePreview}
                alt="Microscopic sperm analysis sample"
                className="w-full h-32 md:h-48 object-cover rounded-lg"
              />
            )}
            
            <div className="mt-2 md:mt-3 text-xs md:text-sm text-gray-600 space-y-0.5 md:space-y-1">
              <p><strong>Filename:</strong> <span className="break-all">{selectedFile?.name}</span></p>
              <p><strong>Size:</strong> {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(1) : 0} MB</p>
              <p><strong>Type:</strong> {isVideo ? 'Video Analysis (Real-time Motility Tracking)' : 'Static Image Analysis'}</p>
            </div>
          </div>
        )}

        {/* Analysis Parameters - Mobile Responsive */}
        <div className="space-y-3 md:space-y-4">
          <Label className="text-sm md:text-base font-medium text-gray-700">Analysis Parameters</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label htmlFor="minCellSize" className="text-xs md:text-sm text-gray-600">
                Minimum Cell Size (μm)
              </Label>
              <Input
                id="minCellSize"
                type="number"
                value={parameters.minCellSize}
                onChange={(e) => setParameters(prev => ({ ...prev, minCellSize: Number(e.target.value) }))}
                className="mt-1 h-9 md:h-10"
              />
            </div>
            <div>
              <Label htmlFor="maxCellSize" className="text-xs md:text-sm text-gray-600">
                Maximum Cell Size (μm)
              </Label>
              <Input
                id="maxCellSize"
                type="number"
                value={parameters.maxCellSize}
                onChange={(e) => setParameters(prev => ({ ...prev, maxCellSize: Number(e.target.value) }))}
                className="mt-1 h-9 md:h-10"
              />
            </div>
          </div>
          
          <Button
            onClick={handleStartAnalysis}
            disabled={!selectedFile || isAnalyzing}
            className="w-full h-10 md:h-11 text-sm md:text-base"
          >
            <Play className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
