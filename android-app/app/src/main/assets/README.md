# AI Models Assets

This directory contains the TensorFlow Lite models for offline sperm analysis.

## Required Models

### 1. YOLOv8 Model (`yolov8_sperm.tflite`)
- **Purpose**: Sperm cell detection and classification
- **Input**: 640x640 RGB image
- **Output**: Detections with bounding boxes and class probabilities
- **Classes**: 
  - 0: Progressive sperm
  - 1: Non-progressive sperm
  - 2: Immotile sperm
- **Size**: ~6MB

### 2. DeepSORT Feature Extractor (`deepsort_features.tflite`)
- **Purpose**: Feature extraction for tracking
- **Input**: 64x128 RGB image patches
- **Output**: 512-dimensional feature vectors
- **Size**: ~2MB

## Model Training

The models should be trained on a dataset of microscopic sperm images with proper annotations. The training process involves:

1. **Data Collection**: Microscopic images at 400x magnification
2. **Annotation**: Manual labeling of sperm cells with motility classification
3. **Training**: YOLOv8 training with custom dataset
4. **Conversion**: Convert to TensorFlow Lite format for mobile deployment

## Model Performance

Expected performance metrics:
- **Precision**: >85% for sperm detection
- **Recall**: >80% for sperm detection
- **Inference Time**: <100ms per frame on modern Android devices
- **Memory Usage**: <50MB during inference

## Usage

The models are automatically loaded by the Android application:
- `YOLOv8Model.java` handles detection
- `DeepSORTTracker.java` handles tracking
- `CASACalculator.java` computes CASA metrics

## Note

**The actual model files are not included in this repository due to size constraints. You need to:**

1. Train your own models using the specifications above
2. Convert them to TensorFlow Lite format
3. Place them in this assets directory
4. Ensure the filenames match the expectations in the code

## Model Optimization

For mobile deployment, consider:
- **Quantization**: Use INT8 quantization to reduce size
- **Pruning**: Remove unnecessary weights
- **Architecture**: Use efficient architectures like MobileNet backbone
- **Batching**: Process multiple detections in single inference