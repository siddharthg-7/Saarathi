import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useTaskStore } from '@saarathi/store';
import { kairoApi, DailyBriefingResponse } from '@saarathi/api';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  const { userProfile, signOut } = useAuth();
  const { tasks, initTaskListener } = useTaskStore();
  const [briefing, setBriefing] = useState<DailyBriefingResponse | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(true);

  // Sync tasks in background
  useEffect(() => {
    if (userProfile.id) {
      const unsubscribe = initTaskListener(userProfile.id);
      return unsubscribe;
    }
  }, [userProfile.id]);

  // Fetch Daily Briefing
  useEffect(() => {
    async function fetchBriefing() {
      try {
        const res = await kairoApi.getDailyBriefing();
        setBriefing(res);
      } catch (err) {
        console.error('Failed to get Kairo daily brief:', err);
      } finally {
        setLoadingBrief(false);
      }
    }
    fetchBriefing();
  }, []);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.name}>{userProfile.name}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Focus Mode CTA */}
      <TouchableOpacity style={styles.focusCard} onPress={() => router.push('/focus')}>
        <View>
          <Text style={styles.focusTitle}>Focus Mode</Text>
          <Text style={styles.focusSubtitle}>Start a Pomodoro session now</Text>
        </View>
        <Text style={styles.focusIcon}>⏱️</Text>
      </TouchableOpacity>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
      </View>

      {/* Kairo Daily Briefing */}
      <View style={styles.briefCard}>
        <View style={styles.briefHeader}>
          <Text style={styles.briefHeading}>🤖 Kairo Assistant</Text>
          <Text style={styles.briefBadge}>Morning Brief</Text>
        </View>

        {loadingBrief ? (
          <ActivityIndicator size="small" color="#3B82F6" style={{ marginVertical: 20 }} />
        ) : briefing ? (
          <View>
            <Text style={styles.greetingText}>{briefing.greeting}</Text>
            
            {briefing.optimalFocusWindow && (
              <View style={styles.windowBox}>
                <Text style={styles.windowLabel}>🔥 Optimal Focus Window Today:</Text>
                <Text style={styles.windowValue}>
                  {typeof briefing.optimalFocusWindow === 'string'
                    ? briefing.optimalFocusWindow
                    : `${briefing.optimalFocusWindow.start} - ${briefing.optimalFocusWindow.end}`}
                </Text>
              </View>
            )}

            {briefing.briefingSummary && (
              <Text style={styles.summaryText}>{briefing.briefingSummary}</Text>
            )}

            {briefing.suggestedAdjustments && briefing.suggestedAdjustments.length > 0 && (
              <View style={styles.adjustmentsContainer}>
                <Text style={styles.adjustmentsTitle}>Smart Coaching Tips:</Text>
                {briefing.suggestedAdjustments.map((tip, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.errorText}>Could not load daily briefing.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcome: {
    fontSize: 14,
    color: '#94A3B8',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  focusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  focusSubtitle: {
    fontSize: 12,
    color: '#93C5FD',
    marginTop: 4,
  },
  focusIcon: {
    fontSize: 28,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  briefCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  briefHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 10,
  },
  briefHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  briefBadge: {
    fontSize: 10,
    color: '#10B981',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    fontWeight: 'bold',
  },
  greetingText: {
    fontSize: 15,
    color: '#F1F5F9',
    lineHeight: 22,
    marginBottom: 12,
  },
  windowBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  windowLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  windowValue: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: 'bold',
    marginTop: 2,
  },
  summaryText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 14,
  },
  adjustmentsContainer: {
    marginTop: 10,
  },
  adjustmentsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  tipBullet: {
    color: '#10B981',
    marginRight: 6,
    fontSize: 14,
  },
  tipText: {
    fontSize: 13,
    color: '#E2E8F0',
    flex: 1,
    lineHeight: 18,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
});
