# 🧠 Sperm Analyzer AI - Offline Android App

## Overview
A fully offline Android application that analyzes sperm from images and videos using embedded YOLOv8 + DeepSORT AI models. No internet connection required.

## Features
- 📸 Analyze images (JPG, PNG)
- 📹 Analyze videos (MP4, AVI)
- 🧠 Real YOLOv8 + DeepSORT AI model (embedded)
- 📊 CASA metrics calculation
- 🌐 100% offline operation
- 📱 Native Android APK
- 📈 Integrated graphs using MPAndroidChart

## Tech Stack
- **Android SDK**: Native Android development
- **ML Framework**: TensorFlow Lite / ONNX Runtime
- **AI Model**: YOLOv8 for detection + DeepSORT for tracking
- **Charts**: MPAndroidChart
- **Camera**: CameraX
- **Storage**: Room Database

## Project Structure
```
android-app/
├── app/
│   ├── src/main/java/com/spermanalyzer/
│   │   ├── MainActivity.java
│   │   ├── models/
│   │   │   ├── YOLOv8Model.java
│   │   │   ├── DeepSORTTracker.java
│   │   │   └── CASACalculator.java
│   │   ├── ui/
│   │   │   ├── CameraFragment.java
│   │   │   ├── ResultsFragment.java
│   │   │   └── AnalysisFragment.java
│   │   ├── utils/
│   │   │   ├── ImageProcessor.java
│   │   │   ├── VideoProcessor.java
│   │   │   └── FileUtils.java
│   │   └── database/
│   │       ├── AnalysisDatabase.java
│   │       └── AnalysisEntity.java
│   ├── src/main/assets/
│   │   ├── yolov8_sperm.tflite
│   │   └── deepsort_model.tflite
│   └── src/main/res/
├── build.gradle
└── gradlew
```

## Installation
1. Clone the repository
2. Open in Android Studio
3. Build and run on device/emulator

## Usage
1. Open the app
2. Take a photo or select a video
3. Wait for AI analysis
4. View detailed CASA metrics
5. Export results

## AI Models
- **YOLOv8**: Custom trained on sperm cell dataset
- **DeepSORT**: Multi-object tracking
- **Size**: ~15MB total (optimized for mobile)