import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import {
  Heart,
  Wind,
  Quote,
  Lightbulb,
  Smile,
  Play,
  Pause,
  RotateCcw,
  Gamepad2,
} from 'lucide-react-native';

const motivationalQuotes = [
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  "Life is what happens to you while you're busy making other plans.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "It is during our darkest moments that we must focus to see the light.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
];

const funFacts = [
  "Honey never spoils. Archaeologists have found edible honey in ancient Egyptian tombs!",
  "A group of flamingos is called a 'flamboyance'.",
  "Bananas are berries, but strawberries aren't!",
  "Octopuses have three hearts and blue blood.",
  "A day on Venus is longer than its year.",
  "Wombat poop is cube-shaped!",
];

const jokes = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why don't eggs tell jokes? They'd crack each other up!",
  "What do you call a bear with no teeth? A gummy bear!",
  "Why did the scarecrow win an award? He was outstanding in his field!",
  "What's the best thing about Switzerland? I don't know, but the flag is a big plus.",
];

export default function WellnessScreen() {
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [currentJoke, setCurrentJoke] = useState(0);
  
  const breathingAnimation = useState(new Animated.Value(1))[0];
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    let breathingInterval: NodeJS.Timeout;
    
    if (isBreathing) {
      breathingInterval = setInterval(() => {
        const duration = breathingPhase === 'inhale' ? 4000 : 4000;
        const toValue = breathingPhase === 'inhale' ? 1.5 : 1;
        
        Animated.timing(breathingAnimation, {
          toValue,
          duration,
          useNativeDriver: true,
        }).start();
        
        setBreathingPhase(prev => prev === 'inhale' ? 'exhale' : 'inhale');
      }, 4000);
    }

    return () => {
      if (breathingInterval) {
        clearInterval(breathingInterval);
      }
    };
  }, [isBreathing, breathingPhase]);

  const startBreathing = () => {
    setIsBreathing(true);
    setBreathingPhase('inhale');
  };

  const stopBreathing = () => {
    setIsBreathing(false);
    breathingAnimation.setValue(1);
  };

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setCurrentQuote(randomIndex);
  };

  const getRandomFact = () => {
    const randomIndex = Math.floor(Math.random() * funFacts.length);
    setCurrentFact(randomIndex);
  };

  const getRandomJoke = () => {
    const randomIndex = Math.floor(Math.random() * jokes.length);
    setCurrentJoke(randomIndex);
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.secondary, colors.accent]}
        style={styles.header}
      >
        <Heart size={32} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Wellness Center</Text>
        <Text style={styles.headerSubtitle}>Take a moment for yourself</Text>
      </LinearGradient>

      {/* Breathing Exercise */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Wind size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Breathing Exercise</Text>
        </View>
        
        <View style={styles.breathingContainer}>
          <View style={styles.breathingWrapper}>
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: breathingAnimation }],
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.breathingText}>
                {isBreathing ? (breathingPhase === 'inhale' ? 'Inhale' : 'Exhale') : 'Breathe'}
              </Text>
            </Animated.View>
          </View>
          
          <View style={styles.breathingControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.primary }]}
              onPress={isBreathing ? stopBreathing : startBreathing}
            >
              {isBreathing ? (
                <Pause size={20} color="#FFFFFF" />
              ) : (
                <Play size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.textSecondary }]}
              onPress={stopBreathing}
            >
              <RotateCcw size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.breathingInstruction}>
            {isBreathing ? 
              'Follow the circle. Breathe in as it grows, breathe out as it shrinks.' :
              'Tap play to start a guided breathing exercise'
            }
          </Text>
        </View>
      </View>

      {/* Motivational Quotes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Quote size={24} color={colors.accent} />
          <Text style={styles.sectionTitle}>Daily Inspiration</Text>
        </View>
        
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>"{motivationalQuotes[currentQuote]}"</Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.accent }]}
            onPress={getRandomQuote}
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>New Quote</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fun Facts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Lightbulb size={24} color={colors.warning} />
          <Text style={styles.sectionTitle}>Fun Facts</Text>
        </View>
        
        <View style={styles.factCard}>
          <Text style={styles.factText}>{funFacts[currentFact]}</Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.warning }]}
            onPress={getRandomFact}
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Another Fact</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Jokes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Smile size={24} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Light Humor</Text>
        </View>
        
        <View style={styles.jokeCard}>
          <Text style={styles.jokeText}>{jokes[currentJoke]}</Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.secondary }]}
            onPress={getRandomJoke}
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Tell Another</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calm Catch Game Link */}
      <View style={styles.gameSection}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          style={styles.gameCard}
        >
          <Gamepad2 size={48} color="#FFFFFF" />
          <Text style={styles.gameTitle}>Calm Catch Game</Text>
          <Text style={styles.gameDescription}>
            Play a relaxing bubble-popping game to unwind and have fun
          </Text>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => router.push('/(tabs)/game')}
          >
            <Play size={20} color={colors.primary} />
            <Text style={styles.playButtonText}>Play Now</Text>
          </TouchableOpacity>
        </LinearGradient>
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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  breathingContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
  },
  breathingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  breathingControls: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingInstruction: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
  },
  quoteCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  quoteText: {
    fontSize: 16,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 16,
  },
  factCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  factText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  jokeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  jokeText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  gameSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  gameCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 12,
  },
  gameDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 20,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  playButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});