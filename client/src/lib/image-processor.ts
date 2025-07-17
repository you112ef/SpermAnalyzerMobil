export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async preprocessImage(imageElement: HTMLImageElement): Promise<HTMLCanvasElement> {
    this.canvas.width = imageElement.width;
    this.canvas.height = imageElement.height;
    
    // Draw original image
    this.ctx.drawImage(imageElement, 0, 0);
    
    // Get image data
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply preprocessing steps
    this.enhanceContrast(imageData);
    this.reduceNoise(imageData);
    this.normalizeIntensity(imageData);
    
    // Put processed image back
    this.ctx.putImageData(imageData, 0, 0);
    
    return this.canvas;
  }

  private enhanceContrast(imageData: ImageData): void {
    const data = imageData.data;
    const factor = 1.5; // Contrast enhancement factor
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast enhancement to RGB channels
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));     // Red
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)); // Green
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)); // Blue
    }
  }

  private reduceNoise(imageData: ImageData): void {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);
    
    // Simple 3x3 median filter for noise reduction
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels
          const neighbors = [];
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4 + c;
              neighbors.push(data[idx]);
            }
          }
          
          neighbors.sort((a, b) => a - b);
          const median = neighbors[Math.floor(neighbors.length / 2)];
          
          const idx = (y * width + x) * 4 + c;
          newData[idx] = median;
        }
      }
    }
    
    // Copy back the processed data
    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
  }

  private normalizeIntensity(imageData: ImageData): void {
    const data = imageData.data;
    
    // Find min and max values for each channel
    const mins = [255, 255, 255];
    const maxs = [0, 0, 0];
    
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        mins[c] = Math.min(mins[c], data[i + c]);
        maxs[c] = Math.max(maxs[c], data[i + c]);
      }
    }
    
    // Normalize each channel
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        if (maxs[c] > mins[c]) {
          data[i + c] = ((data[i + c] - mins[c]) / (maxs[c] - mins[c])) * 255;
        }
      }
    }
  }

  convertToGrayscale(imageElement: HTMLImageElement): HTMLCanvasElement {
    this.canvas.width = imageElement.width;
    this.canvas.height = imageElement.height;
    
    this.ctx.drawImage(imageElement, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    return this.canvas;
  }

  applyThreshold(imageElement: HTMLImageElement, threshold: number = 128): HTMLCanvasElement {
    this.canvas.width = imageElement.width;
    this.canvas.height = imageElement.height;
    
    this.ctx.drawImage(imageElement, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const binary = gray > threshold ? 255 : 0;
      
      data[i] = binary;     // Red
      data[i + 1] = binary; // Green
      data[i + 2] = binary; // Blue
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    return this.canvas;
  }

  drawDetectionOverlay(imageElement: HTMLImageElement, detections: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    motilityType: string;
  }>): HTMLCanvasElement {
    this.canvas.width = imageElement.width;
    this.canvas.height = imageElement.height;
    
    // Draw original image
    this.ctx.drawImage(imageElement, 0, 0);
    
    // Draw detection overlays
    detections.forEach((detection) => {
      const color = this.getMotilityColor(detection.motilityType);
      
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(detection.x, detection.y, detection.width, detection.height);
      
      // Draw center point
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(detection.x + detection.width / 2, detection.y + detection.height / 2, 2, 0, 2 * Math.PI);
      this.ctx.fill();
    });
    
    return this.canvas;
  }

  private getMotilityColor(motilityType: string): string {
    switch (motilityType) {
      case 'progressive':
        return '#388E3C'; // Green
      case 'non-progressive':
        return '#F57C00'; // Orange
      case 'immotile':
        return '#D32F2F'; // Red
      default:
        return '#757575'; // Gray
    }
  }
}

export const imageProcessor = new ImageProcessor();
