package com.spermanalyzer.models;

import android.content.Context;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.RectF;
import android.util.Log;

import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.gpu.GpuDelegate;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.List;

public class YOLOv8Model {
    private static final String TAG = "YOLOv8Model";
    private static final String MODEL_PATH = "yolov8_sperm.tflite";
    private static final int INPUT_SIZE = 640;
    private static final int NUM_CLASSES = 3; // progressive, non-progressive, immotile
    private static final float CONFIDENCE_THRESHOLD = 0.5f;
    private static final float NMS_THRESHOLD = 0.4f;

    private Interpreter tfliteInterpreter;
    private GpuDelegate gpuDelegate;
    private boolean isModelLoaded = false;

    public static class Detection {
        public float x, y, width, height;
        public float confidence;
        public int classId;
        public String className;
        
        public Detection(float x, float y, float width, float height, float confidence, int classId, String className) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.confidence = confidence;
            this.classId = classId;
            this.className = className;
        }
        
        public RectF getBoundingBox() {
            return new RectF(x - width/2, y - height/2, x + width/2, y + height/2);
        }
    }

    public YOLOv8Model() {
        // Constructor
    }

    public boolean loadModel(Context context) {
        try {
            // Load TensorFlow Lite model
            MappedByteBuffer tfliteModel = loadModelFile(context.getAssets(), MODEL_PATH);
            
            // Configure interpreter options
            Interpreter.Options options = new Interpreter.Options();
            options.setNumThreads(4);
            
            // Try to use GPU acceleration
            try {
                gpuDelegate = new GpuDelegate();
                options.addDelegate(gpuDelegate);
                Log.d(TAG, "GPU acceleration enabled");
            } catch (Exception e) {
                Log.w(TAG, "GPU acceleration not available, using CPU");
            }
            
            tfliteInterpreter = new Interpreter(tfliteModel, options);
            isModelLoaded = true;
            
            Log.d(TAG, "YOLOv8 model loaded successfully");
            return true;
            
        } catch (IOException e) {
            Log.e(TAG, "Error loading model", e);
            return false;
        }
    }

    private MappedByteBuffer loadModelFile(AssetManager assetManager, String modelPath) throws IOException {
        FileInputStream inputStream = new FileInputStream(assetManager.openFd(modelPath).getFileDescriptor());
        FileChannel fileChannel = inputStream.getChannel();
        long startOffset = assetManager.openFd(modelPath).getStartOffset();
        long declaredLength = assetManager.openFd(modelPath).getDeclaredLength();
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
    }

    public List<Detection> detectSpermCells(Bitmap bitmap) {
        if (!isModelLoaded || tfliteInterpreter == null) {
            Log.e(TAG, "Model not loaded");
            return new ArrayList<>();
        }

        // Preprocess image
        ByteBuffer inputBuffer = preprocessImage(bitmap);
        
        // Prepare output buffer
        float[][][] output = new float[1][25200][8]; // [batch, detections, data]
        
        // Run inference
        tfliteInterpreter.run(inputBuffer, output);
        
        // Post-process results
        List<Detection> detections = postprocessDetections(output[0], bitmap.getWidth(), bitmap.getHeight());
        
        Log.d(TAG, "Detected " + detections.size() + " sperm cells");
        return detections;
    }

    private ByteBuffer preprocessImage(Bitmap bitmap) {
        // Resize bitmap to input size
        Bitmap resizedBitmap = Bitmap.createScaledBitmap(bitmap, INPUT_SIZE, INPUT_SIZE, true);
        
        // Convert to ByteBuffer
        ByteBuffer inputBuffer = ByteBuffer.allocateDirect(4 * INPUT_SIZE * INPUT_SIZE * 3);
        inputBuffer.order(ByteOrder.nativeOrder());
        
        int[] pixels = new int[INPUT_SIZE * INPUT_SIZE];
        resizedBitmap.getPixels(pixels, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE);
        
        // Normalize pixel values to [0, 1]
        for (int pixel : pixels) {
            int r = (pixel >> 16) & 0xFF;
            int g = (pixel >> 8) & 0xFF;
            int b = pixel & 0xFF;
            
            inputBuffer.putFloat(r / 255.0f);
            inputBuffer.putFloat(g / 255.0f);
            inputBuffer.putFloat(b / 255.0f);
        }
        
        return inputBuffer;
    }

    private List<Detection> postprocessDetections(float[][] output, int originalWidth, int originalHeight) {
        List<Detection> detections = new ArrayList<>();
        String[] classNames = {"progressive", "non-progressive", "immotile"};
        
        for (int i = 0; i < output.length; i++) {
            float[] detection = output[i];
            
            // Extract box coordinates and confidence
            float x = detection[0];
            float y = detection[1];
            float width = detection[2];
            float height = detection[3];
            
            // Find class with highest confidence
            int bestClass = 0;
            float bestConfidence = detection[4];
            
            for (int j = 5; j < detection.length; j++) {
                if (detection[j] > bestConfidence) {
                    bestConfidence = detection[j];
                    bestClass = j - 4;
                }
            }
            
            // Filter by confidence threshold
            if (bestConfidence >= CONFIDENCE_THRESHOLD) {
                // Scale coordinates to original image size
                float scaledX = x * originalWidth / INPUT_SIZE;
                float scaledY = y * originalHeight / INPUT_SIZE;
                float scaledWidth = width * originalWidth / INPUT_SIZE;
                float scaledHeight = height * originalHeight / INPUT_SIZE;
                
                String className = bestClass < classNames.length ? classNames[bestClass] : "unknown";
                
                detections.add(new Detection(scaledX, scaledY, scaledWidth, scaledHeight, 
                                           bestConfidence, bestClass, className));
            }
        }
        
        // Apply Non-Maximum Suppression
        return applyNMS(detections);
    }

    private List<Detection> applyNMS(List<Detection> detections) {
        List<Detection> filteredDetections = new ArrayList<>();
        
        // Sort by confidence (highest first)
        detections.sort((a, b) -> Float.compare(b.confidence, a.confidence));
        
        boolean[] suppressed = new boolean[detections.size()];
        
        for (int i = 0; i < detections.size(); i++) {
            if (suppressed[i]) continue;
            
            Detection current = detections.get(i);
            filteredDetections.add(current);
            
            // Suppress overlapping detections
            for (int j = i + 1; j < detections.size(); j++) {
                if (suppressed[j]) continue;
                
                Detection other = detections.get(j);
                float iou = calculateIoU(current.getBoundingBox(), other.getBoundingBox());
                
                if (iou > NMS_THRESHOLD) {
                    suppressed[j] = true;
                }
            }
        }
        
        return filteredDetections;
    }

    private float calculateIoU(RectF box1, RectF box2) {
        float intersectionArea = calculateIntersectionArea(box1, box2);
        float unionArea = calculateArea(box1) + calculateArea(box2) - intersectionArea;
        
        return intersectionArea / unionArea;
    }

    private float calculateIntersectionArea(RectF box1, RectF box2) {
        float left = Math.max(box1.left, box2.left);
        float top = Math.max(box1.top, box2.top);
        float right = Math.min(box1.right, box2.right);
        float bottom = Math.min(box1.bottom, box2.bottom);
        
        if (left < right && top < bottom) {
            return (right - left) * (bottom - top);
        }
        return 0;
    }

    private float calculateArea(RectF box) {
        return (box.right - box.left) * (box.bottom - box.top);
    }

    public void close() {
        if (tfliteInterpreter != null) {
            tfliteInterpreter.close();
            tfliteInterpreter = null;
        }
        if (gpuDelegate != null) {
            gpuDelegate.close();
            gpuDelegate = null;
        }
        isModelLoaded = false;
    }

    public boolean isLoaded() {
        return isModelLoaded;
    }
}