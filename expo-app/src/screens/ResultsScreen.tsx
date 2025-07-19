import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Surface,
  useTheme,
  Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface ResultsScreenProps {
  navigation: any;
  route: any;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { imageUri, videoUri, analysisResults, mode } = route.params;

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(49, 130, 206, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(45, 55, 72, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const motilityData = [
    {
      name: 'Progressive',
      population: analysisResults.progressiveCells,
      color: '#48BB78',
      legendFontColor: '#2D3748',
      legendFontSize: 12,
    },
    {
      name: 'Non-Progressive',
      population: analysisResults.casaMetrics.nonProgressiveCells,
      color: '#ED8936',
      legendFontColor: '#2D3748',
      legendFontSize: 12,
    },
    {
      name: 'Immotile',
      population: analysisResults.casaMetrics.immotileCells,
      color: '#E53E3E',
      legendFontColor: '#2D3748',
      legendFontSize: 12,
    },
  ];

  const velocityData = {
    labels: ['VAP', 'VCL', 'VSL'],
    datasets: [
      {
        data: [
          analysisResults.casaMetrics.vap,
          analysisResults.casaMetrics.vcl,
          analysisResults.casaMetrics.vsl,
        ],
      },
    ],
  };

  const shareResults = () => {
    // Implementation for sharing results
    console.log('Sharing results...');
  };

  const saveResults = () => {
    // Implementation for saving results
    console.log('Saving results...');
  };

  const getMotilityGrade = (progressiveMotility: number) => {
    if (progressiveMotility >= 32) return { grade: 'A', color: '#48BB78' };
    if (progressiveMotility >= 25) return { grade: 'B', color: '#38B2AC' };
    if (progressiveMotility >= 15) return { grade: 'C', color: '#ED8936' };
    return { grade: 'D', color: '#E53E3E' };
  };

  const motilityGrade = getMotilityGrade(analysisResults.casaMetrics.progressiveMotility);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <Button
              icon="arrow-back"
              mode="contained-tonal"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              رجوع
            </Button>
            
            <Title style={styles.title}>نتائج التحليل</Title>
            
            <View style={styles.headerActions}>
              <Button
                icon="share"
                mode="contained-tonal"
                onPress={shareResults}
                style={styles.actionButton}
              />
              <Button
                icon="content-save"
                mode="contained-tonal"
                onPress={saveResults}
                style={styles.actionButton}
              />
            </View>
          </View>
        </Surface>

        {/* Sample Image/Video */}
        <Card style={styles.mediaCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>العينة المحللة</Title>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.sampleImage} />
            )}
            {videoUri && (
              <View style={styles.videoPlaceholder}>
                <Ionicons name="videocam" size={60} color={theme.colors.primary} />
                <Paragraph>فيديو العينة</Paragraph>
              </View>
            )}
            <View style={styles.modeChip}>
              <Chip icon={mode === 'photo' ? 'camera' : 'videocam'} mode="outlined">
                {mode === 'photo' ? 'تحليل صورة' : 'تحليل فيديو'}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Summary Metrics */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>ملخص النتائج</Title>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Title style={styles.summaryValue}>{analysisResults.totalCells}</Title>
                <Paragraph style={styles.summaryLabel}>إجمالي الخلايا</Paragraph>
              </View>
              
              <View style={styles.summaryItem}>
                <Title style={[styles.summaryValue, { color: theme.colors.primary }]}>
                  {analysisResults.casaMetrics.motility.toFixed(1)}%
                </Title>
                <Paragraph style={styles.summaryLabel}>الحركة الكلية</Paragraph>
              </View>
              
              <View style={styles.summaryItem}>
                <Title style={[styles.summaryValue, { color: motilityGrade.color }]}>
                  {analysisResults.casaMetrics.progressiveMotility.toFixed(1)}%
                </Title>
                <Paragraph style={styles.summaryLabel}>الحركة التقدمية</Paragraph>
              </View>
              
              <View style={styles.summaryItem}>
                <Chip 
                  style={[styles.gradeChip, { backgroundColor: motilityGrade.color }]}
                  textStyle={{ color: 'white', fontWeight: 'bold' }}
                >
                  Grade {motilityGrade.grade}
                </Chip>
                <Paragraph style={styles.summaryLabel}>تصنيف الحركة</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Motility Distribution Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>توزيع الحركة</Title>
            <PieChart
              data={motilityData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 10]}
            />
          </Card.Content>
        </Card>

        {/* CASA Velocity Parameters */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>معايير السرعة (CASA)</Title>
            
            <View style={styles.velocityGrid}>
              <View style={styles.velocityItem}>
                <Title style={styles.velocityValue}>
                  {analysisResults.casaMetrics.vap.toFixed(1)}
                </Title>
                <Paragraph style={styles.velocityLabel}>VAP (μm/s)</Paragraph>
                <Paragraph style={styles.velocityDescription}>
                  متوسط سرعة المسار
                </Paragraph>
              </View>
              
              <View style={styles.velocityItem}>
                <Title style={styles.velocityValue}>
                  {analysisResults.casaMetrics.vcl.toFixed(1)}
                </Title>
                <Paragraph style={styles.velocityLabel}>VCL (μm/s)</Paragraph>
                <Paragraph style={styles.velocityDescription}>
                  السرعة المنحنية
                </Paragraph>
              </View>
              
              <View style={styles.velocityItem}>
                <Title style={styles.velocityValue}>
                  {analysisResults.casaMetrics.vsl.toFixed(1)}
                </Title>
                <Paragraph style={styles.velocityLabel}>VSL (μm/s)</Paragraph>
                <Paragraph style={styles.velocityDescription}>
                  السرعة المستقيمة
                </Paragraph>
              </View>
            </View>
            
            <BarChart
              data={velocityData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.barChart}
              yAxisLabel=""
              yAxisSuffix=" μm/s"
              showValuesOnTopOfBars
            />
          </Card.Content>
        </Card>

        {/* Additional CASA Parameters */}
        <Card style={styles.parametersCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>معايير CASA الإضافية</Title>
            
            <View style={styles.parametersGrid}>
              <View style={styles.parameterItem}>
                <Title style={styles.parameterValue}>
                  {analysisResults.casaMetrics.alh.toFixed(1)} μm
                </Title>
                <Paragraph style={styles.parameterLabel}>ALH</Paragraph>
                <Paragraph style={styles.parameterDescription}>
                  سعة الإزاحة الجانبية للرأس
                </Paragraph>
              </View>
              
              <View style={styles.parameterItem}>
                <Title style={styles.parameterValue}>
                  {analysisResults.casaMetrics.bcf.toFixed(1)} Hz
                </Title>
                <Paragraph style={styles.parameterLabel}>BCF</Paragraph>
                <Paragraph style={styles.parameterDescription}>
                  تردد عبور النبضة
                </Paragraph>
              </View>
              
              <View style={styles.parameterItem}>
                <Title style={styles.parameterValue}>
                  {(analysisResults.casaMetrics.lin * 100).toFixed(1)}%
                </Title>
                <Paragraph style={styles.parameterLabel}>LIN</Paragraph>
                <Paragraph style={styles.parameterDescription}>
                  الخطية (VSL/VCL)
                </Paragraph>
              </View>
              
              <View style={styles.parameterItem}>
                <Title style={styles.parameterValue}>
                  {(analysisResults.casaMetrics.str * 100).toFixed(1)}%
                </Title>
                <Paragraph style={styles.parameterLabel}>STR</Paragraph>
                <Paragraph style={styles.parameterDescription}>
                  الاستقامة (VSL/VAP)
                </Paragraph>
              </View>
              
              <View style={styles.parameterItem}>
                <Title style={styles.parameterValue}>
                  {(analysisResults.casaMetrics.wob * 100).toFixed(1)}%
                </Title>
                <Paragraph style={styles.parameterLabel}>WOB</Paragraph>
                <Paragraph style={styles.parameterDescription}>
                  التذبذب (VAP/VCL)
                </Paragraph>
              </View>
              
              <View style={styles.parameterItem}>
                <Title style={styles.parameterValue}>
                  {analysisResults.casaMetrics.concentration.toFixed(3)} M/mL
                </Title>
                <Paragraph style={styles.parameterLabel}>التركيز</Paragraph>
                <Paragraph style={styles.parameterDescription}>
                  تركيز الحيوانات المنوية
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Clinical Interpretation */}
        <Card style={styles.interpretationCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>🩺 التفسير السريري</Title>
            
            <View style={styles.interpretationContent}>
              <Paragraph style={styles.interpretationText}>
                <Paragraph style={styles.boldText}>تصنيف الحركة: </Paragraph>
                Grade {motilityGrade.grade} - 
                {motilityGrade.grade === 'A' && ' ممتاز - حركة تقدمية عالية'}
                {motilityGrade.grade === 'B' && ' جيد - حركة تقدمية مقبولة'}
                {motilityGrade.grade === 'C' && ' متوسط - حركة تقدمية منخفضة'}
                {motilityGrade.grade === 'D' && ' ضعيف - حركة تقدمية قليلة جداً'}
              </Paragraph>
              
              <Paragraph style={styles.interpretationText}>
                <Paragraph style={styles.boldText}>مؤشرات الخصوبة: </Paragraph>
                {analysisResults.casaMetrics.progressiveMotility >= 32 
                  ? 'مؤشرات إيجابية للخصوبة' 
                  : 'قد تحتاج لمراجعة طبية'}
              </Paragraph>
              
              <Paragraph style={styles.interpretationText}>
                <Paragraph style={styles.boldText}>معايير WHO 2021: </Paragraph>
                {analysisResults.casaMetrics.progressiveMotility >= 32 
                  ? 'ضمن المعدل الطبيعي' 
                  : 'أقل من المعدل الطبيعي (32%)'}
              </Paragraph>
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    minWidth: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 50,
  },
  mediaCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  sampleImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  videoPlaceholder: {
    height: 200,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeChip: {
    alignItems: 'center',
  },
  summaryCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#718096',
    marginTop: 4,
  },
  gradeChip: {
    marginTop: 4,
  },
  chartCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
  },
  velocityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  velocityItem: {
    flex: 1,
    alignItems: 'center',
  },
  velocityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3182CE',
  },
  velocityLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  velocityDescription: {
    fontSize: 10,
    textAlign: 'center',
    color: '#718096',
  },
  barChart: {
    borderRadius: 12,
  },
  parametersCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  parameterItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
  },
  parameterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38B2AC',
    textAlign: 'center',
  },
  parameterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  parameterDescription: {
    fontSize: 10,
    textAlign: 'center',
    color: '#718096',
    marginTop: 2,
  },
  interpretationCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#E6FFFA',
  },
  interpretationContent: {
    padding: 8,
  },
  interpretationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    color: '#2D3748',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#2C5282',
  },
});

export default ResultsScreen;