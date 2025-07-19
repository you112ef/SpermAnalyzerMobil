import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  Text,
} from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { Button, Surface, useTheme, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

// Import AI services
import { YOLOv8Service } from '../services/YOLOv8Service';
import { CASAService } from '../services/CASAService';

const { width, height } = Dimensions.get('window');

interface CameraScreenProps {
  navigation: any;
  route: any;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const cameraRef = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [flash, setFlash] = useState(FlashMode.off);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [aiStatus, setAiStatus] = useState('Loading AI Models...');

  const mode = route.params?.mode || 'photo';
  const yoloService = useRef(new YOLOv8Service());
  const casaService = useRef(new CASAService());

  useEffect(() => {
    requestPermissions();
    initializeAI();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === 'granted' && mediaStatus === 'granted');
  };

  const initializeAI = async () => {
    try {
      setAiStatus('Loading AI Models...');
      
      // Initialize YOLO model
      const yoloLoaded = await yoloService.current.loadModel();
      
      if (yoloLoaded) {
        setAiStatus('AI Models Ready');
        console.log('AI models loaded successfully');
      } else {
        setAiStatus('AI Models Failed to Load');
        console.error('Failed to load AI models');
      }
    } catch (error) {
      setAiStatus('AI Models Error');
      console.error('Error initializing AI:', error);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsAnalyzing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      // Analyze the image with AI
      const analysisResults = await analyzeImage(photo.uri);
      
      // Navigate to results screen
      navigation.navigate('Results', {
        imageUri: photo.uri,
        analysisResults,
        mode: 'photo',
      });

    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('خطأ', 'فشل في التقاط الصورة');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(true);
      
      const video = await cameraRef.current.recordAsync({
        quality: Camera.Constants.VideoQuality['720p'],
        maxDuration: 30, // 30 seconds max
      });

      setIsRecording(false);
      
      // Analyze the video
      setIsAnalyzing(true);
      const analysisResults = await analyzeVideo(video.uri);
      
      navigation.navigate('Results', {
        videoUri: video.uri,
        analysisResults,
        mode: 'video',
      });

    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('خطأ', 'فشل في تسجيل الفيديو');
    } finally {
      setIsRecording(false);
      setIsAnalyzing(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
  };

  const analyzeImage = async (imageUri: string) => {
    try {
      // Detect sperm cells using YOLO
      const detections = await yoloService.current.detectSpermCells(imageUri);
      setDetectionCount(detections.length);

      // Calculate CASA metrics
      const casaMetrics = casaService.current.calculateStaticMetrics(detections);

      return {
        detections,
        casaMetrics,
        totalCells: detections.length,
        motileCells: detections.filter(d => d.motilityType !== 'immotile').length,
        progressiveCells: detections.filter(d => d.motilityType === 'progressive').length,
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  };

  const analyzeVideo = async (videoUri: string) => {
    try {
      // For video analysis, we would extract frames and analyze each
      // This is simplified for demo purposes
      const frameAnalyses = await yoloService.current.analyzeVideoFrames(videoUri);
      const casaMetrics = casaService.current.calculateDynamicMetrics(frameAnalyses);

      return {
        frameAnalyses,
        casaMetrics,
        totalFrames: frameAnalyses.length,
      };
    } catch (error) {
      console.error('Error analyzing video:', error);
      throw error;
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.permissionText}>طلب الأذونات...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={80} color={theme.colors.error} />
        <Text style={styles.permissionText}>لا يوجد إذن للوصول إلى الكاميرا</Text>
        <Button mode="contained" onPress={requestPermissions}>
          طلب الإذن
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={type}
        flashMode={flash}
        ratio="16:9"
      >
        {/* Top Controls */}
        <Surface style={styles.topControls}>
          <Button
            icon="arrow-back"
            mode="contained-tonal"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            رجوع
          </Button>
          
          <Text style={styles.modeText}>
            {mode === 'photo' ? 'وضع الصورة' : 'وضع الفيديو'}
          </Text>

          <Button
            icon={flash === FlashMode.off ? 'flash-off' : 'flash'}
            mode="contained-tonal"
            onPress={() => setFlash(flash === FlashMode.off ? FlashMode.on : FlashMode.off)}
            style={styles.flashButton}
          />
        </Surface>

        {/* Detection Overlay */}
        <View style={styles.detectionOverlay}>
          <Surface style={styles.statusCard}>
            <Text style={styles.statusText}>{aiStatus}</Text>
            {detectionCount > 0 && (
              <Text style={styles.detectionText}>
                تم الكشف عن: {detectionCount} خلية
              </Text>
            )}
          </Surface>
        </View>

        {/* Bottom Controls */}
        <Surface style={styles.bottomControls}>
          {isAnalyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.analyzingText}>جاري التحليل...</Text>
            </View>
          ) : (
            <>
              <Button
                icon="camera-flip"
                mode="contained-tonal"
                onPress={() => setType(type === CameraType.back ? CameraType.front : CameraType.back)}
                style={styles.flipButton}
              />

              <Button
                icon={mode === 'photo' ? 'camera' : isRecording ? 'stop' : 'videocam'}
                mode="contained"
                style={[
                  styles.captureButton,
                  { backgroundColor: isRecording ? theme.colors.error : theme.colors.primary }
                ]}
                contentStyle={styles.captureButtonContent}
                onPress={mode === 'photo' ? takePicture : isRecording ? stopRecording : startRecording}
                disabled={aiStatus !== 'AI Models Ready'}
              >
                {mode === 'photo' ? '📸' : isRecording ? '⏹️' : '📹'}
              </Button>

              <Button
                icon="swap-horizontal"
                mode="contained-tonal"
                onPress={() => navigation.setParams({ mode: mode === 'photo' ? 'video' : 'photo' })}
                style={styles.modeButton}
              />
            </>
          )}
        </Surface>
      </Camera>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    color: '#2D3748',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backButton: {
    minWidth: 80,
  },
  modeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flashButton: {
    minWidth: 80,
  },
  detectionOverlay: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  statusCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2D3748',
  },
  detectionText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    color: '#48BB78',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  analyzingContainer: {
    flex: 1,
    alignItems: 'center',
  },
  analyzingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
  },
  flipButton: {
    width: 60,
    height: 60,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  captureButtonContent: {
    width: 80,
    height: 80,
  },
  modeButton: {
    width: 60,
    height: 60,
  },
});

export default CameraScreen;