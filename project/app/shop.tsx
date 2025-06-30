import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShoppingBag, Wrench } from 'lucide-react-native';

export default function ShopScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.secondary, colors.primary]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <ShoppingBag size={48} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Wellness Shop</Text>
          <Text style={styles.headerSubtitle}>Coming Soon!</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.constructionContainer}>
          <Wrench size={64} color={colors.primary} />
          <Text style={styles.constructionTitle}>We're Building Something Amazing!</Text>
          <Text style={styles.constructionDescription}>
            Our wellness shop is currently under construction. Soon you'll be able to redeem your wellness points for:
          </Text>
          
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>🏆 Premium wellness courses</Text>
            <Text style={styles.featureItem}>📱 Advanced app features</Text>
            <Text style={styles.featureItem}>🎁 Wellness products & accessories</Text>
            <Text style={styles.featureItem}>💎 Exclusive content & guides</Text>
            <Text style={styles.featureItem}>🌟 Personalized coaching sessions</Text>
          </View>

          <Text style={styles.pointsInfo}>
            Keep earning wellness points by completing habits, focus sessions, and tracking your mood!
          </Text>

          <View style={styles.currentPointsCard}>
            <Text style={styles.currentPointsLabel}>Your Current Points</Text>
            <Text style={styles.currentPointsValue}>Coming Soon</Text>
          </View>
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  constructionContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
  },
  constructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  constructionDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    paddingLeft: 8,
  },
  pointsInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  currentPointsCard: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  currentPointsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  currentPointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
});