# 🚀 Build Guide - Sperm Analyzer Expo App

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher  
- **Expo CLI**: Latest version (`npm install -g @expo/cli`)
- **EAS CLI**: For building (`npm install -g eas-cli`)

### Platform Requirements

#### Android
- **Android Studio**: Latest version
- **Android SDK**: API level 24-34
- **Java**: JDK 11 or higher
- **Physical Device**: Android 7.0+ (recommended for testing)

#### iOS (macOS only)
- **Xcode**: 14.0 or higher
- **iOS Simulator**: iOS 13.0+
- **Apple Developer Account**: For device testing and distribution

## 🔧 Setup Instructions

### 1. Project Installation

```bash
# Navigate to expo app directory
cd expo-app

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli

# Install EAS CLI for building
npm install -g eas-cli
```

### 2. Verify Installation

```bash
# Check Expo CLI version
expo --version

# Check EAS CLI version
eas --version

# Check project configuration
expo doctor
```

## 🏃‍♂️ Development Mode

### Local Development

```bash
# Start development server
npm start
# or
expo start

# Start with specific options
expo start --clear        # Clear cache
expo start --offline      # Offline mode
expo start --tunnel       # Tunnel connection
```

### Platform-Specific Development

```bash
# Run on Android
npm run android
# or
expo start --android

# Run on iOS (macOS only)
npm run ios
# or 
expo start --ios

# Run on web browser
npm run web
# or
expo start --web
```

### Testing with Expo Go

1. Install Expo Go app on your mobile device
2. Run `npm start` on your computer
3. Scan QR code with Expo Go app
4. App will load on your device

**Note**: Expo Go has limitations with custom native code and AI models. For full functionality, use development builds.

## 🔨 Building for Production

### Setup EAS Build

```bash
# Login to Expo account
eas login

# Initialize EAS configuration
eas build:configure

# This creates eas.json if it doesn't exist
```

### Build Profiles

#### Development Build (Recommended for AI features)

```bash
# Build development version
eas build --platform android --profile development

# Install on device
eas build:run --platform android --latest
```

#### Preview Build (APK for testing)

```bash
# Build APK for testing
eas build --platform android --profile preview

# Download and install manually
```

#### Production Build

```bash
# Build production APK
eas build --platform android --profile production

# Build for both platforms
eas build --platform all --profile production
```

### Build Status and Download

```bash
# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Cancel running build
eas build:cancel [BUILD_ID]
```

## 📱 AI Model Integration

### Preparing AI Models

1. **Train YOLOv8 Model**:
   ```python
   from ultralytics import YOLO
   
   # Train model
   model = YOLO('yolov8n.pt')
   results = model.train(data='sperm_dataset.yaml', epochs=100)
   
   # Export to TensorFlow.js
   model.export(format='tfjs', nms=True, simplify=True)
   ```

2. **Place Models in Assets**:
   ```
   expo-app/assets/
   ├── model.json          # YOLOv8 architecture
   ├── model_weights.bin   # YOLOv8 weights
   └── metadata.json       # Model metadata
   ```

3. **Update Model Loading**:
   ```typescript
   // In src/services/YOLOv8Service.ts
   const modelUrl = Asset.fromModule(require('../../assets/model.json')).uri;
   this.model = await tf.loadGraphModel(modelUrl);
   ```

## 🎯 Platform-Specific Builds

### Android APK

```bash
# Build release APK
eas build --platform android --profile production

# Build debug APK
eas build --platform android --profile preview

# Install on connected device
adb install app-release.apk
```

### iOS (macOS only)

```bash
# Build for iOS Simulator
eas build --platform ios --profile development

# Build for physical device (requires Apple Developer Account)
eas build --platform ios --profile production
```

### App Store / Play Store

```bash
# Build for stores
eas build --platform all --profile production

# Submit to stores (configure first)
eas submit --platform android
eas submit --platform ios
```

## 🛠️ Configuration Options

### App Configuration (app.json)

```json
{
  "expo": {
    "name": "Sperm Analyzer AI",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "android": {
      "package": "com.spermanalyzer.ai",
      "versionCode": 1,
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO"
      ]
    },
    "ios": {
      "bundleIdentifier": "com.spermanalyzer.ai",
      "buildNumber": "1.0.0"
    }
  }
}
```

### Build Configuration (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

## 🚀 Optimization

### Performance Optimization

1. **Bundle Size**:
   ```bash
   # Analyze bundle size
   npx expo-doctor
   
   # Enable Hermes (Android)
   # Add to app.json:
   "expo": {
     "android": {
       "jsEngine": "hermes"
     }
   }
   ```

2. **AI Model Optimization**:
   ```typescript
   // Use quantized models
   model.export(format='tfjs', int8=True)
   
   // Optimize inference
   tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
   ```

3. **Memory Management**:
   ```typescript
   // Dispose models when not needed
   this.model?.dispose();
   
   // Clear TensorFlow backend
   tf.engine().endScope();
   ```

## 🧪 Testing

### Local Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Lint code
npm run lint
```

### Device Testing

```bash
# Install on Android device
eas build:run --platform android --latest

# Test specific features
expo start --dev-client
```

### CI/CD Pipeline

```yaml
# .github/workflows/build.yml
name: Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: eas build --platform android --non-interactive
```

## 📦 Distribution

### Internal Distribution

```bash
# Build and share link
eas build --platform android --profile preview

# Share via QR code
eas build:view [BUILD_ID]
```

### App Store Distribution

```bash
# Build for production
eas build --platform all --profile production

# Submit to stores
eas submit --platform android --latest
eas submit --platform ios --latest
```

## 🔍 Troubleshooting

### Common Build Issues

1. **Dependency Conflicts**:
   ```bash
   # Clear cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Metro Bundler Issues**:
   ```bash
   # Reset Metro cache
   expo start --clear
   
   # Reset React Native cache
   npx react-native start --reset-cache
   ```

3. **Android Build Failures**:
   ```bash
   # Check Android SDK
   expo doctor
   
   # Update Gradle wrapper
   cd android && ./gradlew wrapper --gradle-version=7.5
   ```

4. **iOS Build Failures**:
   ```bash
   # Update CocoaPods
   cd ios && pod install --repo-update
   
   # Clean Xcode build
   xcodebuild clean
   ```

### AI Model Issues

1. **Model Loading Fails**:
   - Verify model files in assets folder
   - Check file paths in YOLOv8Service
   - Ensure TensorFlow.js compatibility

2. **Performance Issues**:
   - Test on physical device (not simulator)
   - Monitor memory usage
   - Optimize model size

3. **Camera Issues**:
   - Test permissions on real device
   - Check camera hardware compatibility
   - Verify Expo Camera version

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [TensorFlow.js for React Native](https://www.tensorflow.org/js/tutorials/react_native)
- [React Native Performance](https://reactnative.dev/docs/performance)

## 🆘 Support

For build issues:
1. Check Expo Community Forums
2. Review EAS Build logs
3. Test on different devices
4. Verify all dependencies are compatible

Remember: Development builds are recommended for AI-powered apps with custom models!