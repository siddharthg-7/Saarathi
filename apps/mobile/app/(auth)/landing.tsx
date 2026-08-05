import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Landing() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push({
      pathname: '/(auth)/login',
      params: { mode: 'signup' },
    });
  };

  const handleSignIn = () => {
    router.push({
      pathname: '/(auth)/login',
      params: { mode: 'signin' },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>✨</Text>
            </View>
            <Text style={styles.logoText}>
              Saarathi <Text style={styles.logoSubtext}>OS</Text>
            </Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✨ Next-Gen Personal Productivity OS</Text>
          </View>
          <Text style={styles.heroTitle}>Your AI-Powered</Text>
          <Text style={styles.heroTitleAccent}>Productivity OS</Text>
          <Text style={styles.heroSubtitle}>
            Saarathi unifies task scheduling, voice brain-dumping, habit tracking, and proactive ML
            procrastination prediction guided by your calm AI coach, Kairo.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>Get Started Free</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
            <Text style={styles.secondaryButtonText}>Sign In to Workspace</Text>
          </TouchableOpacity>
        </View>

        {/* Features / Pillars Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Built for High-Leverage Execution</Text>
          <Text style={styles.sectionSubtitle}>
            Inspired by Linear, Notion, Raycast, and Arc Browser — engineered for zero-friction
            daily flow.
          </Text>

          <View style={styles.grid}>
            {/* Feature 1 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Text style={styles.featureIcon}>🎙️</Text>
              </View>
              <Text style={styles.featureTitle}>Voice Brain Dump</Text>
              <Text style={styles.featureDescription}>
                Record raw, unformatted audio thoughts and let Kairo extract tasks, deadlines, and
                urgency automatically.
              </Text>
            </View>

            {/* Feature 2 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={styles.featureIcon}>⚡</Text>
              </View>
              <Text style={styles.featureTitle}>Procrastination ML</Text>
              <Text style={styles.featureDescription}>
                Machine learning algorithms analyze energy patterns, difficulty, and postpone counts
                to warn you before skips occur.
              </Text>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Text style={styles.featureIcon}>⏱️</Text>
              </View>
              <Text style={styles.featureTitle}>Focus Mode & Sounds</Text>
              <Text style={styles.featureDescription}>
                Minimalist Pomodoro timer paired with ambient soundscapes (Rain, Cafe, Binaural Beats)
                to sustain deep work.
              </Text>
            </View>

            {/* Feature 4 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Text style={styles.featureIcon}>📊</Text>
              </View>
              <Text style={styles.featureTitle}>Analytics & Heatmaps</Text>
              <Text style={styles.featureDescription}>
                Track focus scores, deep work hours, completion ratios, and 30-day consistency
                heatmaps.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer info */}
        <Text style={styles.footerText}>Saarathi OS © 2026. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  logoIconText: {
    fontSize: 16,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoSubtext: {
    color: '#6366F1',
    fontWeight: '400',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  badgeText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 38,
  },
  heroTitleAccent: {
    fontSize: 34,
    fontWeight: '800',
    color: '#818CF8',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  actionContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  featuresSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  grid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  footerText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 40,
  },
});
