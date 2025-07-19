import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Surface,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const theme = useTheme();

  const features = [
    {
      icon: 'camera',
      title: 'تحليل الصور',
      description: 'التقط صورة للعينة وحصل على تحليل فوري',
    },
    {
      icon: 'videocam',
      title: 'تحليل الفيديو',
      description: 'سجل فيديو للحصول على تحليل متقدم للحركة',
    },
    {
      icon: 'analytics',
      title: 'معايير CASA',
      description: 'حساب جميع المعايير الطبية وفقاً لمعايير WHO',
    },
    {
      icon: 'cloud-offline',
      title: 'يعمل بدون إنترنت',
      description: 'تحليل كامل باستخدام الذكاء الاصطناعي المحلي',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons
              name="medical"
              size={80}
              color={theme.colors.primary}
              style={styles.headerIcon}
            />
            <Title style={styles.title}>Sperm Analyzer AI</Title>
            <Paragraph style={styles.subtitle}>
              تحليل الحيوانات المنوية بالذكاء الاصطناعي
            </Paragraph>
            <Paragraph style={styles.subtitle}>
              100% Offline AI Analysis
            </Paragraph>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            icon="camera"
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
            onPress={() => navigation.navigate('Camera', { mode: 'photo' })}
          >
            📸 التقاط صورة
          </Button>

          <Button
            mode="contained"
            icon="videocam"
            style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonText}
            onPress={() => navigation.navigate('Camera', { mode: 'video' })}
          >
            📹 تسجيل فيديو
          </Button>

          <Button
            mode="outlined"
            icon="history"
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.buttonText, { color: theme.colors.primary }]}
            onPress={() => navigation.navigate('History')}
          >
            📊 عرض النتائج
          </Button>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Title style={styles.sectionTitle}>الميزات</Title>
          {features.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <Card.Content style={styles.featureContent}>
                <Ionicons
                  name={feature.icon as any}
                  size={40}
                  color={theme.colors.primary}
                  style={styles.featureIcon}
                />
                <View style={styles.featureText}>
                  <Title style={styles.featureTitle}>{feature.title}</Title>
                  <Paragraph style={styles.featureDescription}>
                    {feature.description}
                  </Paragraph>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* AI Info */}
        <Card style={styles.aiCard}>
          <Card.Content>
            <Title style={styles.aiTitle}>🧠 الذكاء الاصطناعي المدمج</Title>
            <Paragraph style={styles.aiDescription}>
              • YOLOv8 للكشف والتصنيف{'\n'}
              • DeepSORT للتتبع المتقدم{'\n'}
              • TensorFlow.js للمعالجة المحلية{'\n'}
              • CASA Calculator للمعايير الطبية
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
  },
  headerContent: {
    padding: 24,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#718096',
    marginBottom: 4,
  },
  actionContainer: {
    padding: 16,
    gap: 16,
  },
  actionButton: {
    borderRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    height: 64,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  aiCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#E6FFFA',
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2D3748',
  },
  aiDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4A5568',
  },
});

export default HomeScreen;