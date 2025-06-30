import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Target,
  DollarSign,
  Smile,
  Clock,
  Award,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 48;

export default function TrendsScreen() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [habitsData, setHabitsData] = useState<any[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [pomodoroData, setPomodoroData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchTrendsData();
    }
  }, [user, timeRange]);

  const fetchTrendsData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch habits completion data
      const { data: habitsCompletions } = await supabase
        .from('habit_completions')
        .select(`
          completed_at,
          points_earned,
          habits!inner(user_id)
        `)
        .eq('habits.user_id', user?.id)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      // Fetch mood entries
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch pomodoro sessions
      const { data: pomodoroSessions } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      setHabitsData(habitsCompletions || []);
      setMoodData(moodEntries || []);
      setExpenseData(expenses || []);
      setPomodoroData(pomodoroSessions || []);
    } catch (error) {
      console.error('Error fetching trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHabitsChartData = () => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCompletions = habitsData.filter(
        completion => completion.completed_at.split('T')[0] === dateStr
      ).length;

      labels.push(timeRange === 'week' ? 
        date.toLocaleDateString('en', { weekday: 'short' }) :
        timeRange === 'month' ?
        date.getDate().toString() :
        date.toLocaleDateString('en', { month: 'short' })
      );
      data.push(dayCompletions);
    }

    return { labels: labels.slice(-7), datasets: [{ data: data.slice(-7) }] };
  };

  const getMoodChartData = () => {
    const days = Math.min(timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365, 7);
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayMoods = moodData.filter(
        mood => mood.created_at.split('T')[0] === dateStr
      );
      
      const avgMood = dayMoods.length > 0 ? 
        dayMoods.reduce((sum, mood) => sum + mood.mood, 0) / dayMoods.length : 3;

      labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
      data.push(Math.round(avgMood * 10) / 10);
    }

    return { labels, datasets: [{ data }] };
  };

  const getExpensesPieData = () => {
    const categoryTotals: Record<string, number> = {};
    
    expenseData.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    
    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      amount,
      color: colors[index % colors.length],
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  };

  const getTotalStats = () => {
    const totalHabits = habitsData.length;
    const totalExpenses = expenseData.reduce((sum, expense) => sum + expense.amount, 0);
    const totalPomodoros = pomodoroData.filter(session => session.completed).length;
    const avgMood = moodData.length > 0 ? 
      moodData.reduce((sum, mood) => sum + mood.mood, 0) / moodData.length : 0;

    return { totalHabits, totalExpenses, totalPomodoros, avgMood };
  };

  const stats = getTotalStats();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wellness Trends</Text>
        <TrendingUp size={24} color={colors.primary} />
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {(['week', 'month', 'year'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === range && styles.timeRangeTextActive
            ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Target size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.totalHabits}</Text>
            <Text style={styles.statLabel}>Habits Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color={colors.secondary} />
            <Text style={styles.statValue}>{stats.totalPomodoros}</Text>
            <Text style={styles.statLabel}>Focus Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <DollarSign size={24} color={colors.warning} />
            <Text style={styles.statValue}>${stats.totalExpenses.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Smile size={24} color={colors.accent} />
            <Text style={styles.statValue}>{stats.avgMood.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </View>
        </View>

        {/* Habits Trend */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Habits Completion</Text>
          <LineChart
            data={getHabitsChartData()}
            width={chartWidth}
            height={200}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary + Math.round(opacity * 255).toString(16),
              labelColor: (opacity = 1) => colors.text + Math.round(opacity * 255).toString(16),
              style: { borderRadius: 16 },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Mood Trend */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Mood Trend (1-5 Scale)</Text>
          <LineChart
            data={getMoodChartData()}
            width={chartWidth}
            height={200}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 1,
              color: (opacity = 1) => colors.accent + Math.round(opacity * 255).toString(16),
              labelColor: (opacity = 1) => colors.text + Math.round(opacity * 255).toString(16),
              style: { borderRadius: 16 },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.accent,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Expenses Breakdown */}
        {expenseData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Spending by Category</Text>
            <PieChart
              data={getExpensesPieData()}
              width={chartWidth}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
          </View>
        )}

        {/* Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>📊 Insights</Text>
          
          <View style={styles.insightCard}>
            <Award size={20} color={colors.primary} />
            <Text style={styles.insightText}>
              You've completed {stats.totalHabits} habits this {timeRange}! 
              {stats.totalHabits > 10 ? ' Amazing consistency! 🎉' : ' Keep building those healthy routines! 💪'}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Smile size={20} color={colors.accent} />
            <Text style={styles.insightText}>
              Your average mood is {stats.avgMood.toFixed(1)}/5. 
              {stats.avgMood >= 4 ? ' You\'re doing great! 😊' : 
               stats.avgMood >= 3 ? ' Room for improvement! 🌱' : ' Take care of yourself! 💙'}
            </Text>
          </View>

          {stats.totalPomodoros > 0 && (
            <View style={styles.insightCard}>
              <Clock size={20} color={colors.secondary} />
              <Text style={styles.insightText}>
                You've completed {stats.totalPomodoros} focus sessions, 
                totaling {stats.totalPomodoros * 25} minutes of focused work! ⏰
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
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
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  insightsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginLeft: 12,
  },
});