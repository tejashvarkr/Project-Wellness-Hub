import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
  Play,
  Pause,
  RotateCcw,
  Home,
  Trophy,
  Heart,
} from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const GAME_WIDTH = screenWidth - 48;
const GAME_HEIGHT = screenHeight * 0.6;
const BALL_SIZE = 40;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;

interface Ball {
  x: number;
  y: number;
  id: number;
  animation: Animated.Value;
}

export default function CalmCatchGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  const ballIdRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { colors } = useTheme();
  const { updatePoints } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isPlaying && !gameOver) {
      startGameLoop();
      startBallSpawning();
    } else {
      stopGameLoop();
      stopBallSpawning();
    }

    return () => {
      stopGameLoop();
      stopBallSpawning();
    };
  }, [isPlaying, gameOver]);

  const startGameLoop = () => {
    gameLoopRef.current = setInterval(() => {
      setBalls(prevBalls => {
        const updatedBalls = prevBalls.filter(ball => {
          const currentY = ball.y + (Date.now() - ball.id) * 0.1;
          
          // Check if ball hit paddle
          if (
            currentY >= GAME_HEIGHT - PADDLE_HEIGHT - BALL_SIZE &&
            currentY <= GAME_HEIGHT - PADDLE_HEIGHT &&
            ball.x >= paddleX - BALL_SIZE / 2 &&
            ball.x <= paddleX + PADDLE_WIDTH + BALL_SIZE / 2
          ) {
            setScore(prev => prev + 10);
            return false; // Remove ball
          }
          
          // Check if ball fell off screen
          if (currentY > GAME_HEIGHT) {
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameOver(true);
                setIsPlaying(false);
              }
              return newLives;
            });
            return false; // Remove ball
          }
          
          return true; // Keep ball
        });
        
        return updatedBalls;
      });
    }, 16); // ~60fps
  };

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  const startBallSpawning = () => {
    const spawnBall = () => {
      const newBall: Ball = {
        x: Math.random() * (GAME_WIDTH - BALL_SIZE),
        y: -BALL_SIZE,
        id: Date.now(),
        animation: new Animated.Value(0),
      };
      
      setBalls(prev => [...prev, newBall]);
      
      // Animate ball falling
      Animated.timing(newBall.animation, {
        toValue: GAME_HEIGHT + BALL_SIZE,
        duration: 3000 + Math.random() * 2000, // 3-5 seconds
        useNativeDriver: false,
      }).start();
    };

    spawnBall(); // Spawn first ball immediately
    spawnTimerRef.current = setInterval(spawnBall, 1000 + Math.random() * 1500); // 1-2.5 seconds
  };

  const stopBallSpawning = () => {
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setBalls([]);
    setPaddleX(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
  };

  const pauseGame = () => {
    setIsPlaying(!isPlaying);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setBalls([]);
    setPaddleX(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
  };

  const handleGameOver = async () => {
    if (score > highScore) {
      setHighScore(score);
    }
    
    // Award points based on score
    const pointsEarned = Math.floor(score / 10);
    if (pointsEarned > 0) {
      await updatePoints(pointsEarned);
    }
    
    Alert.alert(
      '🎮 Game Over!',
      `Final Score: ${score}\nPoints Earned: ${pointsEarned}\n${score > highScore ? 'New High Score!' : `High Score: ${highScore}`}`,
      [
        { text: 'Play Again', onPress: startGame },
        { text: 'Back to Wellness', onPress: () => router.back() }
      ]
    );
  };

  useEffect(() => {
    if (gameOver && score > 0) {
      handleGameOver();
    }
  }, [gameOver]);

  const handlePaddleMove = (event: any) => {
    const touchX = event.nativeEvent.locationX;
    const newPaddleX = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, touchX - PADDLE_WIDTH / 2));
    setPaddleX(newPaddleX);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.accent, colors.primary]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Home size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calm Catch</Text>
          <TouchableOpacity onPress={() => {}}>
            <Trophy size={24} color="#FFFFFF" />
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
            <Text style={styles.statLabel}>High Score</Text>
            <Text style={styles.statValue}>{highScore}</Text>
          </View>
        </View>

        {/* Game Area */}
        <View style={styles.gameContainer}>
          <View
            style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
            onTouchMove={handlePaddleMove}
            onTouchStart={handlePaddleMove}
          >
            {/* Balls */}
            {balls.map((ball) => (
              <Animated.View
                key={ball.id}
                style={[
                  styles.ball,
                  {
                    left: ball.x,
                    top: ball.animation,
                  },
                ]}
              />
            ))}

            {/* Paddle */}
            <View
              style={[
                styles.paddle,
                {
                  left: paddleX,
                  bottom: 0,
                  width: PADDLE_WIDTH,
                  height: PADDLE_HEIGHT,
                },
              ]}
            />

            {/* Game Over Overlay */}
            {gameOver && (
              <View style={styles.gameOverOverlay}>
                <Text style={styles.gameOverText}>Game Over!</Text>
                <Text style={styles.gameOverScore}>Score: {score}</Text>
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
            🎯 Catch the falling balls with your paddle
          </Text>
          <Text style={styles.instructionText}>
            💎 Each ball = 10 points = 1 wellness point
          </Text>
          <Text style={styles.instructionText}>
            ❤️ Don't let balls fall - you have 3 lives!
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
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  paddle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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