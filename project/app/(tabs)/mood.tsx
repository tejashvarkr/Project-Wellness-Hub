import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { MoodEntry } from '@/types';
import { moodColors } from '@/constants/theme';
import {
  Plus,
  Calendar,
  TrendingUp,
  Smile,
  X,
  Trash2,
} from 'lucide-react-native';

const moods = [
  { value: 1, emoji: '😢', label: 'Very Sad' },
  { value: 2, emoji: '😕', label: 'Sad' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Happy' },
  { value: 5, emoji: '😄', label: 'Very Happy' },
];

export default function MoodScreen() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const { colors } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMoodEntries();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [user]);

  const fetchMoodEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (isMountedRef.current) {
        setMoodEntries(data || []);
      }
    } catch (error) {
      console.error('Error fetching mood entries:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const addMoodEntry = async () => {
    if (selectedMood === null) {
      Alert.alert('Error', 'Please select a mood');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          mood: selectedMood,
          note: note.trim() || null,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (isMountedRef.current) {
        setMoodEntries([data, ...moodEntries]);
        setSelectedMood(null);
        setNote('');
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding mood entry:', error);
      Alert.alert('Error', 'Failed to add mood entry');
    }
  };

  const deleteMoodEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Mood Entry',
      'Are you sure you want to delete this mood entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('mood_entries')
                .delete()
                .eq('id', entryId);

              if (error) throw error;

              setMoodEntries(moodEntries.filter(entry => entry.id !== entryId));
            } catch (error) {
              console.error('Error deleting mood entry:', error);
              Alert.alert('Error', 'Failed to delete mood entry');
            }
          },
        },
      ]
    );
  };

  const getAverageMood = () => {
    if (moodEntries.length === 0) return 0;
    const sum = moodEntries.reduce((acc, entry) => acc + entry.mood, 0);
    return Math.round((sum / moodEntries.length) * 10) / 10;
  };

  const getWeeklyMood = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyEntries = moodEntries.filter(
      entry => new Date(entry.created_at) >= oneWeekAgo
    );
    
    if (weeklyEntries.length === 0) return 0;
    const sum = weeklyEntries.reduce((acc, entry) => acc + entry.mood, 0);
    return Math.round((sum / weeklyEntries.length) * 10) / 10;
  };

  const getChartData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const dailyMoods = last7Days.map(date => {
      const dayEntries = moodEntries.filter(
        entry => entry.created_at.split('T')[0] === date
      );
      
      if (dayEntries.length === 0) return 3; // Default to neutral
      const average = dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length;
      return Math.round(average);
    });

    return {
      labels: last7Days.map(date => new Date(date).toLocaleDateString('en', { weekday: 'short' })),
      datasets: [{
        data: dailyMoods,
        strokeWidth: 3,
      }],
    };
  };

  const getMoodEmoji = (moodValue: number) => {
    const mood = moods.find(m => m.value === moodValue);
    return mood ? mood.emoji : '😐';
  };

  const getMoodLabel = (moodValue: number) => {
    const mood = moods.find(m => m.value === moodValue);
    return mood ? mood.label : 'Neutral';
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mood Tracker</Text>
          <Text style={styles.headerSubtitle}>How are you feeling today?</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Smile size={24} color={colors.accent} />
            <Text style={styles.statValue}>{getAverageMood()}/5</Text>
            <Text style={styles.statLabel}>Average Mood</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={24} color={colors.secondary} />
            <Text style={styles.statValue}>{getWeeklyMood()}/5</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={24} color={colors.primary} />
            <Text style={styles.statValue}>{moodEntries.length}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
        </View>

        {/* Chart */}
        {moodEntries.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>7-Day Mood Trend</Text>
            <LineChart
              data={getChartData()}
              width={350}
              height={200}
              yAxisSuffix=""
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => colors.primary + Math.round(opacity * 255).toString(16),
                labelColor: (opacity = 1) => colors.text + Math.round(opacity * 255).toString(16),
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        )}

        {/* Recent Moods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Moods</Text>
          {moodEntries.slice(0, 10).map((entry) => (
            <View key={entry.id} style={styles.moodCard}>
              <View style={styles.moodContent}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
                <View style={styles.moodDetails}>
                  <Text style={styles.moodLabel}>{getMoodLabel(entry.mood)}</Text>
                  {entry.note && (
                    <Text style={styles.moodNote}>{entry.note}</Text>
                  )}
                  <Text style={styles.moodDate}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.moodRight}>
                <View style={[
                  styles.moodIndicator,
                  { backgroundColor: moodColors[entry.mood as keyof typeof moodColors] }
                ]} />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteMoodEntry(entry.id)}
                >
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {moodEntries.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Smile size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Mood Entries Yet</Text>
              <Text style={styles.emptyDescription}>
                Start tracking your mood to see patterns
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Mood Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>How are you feeling?</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
            <View style={styles.moodSelector}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.moodOption,
                    selectedMood === mood.value && styles.moodOptionSelected,
                    { borderColor: moodColors[mood.value as keyof typeof moodColors] }
                  ]}
                  onPress={() => setSelectedMood(mood.value)}
                >
                  <Text style={styles.moodOptionEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodOptionLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Add a note (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="How was your day? What made you feel this way?"
                placeholderTextColor={colors.textSecondary}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                selectedMood === null && styles.createButtonDisabled
              ]}
              onPress={addMoodEntry}
              disabled={selectedMood === null}
            >
              <Text style={styles.createButtonText}>Save Mood</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  moodCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moodEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  moodDetails: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  moodNote: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  moodDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  moodRight: {
    alignItems: 'center',
    gap: 8,
  },
  moodIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  moodSelector: {
    marginBottom: 24,
  },
  moodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodOptionSelected: {
    backgroundColor: colors.primary + '20',
  },
  moodOptionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  moodOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});