# 📱 Sperm Analyzer AI - Expo React Native App

## 🎯 Overview

A fully offline React Native app built with Expo for real-time sperm analysis using embedded TensorFlow.js AI models. Works 100% offline with no internet dependency.

## 🧠 AI Features

### Embedded AI Models
- **YOLOv8**: Real-time sperm cell detection and classification
- **DeepSORT**: Advanced multi-object tracking across video frames
- **TensorFlow.js**: On-device machine learning inference
- **CASA Calculator**: WHO 2021 compliant metrics calculation

### Analysis Capabilities
- 📸 **Image Analysis**: Single frame sperm detection and classification
- 📹 **Video Analysis**: Multi-frame tracking with motion analysis
- 📊 **CASA Metrics**: Complete fertility analysis (VCL, VSL, VAP, ALH, BCF)
- 🎯 **Real-time Detection**: Live camera preview with instant cell detection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio or Xcode for device testing

### Installation

```bash
# Clone and install dependencies
cd expo-app
npm install

# Start development server
npm start

# Run on specific platform
npm run android  # Android
npm run ios      # iOS
npm run web      # Web browser
```

### Building APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS (first time only)
eas login
eas build:configure

# Build APK for Android
npm run build:android

# Build for production
eas build --platform android --profile production
```

## 📱 App Structure

### Core Screens
- **HomeScreen**: Main dashboard with analysis options
- **CameraScreen**: Camera interface with live AI detection
- **ResultsScreen**: Detailed analysis results with charts
- **HistoryScreen**: Previous analysis records and statistics

### AI Services
- **YOLOv8Service**: Sperm detection and classification
- **CASAService**: CASA metrics calculation and interpretation
- **TensorFlow Initialization**: Platform-specific AI setup

### Key Components
- React Native Paper for UI components
- React Navigation for screen navigation
- TensorFlow.js for AI inference
- Expo Camera for image/video capture
- Chart Kit for data visualization

## 🎨 Features

### User Interface
- ✅ Modern Arabic/English interface
- ✅ Material Design with React Native Paper
- ✅ Dark/light theme support
- ✅ Responsive design for all screen sizes
- ✅ Accessible components with proper labels

### Analysis Features
- ✅ Real-time sperm cell detection
- ✅ Motility classification (progressive, non-progressive, immotile)
- ✅ Complete CASA metrics calculation
- ✅ WHO 2021 compliance
- ✅ Clinical interpretation and grading
- ✅ Export and sharing capabilities

### Performance
- ✅ 100% offline operation
- ✅ On-device AI inference
- ✅ Optimized for mobile performance
- ✅ Efficient memory management
- ✅ Fast processing with GPU acceleration

## 📊 CASA Metrics

### Velocity Parameters
- **VCL**: Curvilinear velocity (μm/s)
- **VSL**: Straight line velocity (μm/s)
- **VAP**: Average path velocity (μm/s)

### Additional Parameters
- **ALH**: Amplitude of lateral head displacement (μm)
- **BCF**: Beat cross frequency (Hz)
- **LIN**: Linearity (VSL/VCL)
- **STR**: Straightness (VSL/VAP)
- **WOB**: Wobble (VAP/VCL)

### Clinical Grading
- **Grade A**: ≥32% progressive motility (Excellent)
- **Grade B**: 25-31% progressive motility (Good)
- **Grade C**: 15-24% progressive motility (Fair)
- **Grade D**: <15% progressive motility (Poor)

## 🔧 Configuration

### AI Models
Place your trained TensorFlow.js models in the `assets` folder:
- `yolov8_sperm.json` - YOLOv8 model architecture
- `yolov8_sperm.bin` - YOLOv8 model weights
- `deepsort_features.json` - DeepSORT feature extractor (optional)

### Camera Settings
- Default resolution: 1920x1080
- Video recording: 30 FPS, 720p
- Image capture: JPEG, 80% quality
- Auto-focus and flash control

### Performance Tuning
```javascript
// Adjust these parameters in src/services/YOLOv8Service.ts
const INPUT_SIZE = 640;           // Model input size
const CONFIDENCE_THRESHOLD = 0.5; // Detection confidence
const NMS_THRESHOLD = 0.4;        // Non-maximum suppression
```

## 📱 Platform Specific

### Android
- Minimum SDK: 24 (Android 7.0)
- Target SDK: 34 (Android 14)
- Required permissions: Camera, Storage
- APK size: ~25MB (with AI models)

### iOS
- Minimum version: iOS 13.0
- Required permissions: Camera, Photo Library
- App Store compatible
- TestFlight distribution supported

### Web
- Progressive Web App (PWA) support
- Camera access via WebRTC
- TensorFlow.js web backend
- Works in modern browsers

## 🧪 Testing

### Real Device Testing
```bash
# Install Expo Go app on your device
# Scan QR code from 'npm start'
# Or use development build for full features
```

### AI Model Testing
```bash
# Test with sample images
# Verify detection accuracy
# Check CASA calculations
# Validate performance metrics
```

## 📦 Deployment

### Expo Go (Development)
- Quick testing and development
- Limited to Expo SDK features
- No custom native code

### Development Build
- Full native capabilities
- Custom AI models
- Production-ready features

### Standalone App
- Independent APK/IPA
- No Expo Go dependency
- Full offline functionality

## 🔍 Troubleshooting

### Common Issues

1. **AI Model Loading Failed**
   - Verify model files in assets folder
   - Check TensorFlow.js compatibility
   - Ensure sufficient device memory

2. **Camera Permission Denied**
   - Request permissions in app settings
   - Restart the app after granting permissions
   - Test on physical device (not simulator)

3. **Poor Detection Accuracy**
   - Check image quality and lighting
   - Verify model training data quality
   - Adjust confidence thresholds

4. **Performance Issues**
   - Close other apps to free memory
   - Test on newer devices
   - Reduce model complexity if needed

### Performance Tips
- Use development build for optimal performance
- Test on devices with 4GB+ RAM
- Enable GPU acceleration when available
- Optimize images before analysis

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [TensorFlow.js Guide](https://www.tensorflow.org/js)
- [React Native Paper](https://reactnativepaper.com/)
- [WHO 2021 Semen Analysis Guidelines](https://www.who.int/publications/i/item/9789240030787)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Medical Disclaimer

This application is for research and educational purposes only. It should not be used as the sole basis for medical diagnosis or treatment decisions. Always consult with qualified medical professionals for clinical interpretation of results.