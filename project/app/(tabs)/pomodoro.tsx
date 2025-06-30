import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CircularProgress } from 'react-native-circular-progress';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import {
  Play,
  Pause,
  Square,
  Settings,
  Coffee,
  Clock,
  X,
} from 'lucide-react-native';

export default function PomodoroScreen() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [tempWorkDuration, setTempWorkDuration] = useState('25');
  const [tempBreakDuration, setTempBreakDuration] = useState('5');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { colors } = useTheme();
  const { user, updatePoints } = useAuth();

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          // Timer completed
          setIsActive(false);
          handleTimerComplete();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = async () => {
    // Trigger haptic feedback on mobile
    if (Platform.OS !== 'web') {
      try {
        const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
        impactAsync(ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptics not available');
      }
    }
    
    if (!isBreak) {
      // Work session completed
      const newSessionCount = sessionsCompleted + 1;
      setSessionsCompleted(newSessionCount);
      
      // Save session to database
      try {
        await supabase.from('pomodoro_sessions').insert({
          duration: workDuration,
          completed: true,
          user_id: user?.id,
          points_earned: 25,
        });
      } catch (error) {
        console.error('Error saving pomodoro session:', error);
      }
      
      await updatePoints(25); // Award 25 points for completing a pomodoro
      
      Alert.alert(
        '🍅 Great Work!',
        `Pomodoro session completed! You've earned 25 points.\n\nSessions today: ${newSessionCount}`,
        [
          { text: 'Start Break', onPress: startBreak },
          { text: 'Skip Break', onPress: startWork }
        ]
      );
    } else {
      // Break completed
      Alert.alert(
        '☕ Break Over!',
        'Ready for another productive session?',
        [
          { text: 'Start Work', onPress: startWork },
          { text: 'Take More Time', onPress: () => setIsActive(false) }
        ]
      );
    }
  };

  const startWork = () => {
    setIsBreak(false);
    setMinutes(workDuration);
    setSeconds(0);
    setIsActive(true);
  };

  const startBreak = () => {
    setIsBreak(true);
    setMinutes(breakDuration);
    setSeconds(0);
    setIsActive(true);
  };

  const toggleTimer = () => {
    if (!isActive && minutes === 0 && seconds === 0) {
      // If timer is at 0, reset it before starting
      if (isBreak) {
        setMinutes(breakDuration);
      } else {
        setMinutes(workDuration);
      }
      setSeconds(0);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (isBreak) {
      setMinutes(breakDuration);
    } else {
      setMinutes(workDuration);
    }
    setSeconds(0);
  };

  const saveSettings = () => {
    const newWorkDuration = parseInt(tempWorkDuration) || 25;
    const newBreakDuration = parseInt(tempBreakDuration) || 5;
    
    setWorkDuration(newWorkDuration);
    setBreakDuration(newBreakDuration);
    
    // Reset timer with new durations
    setIsActive(false);
    if (isBreak) {
      setMinutes(newBreakDuration);
    } else {
      setMinutes(newWorkDuration);
    }
    setSeconds(0);
    
    setShowSettings(false);
  };

  const totalSeconds = isBreak ? breakDuration * 60 : workDuration * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = totalSeconds > 0 ? ((totalSeconds - currentSeconds) / totalSeconds) * 100 : 0;

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isBreak ? [colors.secondary, colors.accent] : [colors.primary, colors.accent]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isBreak ? '☕ Break Time' : '🍅 Focus Time'}
          </Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => {
              setTempWorkDuration(workDuration.toString());
              setTempBreakDuration(breakDuration.toString());
              setShowSettings(true);
            }}
          >
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <CircularProgress
            size={280}
            width={8}
            fill={progress}
            tintColor="#FFFFFF"
            backgroundColor="rgba(255, 255, 255, 0.3)"
            rotation={0}
          >
            {() => (
              <View style={styles.timerContent}>
                {isBreak ? (
                  <Coffee size={48} color="#FFFFFF" />
                ) : (
                  <Clock size={48} color="#FFFFFF" />
                )}
                <Text style={styles.timerText}>
                  {formatTime(minutes, seconds)}
                </Text>
                <Text style={styles.timerLabel}>
                  {isBreak ? 'Break' : 'Focus'}
                </Text>
                <Text style={styles.timerSubLabel}>
                  {isActive ? (isBreak ? 'Relax and recharge' : 'Stay focused') : 'Ready to start?'}
                </Text>
              </View>
            )}
          </CircularProgress>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={resetTimer}
          >
            <Square size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={toggleTimer}
          >
            {isActive ? (
              <Pause size={32} color="#FFFFFF" />
            ) : (
              <Play size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={() => {
              setTempWorkDuration(workDuration.toString());
              setTempBreakDuration(breakDuration.toString());
              setShowSettings(true);
            }}
          >
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sessionsCompleted}</Text>
            <Text style={styles.statLabel}>Sessions Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sessionsCompleted * 25}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{workDuration}m</Text>
            <Text style={styles.statLabel}>Work Duration</Text>
          </View>
        </View>

        {/* Settings Modal */}
        <Modal
          visible={showSettings}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Timer Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Work Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={tempWorkDuration}
                  onChangeText={setTempWorkDuration}
                  keyboardType="numeric"
                  placeholder="25"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Break Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={tempBreakDuration}
                  onChangeText={setTempBreakDuration}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  timerLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
  },
  timerSubLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 40,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});