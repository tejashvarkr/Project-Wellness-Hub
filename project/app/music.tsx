import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Waves,
  Wind,
  Zap,
  Heart,
  Leaf,
} from 'lucide-react-native';

interface Track {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  url: string;
}

export default function MusicScreen() {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  const { colors } = useTheme();
  const router = useRouter();

  const tracks: Track[] = [
    {
      id: 'rain',
      title: 'Gentle Rain',
      description: 'Soft rainfall sounds for relaxation',
      icon: Waves,
      color: colors.primary,
      url: 'https://www.soundjay.com/misc/sounds/rain-01.wav',
    },
    {
      id: 'forest',
      title: 'Forest Ambience',
      description: 'Birds chirping in a peaceful forest',
      icon: Leaf,
      color: colors.secondary,
      url: 'https://www.soundjay.com/nature/sounds/forest-1.wav',
    },
    {
      id: 'ocean',
      title: 'Ocean Waves',
      description: 'Calming ocean waves on the shore',
      icon: Waves,
      color: colors.accent,
      url: 'https://www.soundjay.com/nature/sounds/ocean-1.wav',
    },
    {
      id: 'wind',
      title: 'Gentle Breeze',
      description: 'Soft wind through the trees',
      icon: Wind,
      color: colors.warning,
      url: 'https://www.soundjay.com/nature/sounds/wind-1.wav',
    },
    {
      id: 'meditation',
      title: 'Meditation Bell',
      description: 'Tibetan singing bowl for meditation',
      icon: Heart,
      color: colors.error,
      url: 'https://www.soundjay.com/misc/sounds/bell-1.wav',
    },
    {
      id: 'focus',
      title: 'Focus Tones',
      description: 'Binaural beats for concentration',
      icon: Zap,
      color: '#9333EA',
      url: 'https://www.soundjay.com/misc/sounds/tone-1.wav',
    },
  ];

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playTrack = async (track: Track) => {
    try {
      // Stop current sound if playing
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      if (currentTrack === track.id && isPlaying) {
        // If same track is playing, pause it
        setIsPlaying(false);
        setCurrentTrack(null);
        return;
      }

      // For web, create a simple audio context tone
      if (Platform.OS === 'web') {
        playWebAudio(track);
        setCurrentTrack(track.id);
        setIsPlaying(true);
        return;
      }

      // For mobile, try to load the audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { shouldPlay: true, isLooping: true, volume: isMuted ? 0 : volume }
      );

      setSound(newSound);
      setCurrentTrack(track.id);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing track:', error);
      Alert.alert('Audio Error', 'Unable to play this track. Playing a generated tone instead.');
      playWebAudio(track);
      setCurrentTrack(track.id);
      setIsPlaying(true);
    }
  };

  const playWebAudio = (track: Track) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different tracks
      const frequencies: Record<string, number> = {
        rain: 200,
        forest: 300,
        ocean: 150,
        wind: 250,
        meditation: 432,
        focus: 40, // Binaural beat base frequency
      };

      oscillator.frequency.setValueAtTime(frequencies[track.id] || 200, audioContext.currentTime);
      oscillator.type = track.id === 'focus' ? 'sine' : 'triangle';

      gainNode.gain.setValueAtTime(isMuted ? 0 : volume * 0.3, audioContext.currentTime);

      oscillator.start();

      // Store reference to stop later
      (window as any).currentOscillator = oscillator;
      (window as any).currentGainNode = gainNode;
    } catch (error) {
      console.log('Web Audio not available');
    }
  };

  const stopCurrentTrack = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }

    // Stop web audio
    if (Platform.OS === 'web' && (window as any).currentOscillator) {
      (window as any).currentOscillator.stop();
      (window as any).currentOscillator = null;
      (window as any).currentGainNode = null;
    }

    setIsPlaying(false);
    setCurrentTrack(null);
  };

  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (sound) {
      await sound.setVolumeAsync(newMuted ? 0 : volume);
    }

    if (Platform.OS === 'web' && (window as any).currentGainNode) {
      (window as any).currentGainNode.gain.setValueAtTime(
        newMuted ? 0 : volume * 0.3,
        (window as any).currentGainNode.context.currentTime
      );
    }
  };

  const adjustVolume = async (newVolume: number) => {
    setVolume(newVolume);

    if (!isMuted) {
      if (sound) {
        await sound.setVolumeAsync(newVolume);
      }

      if (Platform.OS === 'web' && (window as any).currentGainNode) {
        (window as any).currentGainNode.gain.setValueAtTime(
          newVolume * 0.3,
          (window as any).currentGainNode.context.currentTime
        );
      }
    }
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
          <Music size={48} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Wellness Music</Text>
          <Text style={styles.headerSubtitle}>Relax and focus with ambient sounds</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Playing */}
        {currentTrack && (
          <View style={styles.nowPlayingCard}>
            <Text style={styles.nowPlayingTitle}>Now Playing</Text>
            <View style={styles.nowPlayingContent}>
              <Text style={styles.nowPlayingTrack}>
                {tracks.find(t => t.id === currentTrack)?.title}
              </Text>
              <View style={styles.playbackControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={stopCurrentTrack}
                >
                  <Pause size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.muteButton}
                  onPress={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX size={20} color={colors.textSecondary} />
                  ) : (
                    <Volume2 size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Volume Control */}
        <View style={styles.volumeCard}>
          <Text style={styles.volumeTitle}>Volume Control</Text>
          <View style={styles.volumeControls}>
            <TouchableOpacity onPress={() => adjustVolume(Math.max(0, volume - 0.1))}>
              <Text style={styles.volumeButton}>-</Text>
            </TouchableOpacity>
            <View style={styles.volumeBar}>
              <View 
                style={[
                  styles.volumeFill, 
                  { width: `${volume * 100}%`, backgroundColor: colors.primary }
                ]} 
              />
            </View>
            <TouchableOpacity onPress={() => adjustVolume(Math.min(1, volume + 0.1))}>
              <Text style={styles.volumeButton}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
        </View>

        {/* Track List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ambient Sounds</Text>
          {tracks.map((track) => (
            <TouchableOpacity
              key={track.id}
              style={[
                styles.trackCard,
                currentTrack === track.id && styles.trackCardActive
              ]}
              onPress={() => playTrack(track)}
            >
              <View style={[styles.trackIcon, { backgroundColor: track.color + '20' }]}>
                <track.icon size={24} color={track.color} />
              </View>
              <View style={styles.trackContent}>
                <Text style={styles.trackTitle}>{track.title}</Text>
                <Text style={styles.trackDescription}>{track.description}</Text>
              </View>
              <View style={styles.trackAction}>
                {currentTrack === track.id && isPlaying ? (
                  <Pause size={20} color={colors.primary} />
                ) : (
                  <Play size={20} color={colors.textSecondary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🎵 Music Tips</Text>
          <Text style={styles.tipsText}>
            • Use ambient sounds during work or study sessions
          </Text>
          <Text style={styles.tipsText}>
            • Try meditation sounds for mindfulness practice
          </Text>
          <Text style={styles.tipsText}>
            • Ocean waves can help with sleep and relaxation
          </Text>
          <Text style={styles.tipsText}>
            • Adjust volume to a comfortable level for your environment
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
  nowPlayingCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  nowPlayingTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  nowPlayingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nowPlayingTrack: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  playbackControls: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  volumeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  volumeButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    width: 30,
    textAlign: 'center',
  },
  volumeBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 3,
  },
  volumeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
  trackCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  trackCardActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  trackIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  trackContent: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  trackDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trackAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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