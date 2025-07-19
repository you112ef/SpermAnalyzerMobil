import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Surface,
  useTheme,
  Chip,
  SearchBar,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnalysisRecord {
  id: string;
  date: string;
  mode: 'photo' | 'video';
  totalCells: number;
  motility: number;
  progressiveMotility: number;
  grade: string;
  imageUri?: string;
  videoUri?: string;
}

interface HistoryScreenProps {
  navigation: any;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'photo' | 'video'>('all');

  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchQuery, filter]);

  const loadAnalysisHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('analysisHistory');
      if (history) {
        const parsedHistory = JSON.parse(history);
        setRecords(parsedHistory);
      } else {
        // Load sample data for demo
        setRecords(getSampleData());
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
      setRecords(getSampleData());
    }
  };

  const getSampleData = (): AnalysisRecord[] => {
    return [
      {
        id: '1',
        date: '2024-01-19 16:30',
        mode: 'photo',
        totalCells: 245,
        motility: 78.5,
        progressiveMotility: 45.2,
        grade: 'A',
      },
      {
        id: '2',
        date: '2024-01-19 14:15',
        mode: 'video',
        totalCells: 312,
        motility: 68.4,
        progressiveMotility: 38.7,
        grade: 'B',
      },
      {
        id: '3',
        date: '2024-01-18 11:45',
        mode: 'photo',
        totalCells: 189,
        motility: 52.3,
        progressiveMotility: 28.1,
        grade: 'C',
      },
      {
        id: '4',
        date: '2024-01-17 09:20',
        mode: 'video',
        totalCells: 156,
        motility: 34.2,
        progressiveMotility: 15.8,
        grade: 'D',
      },
    ];
  };

  const filterRecords = () => {
    let filtered = records;

    // Filter by mode
    if (filter !== 'all') {
      filtered = filtered.filter(record => record.mode === filter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.grade.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredRecords(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalysisHistory();
    setRefreshing(false);
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('analysisHistory');
      setRecords([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const exportHistory = () => {
    // Implementation for exporting history
    console.log('Exporting analysis history...');
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#48BB78';
      case 'B': return '#38B2AC';
      case 'C': return '#ED8936';
      case 'D': return '#E53E3E';
      default: return theme.colors.text;
    }
  };

  const renderAnalysisRecord = ({ item }: { item: AnalysisRecord }) => (
    <Card style={styles.recordCard}>
      <Card.Content style={styles.recordContent}>
        <View style={styles.recordHeader}>
          <View style={styles.recordInfo}>
            <Title style={styles.recordDate}>{item.date}</Title>
            <View style={styles.recordChips}>
              <Chip 
                icon={item.mode === 'photo' ? 'camera' : 'videocam'}
                mode="outlined"
                style={styles.modeChip}
              >
                {item.mode === 'photo' ? 'صورة' : 'فيديو'}
              </Chip>
              <Chip 
                style={[styles.gradeChip, { backgroundColor: getGradeColor(item.grade) }]}
                textStyle={{ color: 'white', fontWeight: 'bold' }}
              >
                Grade {item.grade}
              </Chip>
            </View>
          </View>
          
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={() => navigation.navigate('Results', { 
              analysisRecord: item,
              fromHistory: true 
            })}
          />
        </View>

        <View style={styles.recordMetrics}>
          <View style={styles.metricItem}>
            <Title style={styles.metricValue}>{item.totalCells}</Title>
            <Paragraph style={styles.metricLabel}>إجمالي الخلايا</Paragraph>
          </View>
          
          <View style={styles.metricItem}>
            <Title style={[styles.metricValue, { color: theme.colors.primary }]}>
              {item.motility.toFixed(1)}%
            </Title>
            <Paragraph style={styles.metricLabel}>الحركة الكلية</Paragraph>
          </View>
          
          <View style={styles.metricItem}>
            <Title style={[styles.metricValue, { color: getGradeColor(item.grade) }]}>
              {item.progressiveMotility.toFixed(1)}%
            </Title>
            <Paragraph style={styles.metricLabel}>الحركة التقدمية</Paragraph>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
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
          
          <Title style={styles.title}>تاريخ التحاليل</Title>
          
          <View style={styles.headerActions}>
            <IconButton
              icon="export"
              size={24}
              onPress={exportHistory}
            />
            <IconButton
              icon="delete"
              size={24}
              onPress={clearHistory}
            />
          </View>
        </View>
      </Surface>

      {/* Search and Filters */}
      <Surface style={styles.searchContainer}>
        <SearchBar
          placeholder="البحث في التاريخ..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <Chip 
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.filterChip}
          >
            الكل ({records.length})
          </Chip>
          <Chip 
            selected={filter === 'photo'}
            onPress={() => setFilter('photo')}
            style={styles.filterChip}
            icon="camera"
          >
            الصور ({records.filter(r => r.mode === 'photo').length})
          </Chip>
          <Chip 
            selected={filter === 'video'}
            onPress={() => setFilter('video')}
            style={styles.filterChip}
            icon="videocam"
          >
            الفيديو ({records.filter(r => r.mode === 'video').length})
          </Chip>
        </ScrollView>
      </Surface>

      {/* Statistics */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.statsTitle}>📊 إحصائيات عامة</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Title style={styles.statValue}>{records.length}</Title>
              <Paragraph style={styles.statLabel}>إجمالي التحاليل</Paragraph>
            </View>
            
            <View style={styles.statItem}>
              <Title style={[styles.statValue, { color: theme.colors.primary }]}>
                {records.length > 0 
                  ? (records.reduce((sum, r) => sum + r.motility, 0) / records.length).toFixed(1)
                  : 0
                }%
              </Title>
              <Paragraph style={styles.statLabel}>متوسط الحركة</Paragraph>
            </View>
            
            <View style={styles.statItem}>
              <Title style={[styles.statValue, { color: '#48BB78' }]}>
                {records.filter(r => r.grade === 'A' || r.grade === 'B').length}
              </Title>
              <Paragraph style={styles.statLabel}>تحاليل جيدة</Paragraph>
            </View>
            
            <View style={styles.statItem}>
              <Title style={[styles.statValue, { color: '#38B2AC' }]}>
                {records.length > 0 ? records[0].date.split(' ')[0] : '-'}
              </Title>
              <Paragraph style={styles.statLabel}>آخر تحليل</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Records List */}
      <FlatList
        data={filteredRecords}
        renderItem={renderAnalysisRecord}
        keyExtractor={item => item.id}
        style={styles.recordsList}
        contentContainerStyle={styles.recordsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text" size={80} color={theme.colors.disabled} />
            <Title style={styles.emptyTitle}>لا توجد تحاليل</Title>
            <Paragraph style={styles.emptyDescription}>
              {searchQuery || filter !== 'all' 
                ? 'لا توجد نتائج تطابق البحث'
                : 'ابدأ بإجراء تحليل جديد لرؤية النتائج هنا'
              }
            </Paragraph>
            {!searchQuery && filter === 'all' && (
              <Button
                mode="contained"
                icon="camera"
                onPress={() => navigation.navigate('Camera', { mode: 'photo' })}
                style={styles.emptyButton}
              >
                إجراء تحليل جديد
              </Button>
            )}
          </View>
        }
      />
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
  },
  searchContainer: {
    margin: 16,
    borderRadius: 16,
    elevation: 2,
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
  },
  statsCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#718096',
    marginTop: 4,
  },
  recordsList: {
    flex: 1,
  },
  recordsContainer: {
    padding: 16,
  },
  recordCard: {
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
  },
  recordContent: {
    padding: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recordChips: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    height: 28,
  },
  gradeChip: {
    height: 28,
  },
  recordMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: '#718096',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#718096',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
  },
});

export default HistoryScreen;