# Build Instructions for Sperm Analyzer AI

## Prerequisites

1. **Android Studio**: Download and install the latest version from [developer.android.com](https://developer.android.com/studio)
2. **Java JDK 11 or higher**: Required for Android development
3. **Android SDK**: Will be installed automatically with Android Studio

## Setup Steps

### 1. Import Project
1. Open Android Studio
2. Select "Open an Existing Project"
3. Navigate to the `android-app` folder and select it
4. Wait for Gradle sync to complete

### 2. Configure SDK
1. Go to File → Project Structure → SDK Location
2. Ensure Android SDK location is set correctly
3. Download required SDK platforms (API 24-34) if prompted

### 3. Add AI Models (IMPORTANT)
The app requires trained AI models to function. You need to:

1. Train YOLOv8 model on sperm cell dataset
2. Convert to TensorFlow Lite format (.tflite)
3. Place the following files in `app/src/main/assets/`:
   - `yolov8_sperm.tflite` (main detection model)
   - `deepsort_features.tflite` (optional, for enhanced tracking)

**Note**: The app will not function without these model files.

### 4. Build the APK

#### Option A: Debug APK (for testing)
```bash
cd android-app
./gradlew assembleDebug
```
APK will be generated at: `app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Release APK (for distribution)
```bash
cd android-app
./gradlew assembleRelease
```
APK will be generated at: `app/build/outputs/apk/release/app-release.apk`

#### Option C: Using Android Studio
1. Build → Generate Signed Bundle/APK
2. Select APK
3. Choose debug or release
4. Click Build

### 5. Install APK
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Model Training Guide

### Data Requirements
- Microscopic sperm images at 400x magnification
- Annotations in YOLO format with classes:
  - 0: Progressive sperm
  - 1: Non-progressive sperm  
  - 2: Immotile sperm

### Training Process
1. Prepare dataset with proper annotations
2. Train YOLOv8 model:
```python
from ultralytics import YOLO

# Load model
model = YOLO('yolov8n.pt')

# Train
results = model.train(
    data='sperm_dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16
)

# Export to TensorFlow Lite
model.export(format='tflite', int8=True)
```

### Model Optimization
- Use INT8 quantization for smaller size
- Target input size: 640x640
- Expected model size: ~6MB after optimization

## Troubleshooting

### Common Issues

1. **Gradle Sync Failed**
   - Check internet connection
   - Update Android Studio
   - Clear Gradle cache: `./gradlew clean`

2. **Build Errors**
   - Ensure Java 11+ is installed
   - Check SDK versions in build.gradle
   - Sync project with Gradle files

3. **App Crashes on Launch**
   - Verify AI models are in assets folder
   - Check device has sufficient memory
   - Enable USB debugging for logs

4. **Camera Not Working**
   - Grant camera permissions
   - Test on physical device (emulator limitations)
   - Check manifest permissions

### Performance Tips
- Test on Android 8.0+ for best performance
- Use devices with 4GB+ RAM
- Enable hardware acceleration if available

## File Structure
```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/spermanalyzer/     # Java source code
│   │   ├── res/                       # Resources (layouts, drawables)
│   │   ├── assets/                    # AI models go here
│   │   └── AndroidManifest.xml
│   └── build.gradle                   # App dependencies
├── build.gradle                       # Project configuration
└── settings.gradle                    # Project settings
```

## Next Steps
1. Train and add AI models
2. Test on real devices
3. Optimize performance
4. Add additional features as needed

For support, refer to the Android documentation or contact the development team.