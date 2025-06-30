import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Heart,
} from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const GAME_WIDTH = screenWidth - 48;
const GAME_HEIGHT = screenHeight * 0.5;
const BUBBLE_SIZE = 70;

interface Bubble {
  x: number;
  y: number;
  id: number;
  color: string;
  animation: Animated.Value;
  speed: number;
  scale: Animated.Value;
  opacity: Animated.Value;
  blissSymbol: string;
  shimmer: Animated.Value;
}

export default function CalmCatchGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [allTimeHighScore, setAllTimeHighScore] = useState(0);
  
  const bubbleIdRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { colors } = useTheme();
  const { updatePoints } = useAuth();

  // Enhanced bubble colors with gradients and transparency
  const bubbleColors = [
    'rgba(255, 182, 193, 0.8)', // Light Pink
    'rgba(173, 216, 230, 0.8)', // Light Blue
    'rgba(144, 238, 144, 0.8)', // Light Green
    'rgba(255, 218, 185, 0.8)', // Peach
    'rgba(221, 160, 221, 0.8)', // Plum
    'rgba(255, 255, 224, 0.8)', // Light Yellow
    'rgba(175, 238, 238, 0.8)', // Pale Turquoise
    'rgba(255, 192, 203, 0.8)', // Pink
    'rgba(230, 230, 250, 0.8)', // Lavender
    'rgba(240, 248, 255, 0.8)', // Alice Blue
  ];

  // Bliss symbols for inner bubble content
  const blissSymbols = ['☮️', '🕉️', '☯️', '🌸', '🦋', '✨', '🌙', '⭐', '💫', '🌺', '🍃', '🌈'];

  useEffect(() => {
    loadHighScore();
  }, []);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      startGameLoop();
      startBubbleSpawning();
    } else {
      stopGameLoop();
      stopBubbleSpawning();
    }

    return () => {
      stopGameLoop();
      stopBubbleSpawning();
    };
  }, [isPlaying, gameOver]);

  const loadHighScore = async () => {
    try {
      const savedHighScore = await AsyncStorage.getItem('calmCatchHighScore');
      if (savedHighScore) {
        const score = parseInt(savedHighScore, 10);
        setHighScore(score);
        setAllTimeHighScore(score);
      }
    } catch (error) {
      console.error('Error loading high score:', error);
    }
  };

  const saveHighScore = async (score: number) => {
    try {
      await AsyncStorage.setItem('calmCatchHighScore', score.toString());
    } catch (error) {
      console.error('Error saving high score:', error);
    }
  };

  // Sound feedback function
  const playPopSound = () => {
    if (Platform.OS === 'web') {
      // Web audio feedback
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.log('Audio not available');
      }
    } else {
      // Mobile haptic feedback
      try {
        import('expo-haptics').then(({ impactAsync, ImpactFeedbackStyle }) => {
          impactAsync(ImpactFeedbackStyle.Light);
        });
      } catch (error) {
        console.log('Haptics not available');
      }
    }
  };

  const createBubble = () => {
    const speed = 4 + Math.random() * 3; // 4-7 seconds fall time
    const newBubble: Bubble = {
      x: Math.random() * (GAME_WIDTH - BUBBLE_SIZE),
      y: -BUBBLE_SIZE,
      id: Date.now() + Math.random(),
      color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
      animation: new Animated.Value(0),
      speed,
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.9),
      blissSymbol: blissSymbols[Math.floor(Math.random() * blissSymbols.length)],
      shimmer: new Animated.Value(0),
    };
    
    // Start shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(newBubble.shimmer, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(newBubble.shimmer, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    return newBubble;
  };

  const startGameLoop = () => {
    gameLoopRef.current = setInterval(() => {
      setBubbles(prevBubbles => {
        return prevBubbles.filter(bubble => {
          // Get current position based on animation progress
          const progress = (Date.now() - bubble.id) / (bubble.speed * 1000);
          const currentY = progress * (GAME_HEIGHT + BUBBLE_SIZE);
          
          // Check if bubble fell off screen
          if (currentY > GAME_HEIGHT + BUBBLE_SIZE) {
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameOver(true);
                setIsPlaying(false);
              }
              return newLives;
            });
            return false;
          }
          
          return true;
        });
      });
    }, 50); // 20fps for game logic
  };

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  const startBubbleSpawning = () => {
    const spawnBubble = () => {
      const newBubble = createBubble();
      
      setBubbles(prev => [...prev, newBubble]);
      
      // Animate bubble falling with gentle floating motion
      Animated.timing(newBubble.animation, {
        toValue: 1,
        duration: newBubble.speed * 1000,
        useNativeDriver: false,
      }).start();
    };

    // Spawn first bubble immediately
    spawnBubble();
    
    // Continue spawning bubbles
    spawnTimerRef.current = setInterval(() => {
      if (isPlaying && !gameOver) {
        spawnBubble();
      }
    }, 1500 + Math.random() * 1000); // 1.5-2.5 seconds between spawns
  };

  const stopBubbleSpawning = () => {
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
  };

  const popBubble = (bubbleId: number) => {
    setBubbles(prevBubbles => {
      const bubble = prevBubbles.find(b => b.id === bubbleId);
      if (bubble) {
        // Play pop sound
        playPopSound();
        
        // Enhanced bubble pop animation
        Animated.parallel([
          Animated.timing(bubble.scale, {
            toValue: 2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bubble.opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        setScore(prev => prev + 10);
        
        // Remove bubble after animation
        setTimeout(() => {
          setBubbles(prev => prev.filter(b => b.id !== bubbleId));
        }, 200);
      }
      return prevBubbles;
    });
  };

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setBubbles([]);
  };

  const pauseGame = () => {
    setIsPlaying(!isPlaying);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setBubbles([]);
  };

  const handleGameOver = async () => {
    let isNewHighScore = false;
    
    if (score > highScore) {
      setHighScore(score);
      setAllTimeHighScore(score);
      await saveHighScore(score);
      isNewHighScore = true;
    }
    
    // Award points based on score
    const pointsEarned = Math.floor(score / 10);
    if (pointsEarned > 0) {
      await updatePoints(pointsEarned);
    }
    
    Alert.alert(
      '🎮 Game Over!',
      `Final Score: ${score}\nPoints Earned: ${pointsEarned}\n${isNewHighScore ? '🏆 NEW HIGH SCORE!' : `High Score: ${highScore}`}`,
      [
        { text: 'Play Again', onPress: startGame },
        { text: 'OK', onPress: () => {} }
      ]
    );
  };

  useEffect(() => {
    if (gameOver && score >= 0) {
      handleGameOver();
    }
  }, [gameOver]);

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.accent, colors.primary]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🫧 Calm Catch</Text>
          <TouchableOpacity style={styles.trophyButton}>
            <Trophy size={24} color="#FFFFFF" />
            <Text style={styles.trophyText}>{allTimeHighScore}</Text>
          </TouchableOpacity>
        </View>

        {/* Game Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Lives</Text>
            <View style={styles.livesContainer}>
              {[...Array(3)].map((_, index) => (
                <Heart
                  key={index}
                  size={20}
                  color={index < lives ? '#FF6B6B' : 'rgba(255, 255, 255, 0.3)'}
                  fill={index < lives ? '#FF6B6B' : 'transparent'}
                />
              ))}
            </View>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>{highScore}</Text>
          </View>
        </View>

        {/* Game Area */}
        <View style={styles.gameContainer}>
          <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
            {/* Bubbles */}
            {bubbles.map((bubble) => (
              <Animated.View
                key={bubble.id}
                style={[
                  styles.bubble,
                  {
                    left: bubble.x,
                    top: bubble.animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-BUBBLE_SIZE, GAME_HEIGHT + BUBBLE_SIZE],
                    }),
                    backgroundColor: bubble.color,
                    transform: [{ scale: bubble.scale }],
                    opacity: bubble.opacity,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.bubbleTouchable}
                  onPress={() => popBubble(bubble.id)}
                  activeOpacity={0.8}
                >
                  {/* Shimmer effect */}
                  <Animated.View
                    style={[
                      styles.shimmer,
                      {
                        opacity: bubble.shimmer.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 0.8],
                        }),
                      },
                    ]}
                  />
                  {/* Bliss symbol */}
                  <Text style={styles.blissSymbol}>{bubble.blissSymbol}</Text>
                  {/* Bubble highlight */}
                  <View style={styles.bubbleHighlight} />
                </TouchableOpacity>
              </Animated.View>
            ))}

            {/* Game Over Overlay */}
            {gameOver && (
              <View style={styles.gameOverOverlay}>
                <Text style={styles.gameOverText}>Game Over!</Text>
                <Text style={styles.gameOverScore}>Score: {score}</Text>
                {score > allTimeHighScore && (
                  <Text style={styles.newHighScore}>🏆 New High Score!</Text>
                )}
              </View>
            )}

            {/* Instructions overlay when not playing */}
            {!isPlaying && !gameOver && (
              <View style={styles.instructionsOverlay}>
                <Text style={styles.instructionsText}>🫧 Tap the bliss bubbles!</Text>
                <Text style={styles.instructionsSubText}>Pop them before they float away</Text>
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!isPlaying && !gameOver && (
            <TouchableOpacity style={styles.controlButton} onPress={startGame}>
              <Play size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Start Game</Text>
            </TouchableOpacity>
          )}

          {isPlaying && !gameOver && (
            <TouchableOpacity style={styles.controlButton} onPress={pauseGame}>
              <Pause size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Pause</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.controlButton} onPress={resetGame}>
            <RotateCcw size={24} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            🎯 Tap the floating bliss bubbles before they escape
          </Text>
          <Text style={styles.instructionText}>
            💎 Each bubble = 10 points = 1 wellness point
          </Text>
          <Text style={styles.instructionText}>
            ❤️ Don't let bubbles float away - you have 3 lives!
          </Text>
        </View>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trophyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  trophyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  gameContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gameArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  bubbleTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  blissSymbol: {
    fontSize: 28,
    textAlign: 'center',
  },
  bubbleHighlight: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  gameOverScore: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  newHighScore: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 8,
  },
  instructionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionsSubText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 4,
  },
});