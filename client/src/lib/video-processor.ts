export class VideoProcessor {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.video = document.createElement('video');
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    
    // Configure video element
    this.video.crossOrigin = 'anonymous';
    this.video.muted = true;
    this.video.playsInline = true;
  }

  async loadVideo(videoFile: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(videoFile);
      this.video.src = url;
      
      this.video.onloadedmetadata = () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        resolve(this.video);
      };
      
      this.video.onerror = () => {
        reject(new Error('Failed to load video'));
      };
    });
  }

  async extractFrames(intervalMs: number = 100): Promise<HTMLCanvasElement[]> {
    const frames: HTMLCanvasElement[] = [];
    const duration = this.video.duration * 1000; // Convert to milliseconds
    
    for (let time = 0; time < duration; time += intervalMs) {
      const frame = await this.extractFrameAtTime(time / 1000);
      if (frame) {
        frames.push(frame);
      }
    }
    
    return frames;
  }

  private extractFrameAtTime(timeInSeconds: number): Promise<HTMLCanvasElement | null> {
    return new Promise((resolve) => {
      this.video.currentTime = timeInSeconds;
      
      this.video.onseeked = () => {
        try {
          this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
          
          // Create a new canvas for this frame
          const frameCanvas = document.createElement('canvas');
          frameCanvas.width = this.canvas.width;
          frameCanvas.height = this.canvas.height;
          const frameCtx = frameCanvas.getContext('2d')!;
          frameCtx.drawImage(this.canvas, 0, 0);
          
          resolve(frameCanvas);
        } catch (error) {
          console.error('Error extracting frame:', error);
          resolve(null);
        }
      };
    });
  }

  async processVideoForMotilityTracking(
    videoFile: File,
    onProgress: (progress: { frame: number; total: number; message: string }) => void
  ): Promise<{
    frames: HTMLCanvasElement[];
    frameRate: number;
    duration: number;
    detectedCells: Array<{
      frameIndex: number;
      cells: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        timestamp: number;
      }>;
    }>;
  }> {
    await this.loadVideo(videoFile);
    
    const frameRate = 10; // 10 FPS for analysis
    const intervalMs = 1000 / frameRate;
    const duration = this.video.duration;
    
    onProgress({ frame: 0, total: Math.floor(duration * frameRate), message: 'Extracting video frames...' });
    
    const frames = await this.extractFrames(intervalMs);
    const detectedCells: Array<{
      frameIndex: number;
      cells: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        timestamp: number;
      }>;
    }> = [];

    // Process each frame for cell detection
    for (let i = 0; i < frames.length; i++) {
      onProgress({ 
        frame: i + 1, 
        total: frames.length, 
        message: `Analyzing frame ${i + 1}/${frames.length}...` 
      });

      const frame = frames[i];
      const timestamp = (i * intervalMs) / 1000;
      
      // Convert canvas to image element for TensorFlow processing
      const img = new Image();
      img.src = frame.toDataURL();
      
      await new Promise(resolve => {
        img.onload = resolve;
      });

      // Simulate cell detection (in real implementation, use TensorFlow)
      const cells = this.simulateCellDetection(img, timestamp);
      
      detectedCells.push({
        frameIndex: i,
        cells
      });
    }

    return {
      frames,
      frameRate,
      duration,
      detectedCells
    };
  }

  private simulateCellDetection(img: HTMLImageElement, timestamp: number) {
    const numCells = Math.floor(Math.random() * 30) + 50; // 50-80 cells per frame
    const cells = [];

    for (let i = 0; i < numCells; i++) {
      const x = Math.random() * img.width;
      const y = Math.random() * img.height;
      const width = Math.random() * 10 + 5;
      const height = Math.random() * 10 + 5;

      cells.push({
        id: `cell_${i}_${timestamp}`,
        x,
        y,
        width,
        height,
        timestamp
      });
    }

    return cells;
  }

  createVideoPlayer(videoFile: File): HTMLVideoElement {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.controls = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.style.width = '100%';
    video.style.maxHeight = '400px';
    video.style.objectFit = 'contain';
    
    return video;
  }

  dispose(): void {
    if (this.video.src) {
      URL.revokeObjectURL(this.video.src);
    }
  }
}

export const videoProcessor = new VideoProcessor();