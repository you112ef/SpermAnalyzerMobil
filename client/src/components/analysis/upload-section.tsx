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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Microscopic Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Drop your microscopic image or video here or click to browse</p>
          <p className="text-sm text-gray-500">Supports JPG, PNG, TIFF images and MP4, AVI, MOV, WEBM videos up to 50MB</p>
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

        {/* File Preview */}
        {imagePreview && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Selected {isVideo ? 'Video' : 'Image'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                className="text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {isVideo ? (
              <video
                src={imagePreview}
                controls
                className="w-full h-48 object-contain rounded-lg bg-black"
                muted
                playsInline
              />
            ) : (
              <img
                src={imagePreview}
                alt="Microscopic sperm analysis sample"
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            
            <div className="mt-3 text-sm text-gray-600 space-y-1">
              <p><strong>Filename:</strong> {selectedFile?.name}</p>
              <p><strong>Size:</strong> {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(1) : 0} MB</p>
              <p><strong>Type:</strong> {isVideo ? 'Video Analysis (Real-time Motility Tracking)' : 'Static Image Analysis'}</p>
            </div>
          </div>
        )}

        {/* Analysis Parameters */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">Analysis Parameters</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minCellSize" className="text-xs text-gray-600">
                Minimum Cell Size (μm)
              </Label>
              <Input
                id="minCellSize"
                type="number"
                value={parameters.minCellSize}
                onChange={(e) => setParameters(prev => ({ ...prev, minCellSize: Number(e.target.value) }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxCellSize" className="text-xs text-gray-600">
                Maximum Cell Size (μm)
              </Label>
              <Input
                id="maxCellSize"
                type="number"
                value={parameters.maxCellSize}
                onChange={(e) => setParameters(prev => ({ ...prev, maxCellSize: Number(e.target.value) }))}
                className="mt-1"
              />
            </div>
          </div>
          
          <Button
            onClick={handleStartAnalysis}
            disabled={!selectedFile || isAnalyzing}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
