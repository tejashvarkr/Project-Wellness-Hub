import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Settings, User, Award, TrendingUp, Clock, SquareCheck as CheckSquare, DollarSign, Smile, Heart, ShoppingBag, Moon, Sun, Info, Gamepad2, Music, Bell } from 'lucide-react-native';

interface TodayStats {
  pomodoroSessions: number;
  habitsCompleted: number;
  totalHabits: number;
  totalSpent: number;
  averageMood: number;
  moodEntries: number;
}

export default function HomeScreen() {
  const [todayStats, setTodayStats] = useState<TodayStats>({
    pomodoroSessions: 0,
    habitsCompleted: 0,
    totalHabits: 0,
    totalSpent: 0,
    averageMood: 0,
    moodEntries: 0,
  });
  const [loading, setLoading] = useState(true);

  const { user, signOut } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchTodayStats();
    }
  }, [user]);

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00`;
      const endOfDay = `${today}T23:59:59`;

      // Fetch today's pomodoro sessions
      const { data: pomodoroSessions } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('completed', true)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Fetch today's habit completions
      const { data: habitCompletions } = await supabase
        .from('habit_completions')
        .select(`
          *,
          habits!inner(user_id)
        `)
        .eq('habits.user_id', user?.id)
        .gte('completed_at', startOfDay)
        .lte('completed_at', endOfDay);

      // Fetch total habits for the user
      const { data: allHabits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id);

      // Fetch today's expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Fetch today's mood entries
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      const totalSpent = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      const averageMood = moodEntries?.length > 0 
        ? moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / moodEntries.length 
        : 0;

      setTodayStats({
        pomodoroSessions: pomodoroSessions?.length || 0,
        habitsCompleted: habitCompletions?.length || 0,
        totalHabits: allHabits?.length || 0,
        totalSpent,
        averageMood,
        moodEntries: moodEntries?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreLink = () => {
    Linking.openURL('https://wellness-hub-store.example.com');
  };

  const quickActions = [
    { title: 'Pomodoro', icon: Clock, route: '/pomodoro', color: colors.primary },
    { title: 'Habits', icon: CheckSquare, route: '/habits', color: colors.secondary },
    { title: 'Budget', icon: DollarSign, route: '/budget', color: colors.warning },
    { title: 'Mood', icon: Smile, route: '/mood', color: colors.accent },
    { title: 'Wellness', icon: Heart, route: '/wellness', color: colors.error },
    { title: 'Game', icon: Gamepad2, route: '/game', color: '#FF6B6B' },
  ];

  const getMoodEmoji = (mood: number) => {
    if (mood >= 4.5) return '😄';
    if (mood >= 3.5) return '😊';
    if (mood >= 2.5) return '😐';
    if (mood >= 1.5) return '😕';
    return '😢';
  };

  const getMoodText = (mood: number) => {
    if (mood >= 4.5) return 'Very Happy';
    if (mood >= 3.5) return 'Happy';
    if (mood >= 2.5) return 'Neutral';
    if (mood >= 1.5) return 'Sad';
    return 'Very Sad';
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
              {theme === 'light' ? (
                <Moon size={24} color="#FFFFFF" />
              ) : (
                <Sun size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/music')} 
              style={styles.iconButton}
            >
              <Music size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/notifications')} 
              style={styles.iconButton}
            >
              <Bell size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/profile')} 
              style={styles.iconButton}
            >
              <User size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Points Card */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsContent}>
          <Award size={32} color={colors.warning} />
          <View style={styles.pointsText}>
            <Text style={styles.pointsValue}>{user?.points || 0}</Text>
            <Text style={styles.pointsLabel}>Wellness Points</Text>
          </View>
        </View>
        <View style={styles.pointsActions}>
          <TouchableOpacity 
            style={styles.trendsButton}
            onPress={() => router.push('/trends')}
          >
            <TrendingUp size={20} color={colors.primary} />
            <Text style={styles.trendsText}>View Trends</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={handleStoreLink}
          >
            <ShoppingBag size={20} color={colors.secondary} />
            <Text style={styles.shopText}>Shop</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { borderColor: action.color }]}
              onPress={() => router.push(action.route)}
            >
              <action.icon size={24} color={action.color} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Today's Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.summaryText}>
              {todayStats.pomodoroSessions} Pomodoro{todayStats.pomodoroSessions !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <CheckSquare size={20} color={colors.secondary} />
            <Text style={styles.summaryText}>
              {todayStats.habitsCompleted}/{todayStats.totalHabits} Habits
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <DollarSign size={20} color={colors.warning} />
            <Text style={styles.summaryText}>
              ${todayStats.totalSpent.toFixed(2)} spent
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Smile size={20} color={colors.accent} />
            <Text style={styles.summaryText}>
              {todayStats.moodEntries > 0 
                ? `${getMoodEmoji(todayStats.averageMood)} ${getMoodText(todayStats.averageMood)}`
                : 'No mood logged'
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.progressCard}>
          {todayStats.habitsCompleted > 0 && (
            <Text style={styles.progressText}>
              🎯 Great job! You've completed {todayStats.habitsCompleted} habit{todayStats.habitsCompleted !== 1 ? 's' : ''} today.
            </Text>
          )}
          {todayStats.pomodoroSessions > 0 && (
            <Text style={styles.progressText}>
              ⏰ You've focused for {todayStats.pomodoroSessions * 25} minutes with Pomodoro sessions.
            </Text>
          )}
          {todayStats.moodEntries > 0 && (
            <Text style={styles.progressText}>
              😊 Your mood today: {getMoodText(todayStats.averageMood)} ({todayStats.averageMood.toFixed(1)}/5)
            </Text>
          )}
          {todayStats.pomodoroSessions === 0 && todayStats.habitsCompleted === 0 && todayStats.moodEntries === 0 && (
            <Text style={styles.progressText}>
              🌟 Start your wellness journey today! Try completing a habit or starting a focus session.
            </Text>
          )}
        </View>
      </View>

      {/* Footer Actions */}
      <View style={styles.footerActions}>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push('/about')}
        >
          <Info size={20} color={colors.primary} />
          <Text style={styles.footerButtonText}>About Us</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.footerButton, styles.signOutButton]}
          onPress={signOut}
        >
          <Settings size={20} color={colors.error} />
          <Text style={[styles.footerButtonText, { color: colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsCard: {
    marginHorizontal: 24,
    marginTop: -12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsText: {
    marginLeft: 16,
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  pointsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pointsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  trendsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  trendsText: {
    color: colors.primary,
    fontWeight: '600',
  },
  shopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  shopText: {
    color: colors.secondary,
    fontWeight: '600',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    fontSize: 16,
    color: colors.text,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  footerActions: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 12,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});