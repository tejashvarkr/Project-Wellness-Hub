import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Clock, Heart, Target, Smile, DollarSign, Settings, CircleCheck as CheckCircle } from 'lucide-react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  enabled: boolean;
  time?: string;
}

export default function NotificationsScreen() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'habits',
      title: 'Habit Reminders',
      description: 'Daily reminders to complete your habits',
      icon: Target,
      color: '#10B981',
      enabled: true,
      time: '09:00',
    },
    {
      id: 'pomodoro',
      title: 'Focus Sessions',
      description: 'Reminders to take breaks and start focus sessions',
      icon: Clock,
      color: '#3B82F6',
      enabled: true,
      time: '10:00',
    },
    {
      id: 'mood',
      title: 'Mood Check-ins',
      description: 'Daily prompts to log your mood',
      icon: Smile,
      color: '#8B5CF6',
      enabled: true,
      time: '18:00',
    },
    {
      id: 'wellness',
      title: 'Wellness Tips',
      description: 'Daily wellness and mindfulness reminders',
      icon: Heart,
      color: '#EF4444',
      enabled: false,
      time: '12:00',
    },
    {
      id: 'budget',
      title: 'Budget Alerts',
      description: 'Weekly spending summaries and budget reminders',
      icon: DollarSign,
      color: '#F59E0B',
      enabled: false,
      time: '20:00',
    },
  ]);

  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionGranted(status === 'granted');
    
    if (status === 'granted') {
      Alert.alert('Permissions Granted', 'You will now receive wellness notifications!');
      scheduleAllNotifications();
    } else {
      Alert.alert('Permissions Denied', 'You can enable notifications in your device settings.');
    }
  };

  const toggleNotification = async (id: string) => {
    const updatedSettings = notificationSettings.map(setting => {
      if (setting.id === id) {
        const newEnabled = !setting.enabled;
        
        if (newEnabled && permissionGranted) {
          scheduleNotification(setting);
        } else if (!newEnabled) {
          cancelNotification(id);
        }
        
        return { ...setting, enabled: newEnabled };
      }
      return setting;
    });
    
    setNotificationSettings(updatedSettings);
  };

  const scheduleNotification = async (setting: NotificationSetting) => {
    if (!permissionGranted) return;

    try {
      const [hours, minutes] = setting.time!.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        identifier: setting.id,
        content: {
          title: setting.title,
          body: getNotificationBody(setting.id),
          sound: true,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const cancelNotification = async (id: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const scheduleAllNotifications = async () => {
    for (const setting of notificationSettings) {
      if (setting.enabled) {
        await scheduleNotification(setting);
      }
    }
  };

  const getNotificationBody = (id: string): string => {
    const messages: Record<string, string[]> = {
      habits: [
        "Time to build those healthy habits! 💪",
        "Your future self will thank you for completing your habits today! 🌟",
        "Small steps lead to big changes. Check off your habits! ✅",
      ],
      pomodoro: [
        "Ready for a focused work session? 🍅",
        "Time to boost your productivity with a Pomodoro session! ⏰",
        "Take a break and recharge, then get back to focused work! 🔋",
      ],
      mood: [
        "How are you feeling today? Take a moment to check in with yourself 😊",
        "Your emotional well-being matters. Log your mood! 💙",
        "Reflect on your day and track your mood journey 🌈",
      ],
      wellness: [
        "Remember to take deep breaths and stay mindful today 🧘‍♀️",
        "Your wellness journey is important. Take care of yourself! 🌱",
        "A moment of self-care can make all the difference ✨",
      ],
      budget: [
        "Check your spending this week and stay on track! 💰",
        "Your financial wellness is part of your overall health 📊",
        "Review your budget and celebrate your progress! 🎯",
      ],
    };

    const messageArray = messages[id] || ["Time for your wellness check-in!"];
    return messageArray[Math.floor(Math.random() * messageArray.length)];
  };

  const testNotification = async () => {
    if (!permissionGranted) {
      Alert.alert('Permissions Required', 'Please enable notifications first.');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification 🔔',
        body: 'This is a test notification from Wellness Hub!',
        sound: true,
      },
      trigger: { seconds: 1 },
    });

    Alert.alert('Test Sent!', 'You should receive a test notification in a moment.');
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Bell size={48} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Stay on track with gentle reminders</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <View style={styles.permissionStatus}>
              {permissionGranted ? (
                <CheckCircle size={24} color={colors.secondary} />
              ) : (
                <Bell size={24} color={colors.warning} />
              )}
              <Text style={styles.permissionTitle}>
                {permissionGranted ? 'Notifications Enabled' : 'Enable Notifications'}
              </Text>
            </View>
            {!permissionGranted && (
              <TouchableOpacity
                style={styles.enableButton}
                onPress={requestPermissions}
              >
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.permissionDescription}>
            {permissionGranted 
              ? 'You\'ll receive wellness reminders to help you stay on track with your goals.'
              : 'Allow notifications to receive helpful reminders for your wellness journey.'
            }
          </Text>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          {notificationSettings.map((setting) => (
            <View key={setting.id} style={styles.settingCard}>
              <View style={styles.settingContent}>
                <View style={[styles.settingIcon, { backgroundColor: setting.color + '20' }]}>
                  <setting.icon size={24} color={setting.color} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                  {setting.time && (
                    <Text style={styles.settingTime}>Daily at {setting.time}</Text>
                  )}
                </View>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleNotification(setting.id)}
                trackColor={{ false: colors.border, true: setting.color }}
                thumbColor={setting.enabled ? '#FFFFFF' : '#FFFFFF'}
                disabled={!permissionGranted}
              />
            </View>
          ))}
        </View>

        {/* Test Notification */}
        {permissionGranted && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>Test Notifications</Text>
            <Text style={styles.testDescription}>
              Send a test notification to make sure everything is working properly.
            </Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={testNotification}
            >
              <Bell size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🔔 Notification Tips</Text>
          <Text style={styles.tipsText}>
            • Notifications help build consistent wellness habits
          </Text>
          <Text style={styles.tipsText}>
            • You can customize notification times in your device settings
          </Text>
          <Text style={styles.tipsText}>
            • Turn off notifications you don't find helpful
          </Text>
          <Text style={styles.tipsText}>
            • Use "Do Not Disturb" mode when you need uninterrupted focus time
          </Text>
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
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  enableButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  settingCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingTime: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  testCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  testDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    gap: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
});