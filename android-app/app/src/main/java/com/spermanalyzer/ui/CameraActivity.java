package com.spermanalyzer.ui;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.YuvImage;
import android.media.Image;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.core.VideoCapture;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.ListenableFuture;
import com.spermanalyzer.databinding.ActivityCameraBinding;
import com.spermanalyzer.models.CASACalculator;
import com.spermanalyzer.models.DeepSORTTracker;
import com.spermanalyzer.models.YOLOv8Model;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CameraActivity extends AppCompatActivity {
    private static final String TAG = "CameraActivity";
    private static final int REQUEST_CODE_PERMISSIONS = 10;
    private static final String[] REQUIRED_PERMISSIONS = new String[]{
        Manifest.permission.CAMERA,
        Manifest.permission.WRITE_EXTERNAL_STORAGE
    };

    private ActivityCameraBinding binding;
    private ExecutorService cameraExecutor;
    private ImageCapture imageCapture;
    private VideoCapture videoCapture;
    private ProcessCameraProvider cameraProvider;
    private boolean isVideoMode = false;
    private boolean isRecording = false;
    private boolean isAnalyzing = false;

    // AI Models
    private YOLOv8Model yoloModel;
    private DeepSORTTracker tracker;
    private CASACalculator casaCalculator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityCameraBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Check if this is video mode
        isVideoMode = getIntent().getBooleanExtra("isVideo", false);
        
        if (allPermissionsGranted()) {
            startCamera();
        } else {
            ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS);
        }

        cameraExecutor = Executors.newSingleThreadExecutor();
        setupUI();
        initializeAIModels();
    }

    private void setupUI() {
        binding.captureButton.setOnClickListener(v -> {
            if (isVideoMode) {
                toggleVideoRecording();
            } else {
                takePhoto();
            }
        });

        binding.switchModeButton.setOnClickListener(v -> {
            isVideoMode = !isVideoMode;
            updateUI();
        });

        binding.backButton.setOnClickListener(v -> finish());

        updateUI();
    }

    private void updateUI() {
        if (isVideoMode) {
            binding.modeText.setText("Video Mode");
            binding.captureButton.setText(isRecording ? "Stop Recording" : "Start Recording");
        } else {
            binding.modeText.setText("Photo Mode");
            binding.captureButton.setText("Take Photo");
        }
        
        binding.switchModeButton.setText(isVideoMode ? "Switch to Photo" : "Switch to Video");
    }

    private void initializeAIModels() {
        new Thread(() -> {
            try {
                yoloModel = new YOLOv8Model();
                tracker = new DeepSORTTracker();
                casaCalculator = new CASACalculator();
                
                boolean modelLoaded = yoloModel.loadModel(this);
                
                runOnUiThread(() -> {
                    if (modelLoaded) {
                        binding.statusText.setText("AI Models Ready");
                        binding.statusText.setTextColor(getColor(android.R.color.holo_green_dark));
                    } else {
                        binding.statusText.setText("AI Models Failed to Load");
                        binding.statusText.setTextColor(getColor(android.R.color.holo_red_dark));
                    }
                });
                
            } catch (Exception e) {
                Log.e(TAG, "Error initializing AI models", e);
                runOnUiThread(() -> {
                    binding.statusText.setText("AI Models Error");
                    binding.statusText.setTextColor(getColor(android.R.color.holo_red_dark));
                });
            }
        }).start();
    }

    private boolean allPermissionsGranted() {
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        
        cameraProviderFuture.addListener(() -> {
            try {
                cameraProvider = cameraProviderFuture.get();
                bindCameraUseCases();
            } catch (ExecutionException | InterruptedException e) {
                Log.e(TAG, "Error starting camera", e);
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void bindCameraUseCases() {
        if (cameraProvider == null) return;

        // Preview
        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(binding.previewView.getSurfaceProvider());

        // ImageCapture
        imageCapture = new ImageCapture.Builder()
            .setTargetRotation(binding.previewView.getDisplay().getRotation())
            .build();

        // VideoCapture
        videoCapture = new VideoCapture.Builder()
            .setTargetRotation(binding.previewView.getDisplay().getRotation())
            .build();

        // ImageAnalysis for real-time detection
        ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
            .setTargetRotation(binding.previewView.getDisplay().getRotation())
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build();

        imageAnalysis.setAnalyzer(cameraExecutor, new SpermAnalyzer());

        // Camera selector
        CameraSelector cameraSelector = new CameraSelector.Builder()
            .requireLensFacing(CameraSelector.LENS_FACING_BACK)
            .build();

        try {
            cameraProvider.unbindAll();
            
            Camera camera = cameraProvider.bindToLifecycle(
                this, cameraSelector, preview, imageCapture, videoCapture, imageAnalysis);
            
            // Enable touch to focus
            binding.previewView.setOnTouchListener((v, event) -> {
                // Implement touch to focus
                return false;
            });

        } catch (Exception e) {
            Log.e(TAG, "Error binding camera use cases", e);
        }
    }

    private void takePhoto() {
        if (imageCapture == null || isAnalyzing) return;

        File photoFile = new File(getExternalFilesDir(null), "sperm_analysis_" + System.currentTimeMillis() + ".jpg");
        
        ImageCapture.OutputFileOptions outputOptions = new ImageCapture.OutputFileOptions.Builder(photoFile).build();

        imageCapture.takePicture(outputOptions, ContextCompat.getMainExecutor(this), 
            new ImageCapture.OnImageSavedCallback() {
                @Override
                public void onImageSaved(@NonNull ImageCapture.OutputFileResults output) {
                    String msg = "Photo saved: " + photoFile.getAbsolutePath();
                    Toast.makeText(CameraActivity.this, msg, Toast.LENGTH_SHORT).show();
                    Log.d(TAG, msg);
                    
                    // Analyze the captured image
                    analyzeImage(photoFile);
                }

                @Override
                public void onError(@NonNull ImageCaptureException exception) {
                    Log.e(TAG, "Photo capture failed", exception);
                    Toast.makeText(CameraActivity.this, "Photo capture failed", Toast.LENGTH_SHORT).show();
                }
            });
    }

    private void toggleVideoRecording() {
        if (isRecording) {
            stopVideoRecording();
        } else {
            startVideoRecording();
        }
    }

    private void startVideoRecording() {
        if (videoCapture == null) return;

        File videoFile = new File(getExternalFilesDir(null), "sperm_video_" + System.currentTimeMillis() + ".mp4");
        
        VideoCapture.OutputFileOptions outputOptions = new VideoCapture.OutputFileOptions.Builder(videoFile).build();

        videoCapture.startRecording(outputOptions, ContextCompat.getMainExecutor(this), 
            new VideoCapture.OnVideoSavedCallback() {
                @Override
                public void onVideoSaved(@NonNull VideoCapture.OutputFileResults output) {
                    String msg = "Video saved: " + videoFile.getAbsolutePath();
                    Toast.makeText(CameraActivity.this, msg, Toast.LENGTH_SHORT).show();
                    Log.d(TAG, msg);
                    
                    // Analyze the recorded video
                    analyzeVideo(videoFile);
                }

                @Override
                public void onError(int videoCaptureError, @NonNull String message, Throwable cause) {
                    Log.e(TAG, "Video recording failed: " + message, cause);
                    Toast.makeText(CameraActivity.this, "Video recording failed", Toast.LENGTH_SHORT).show();
                }
            });

        isRecording = true;
        updateUI();
    }

    private void stopVideoRecording() {
        if (videoCapture != null) {
            videoCapture.stopRecording();
            isRecording = false;
            updateUI();
        }
    }

    private void analyzeImage(File imageFile) {
        if (yoloModel == null || !yoloModel.isLoaded()) {
            Toast.makeText(this, "AI model not ready", Toast.LENGTH_SHORT).show();
            return;
        }

        isAnalyzing = true;
        binding.statusText.setText("Analyzing image...");
        binding.progressBar.setVisibility(View.VISIBLE);

        cameraExecutor.execute(() -> {
            try {
                Bitmap bitmap = BitmapFactory.decodeFile(imageFile.getAbsolutePath());
                if (bitmap == null) {
                    runOnUiThread(() -> {
                        Toast.makeText(this, "Failed to load image", Toast.LENGTH_SHORT).show();
                        isAnalyzing = false;
                        binding.progressBar.setVisibility(View.GONE);
                    });
                    return;
                }

                // Detect sperm cells
                List<YOLOv8Model.Detection> detections = yoloModel.detectSpermCells(bitmap);
                
                // For single image, create simple tracks
                tracker.reset();
                List<DeepSORTTracker.Track> tracks = tracker.update(detections);
                
                // Calculate CASA metrics
                CASACalculator.CASAMetrics metrics = casaCalculator.calculateMetrics(tracks);
                
                runOnUiThread(() -> {
                    binding.progressBar.setVisibility(View.GONE);
                    binding.statusText.setText("Analysis complete: " + detections.size() + " cells detected");
                    
                    // Navigate to results
                    showResults(imageFile.getAbsolutePath(), metrics, tracks);
                    isAnalyzing = false;
                });

            } catch (Exception e) {
                Log.e(TAG, "Error analyzing image", e);
                runOnUiThread(() -> {
                    Toast.makeText(this, "Analysis failed", Toast.LENGTH_SHORT).show();
                    isAnalyzing = false;
                    binding.progressBar.setVisibility(View.GONE);
                });
            }
        });
    }

    private void analyzeVideo(File videoFile) {
        // Video analysis would be more complex, involving frame extraction
        // For now, we'll show a placeholder
        Toast.makeText(this, "Video analysis not implemented yet", Toast.LENGTH_SHORT).show();
    }

    private void showResults(String imagePath, CASACalculator.CASAMetrics metrics, List<DeepSORTTracker.Track> tracks) {
        Intent intent = new Intent(this, ResultsActivity.class);
        intent.putExtra("imagePath", imagePath);
        intent.putExtra("totalCells", metrics.totalCells);
        intent.putExtra("motileCells", metrics.motileCells);
        intent.putExtra("progressiveCells", metrics.progressiveCells);
        intent.putExtra("motility", metrics.motility);
        intent.putExtra("progressiveMotility", metrics.progressiveMotility);
        intent.putExtra("vap", metrics.vap);
        intent.putExtra("vcl", metrics.vcl);
        intent.putExtra("vsl", metrics.vsl);
        intent.putExtra("alh", metrics.alh);
        intent.putExtra("bcf", metrics.bcf);
        startActivity(intent);
    }

    // Real-time analysis for preview
    private class SpermAnalyzer implements ImageAnalysis.Analyzer {
        @Override
        public void analyze(@NonNull ImageProxy image) {
            if (yoloModel == null || !yoloModel.isLoaded() || isAnalyzing) {
                image.close();
                return;
            }

            // Convert ImageProxy to Bitmap
            Bitmap bitmap = imageProxyToBitmap(image);
            image.close();

            if (bitmap != null) {
                // Quick detection for preview overlay
                List<YOLOv8Model.Detection> detections = yoloModel.detectSpermCells(bitmap);
                
                runOnUiThread(() -> {
                    // Update overlay with detection results
                    binding.detectionCount.setText("Detected: " + detections.size() + " cells");
                    binding.detectionCount.setVisibility(View.VISIBLE);
                });
            }
        }
    }

    private Bitmap imageProxyToBitmap(ImageProxy image) {
        try {
            Image.Plane[] planes = image.getPlanes();
            ByteBuffer yBuffer = planes[0].getBuffer();
            ByteBuffer uBuffer = planes[1].getBuffer();
            ByteBuffer vBuffer = planes[2].getBuffer();

            int ySize = yBuffer.remaining();
            int uSize = uBuffer.remaining();
            int vSize = vBuffer.remaining();

            byte[] nv21 = new byte[ySize + uSize + vSize];
            yBuffer.get(nv21, 0, ySize);
            vBuffer.get(nv21, ySize, vSize);
            uBuffer.get(nv21, ySize + vSize, uSize);

            YuvImage yuvImage = new YuvImage(nv21, ImageFormat.NV21, image.getWidth(), image.getHeight(), null);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            yuvImage.compressToJpeg(new Rect(0, 0, image.getWidth(), image.getHeight()), 100, out);
            byte[] imageBytes = out.toByteArray();
            
            return BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
        } catch (Exception e) {
            Log.e(TAG, "Error converting ImageProxy to Bitmap", e);
            return null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera();
            } else {
                Toast.makeText(this, "Permissions not granted", Toast.LENGTH_SHORT).show();
                finish();
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        cameraExecutor.shutdown();
        if (yoloModel != null) {
            yoloModel.close();
        }
    }
}