import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Target,
  Users,
  Mail,
  Globe,
  Shield,
  Award,
  Lightbulb,
  Smile,
} from 'lucide-react-native';

export default function AboutScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleEmailPress = () => {
    Linking.openURL('mailto:hello@wellnesshub.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://wellnesshub.com');
  };

  const features = [
    {
      icon: Target,
      title: 'Habit Tracking',
      description: 'Build and maintain healthy daily routines with our intuitive habit tracker.',
    },
    {
      icon: Heart,
      title: 'Mood Monitoring',
      description: 'Track your emotional well-being and identify patterns in your mood.',
    },
    {
      icon: Award,
      title: 'Pomodoro Timer',
      description: 'Boost productivity with focused work sessions and regular breaks.',
    },
    {
      icon: Lightbulb,
      title: 'Budget Tracking',
      description: 'Monitor your spending habits and maintain financial wellness.',
    },
    {
      icon: Smile,
      title: 'Wellness Center',
      description: 'Access breathing exercises, motivational content, and relaxing games.',
    },
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Wellness Expert',
      description: 'Licensed therapist with 10+ years in mental health and wellness.',
    },
    {
      name: 'Mike Chen',
      role: 'Product Designer',
      description: 'UX designer passionate about creating intuitive health apps.',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Data Scientist',
      description: 'Specialist in behavioral analytics and wellness insights.',
    },
  ];

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
          <Heart size={48} color="#FFFFFF" />
          <Text style={styles.headerTitle}>About Wellness Hub</Text>
          <Text style={styles.headerSubtitle}>Your journey to better living</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            Wellness Hub is designed to help you build healthier habits, track your progress, 
            and maintain a balanced lifestyle. We believe that small, consistent actions lead 
            to significant positive changes in your life.
          </Text>
          <Text style={styles.missionText}>
            Our app combines evidence-based wellness practices with gamification to make 
            your journey towards better health engaging and sustainable.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <feature.icon size={24} color={colors.primary} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meet Our Team</Text>
          {team.map((member, index) => (
            <View key={index} style={styles.teamCard}>
              <View style={styles.teamAvatar}>
                <Users size={24} color={colors.primary} />
              </View>
              <View style={styles.teamContent}>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
                <Text style={styles.teamDescription}>{member.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          
          <View style={styles.valueCard}>
            <Shield size={24} color={colors.secondary} />
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Privacy First</Text>
              <Text style={styles.valueDescription}>
                Your personal data is encrypted and never shared with third parties.
              </Text>
            </View>
          </View>

          <View style={styles.valueCard}>
            <Heart size={24} color={colors.error} />
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Holistic Wellness</Text>
              <Text style={styles.valueDescription}>
                We focus on mental, physical, and financial well-being as interconnected aspects of health.
              </Text>
            </View>
          </View>

          <View style={styles.valueCard}>
            <Target size={24} color={colors.warning} />
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Evidence-Based</Text>
              <Text style={styles.valueDescription}>
                Our features are built on scientific research and proven wellness methodologies.
              </Text>
            </View>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          
          <TouchableOpacity style={styles.contactCard} onPress={handleEmailPress}>
            <Mail size={24} color={colors.primary} />
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Email Us</Text>
              <Text style={styles.contactDescription}>hello@wellnesshub.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleWebsitePress}>
            <Globe size={24} color={colors.accent} />
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Visit Our Website</Text>
              <Text style={styles.contactDescription}>www.wellnesshub.com</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Wellness Hub v1.0.0</Text>
          <Text style={styles.versionText}>Made with ❤️ for your wellness journey</Text>
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
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  missionText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  teamCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamContent: {
    flex: 1,
    marginLeft: 16,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  teamRole: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  valueCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  valueContent: {
    flex: 1,
    marginLeft: 16,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  contactContent: {
    flex: 1,
    marginLeft: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  contactDescription: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
});