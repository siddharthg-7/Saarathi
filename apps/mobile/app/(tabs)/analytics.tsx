import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useTaskStore } from '@saarathi/store';

export default function Analytics() {
  const { tasks } = useTaskStore();

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // High energy tasks distribution
  const highEnergyCount = tasks.filter((t) => t.energyRequired === 'High').length;
  const mediumEnergyCount = tasks.filter((t) => t.energyRequired === 'Medium').length;
  const lowEnergyCount = tasks.filter((t) => t.energyRequired === 'Low').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.description}>
        Track your focus score, postponement patterns, and task performance metrics.
      </Text>

      {/* Completion Ring Simulation Card */}
      <View style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Task Completion Rate</Text>
        <View style={styles.ringContainer}>
          <View style={styles.ringBackground}>
            <Text style={styles.ringPercentage}>{completionRate}%</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Total Tasks</Text>
            <Text style={styles.statValue}>{totalCount}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{completedCount}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{pendingCount}</Text>
          </View>
        </View>
      </View>

      {/* Energy Profile Chart Simulation */}
      <View style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Energy Load Profile</Text>
        <Text style={styles.cardSubtitle}>Distribution of tasks by required cognitive energy</Text>

        <View style={styles.barChart}>
          {/* High */}
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>High</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#EF4444',
                    width: totalCount > 0 ? `${(highEnergyCount / totalCount) * 100}%` : '0%',
                  },
                ]}
              />
            </View>
            <Text style={styles.barCount}>{highEnergyCount}</Text>
          </View>

          {/* Medium */}
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>Medium</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#F59E0B',
                    width: totalCount > 0 ? `${(mediumEnergyCount / totalCount) * 100}%` : '0%',
                  },
                ]}
              />
            </View>
            <Text style={styles.barCount}>{mediumEnergyCount}</Text>
          </View>

          {/* Low */}
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>Low</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#10B981',
                    width: totalCount > 0 ? `${(lowEnergyCount / totalCount) * 100}%` : '0%',
                  },
                ]}
              />
            </View>
            <Text style={styles.barCount}>{lowEnergyCount}</Text>
          </View>
        </View>
      </View>

      {/* Consistency Streaks */}
      <View style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Consistency Streaks</Text>
        <View style={styles.streakBox}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.streakValue}>5 Days</Text>
            <Text style={styles.streakLabel}>Current consistency streak</Text>
          </View>
        </View>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 24,
  },
  metricsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 14,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  ringBackground: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  ringPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 14,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 4,
  },
  barChart: {
    marginTop: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 60,
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#0F172A',
    borderRadius: 5,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barCount: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: 'bold',
    width: 20,
    textAlign: 'right',
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 10,
    marginTop: 6,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  streakLabel: {
    fontSize: 12,
    color: '#93C5FD',
    marginTop: 2,
  },
});
