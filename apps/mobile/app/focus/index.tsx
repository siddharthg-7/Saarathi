import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function FocusMode() {
  const router = useRouter();
  const [duration, setDuration] = useState(25 * 60); // default 25 mins
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessionCount((prev) => prev + 1);
      Alert.alert('Session Complete!', 'Great focus! Take a short break.', [
        { text: 'OK', onPress: () => setTimeLeft(duration) },
      ]);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const selectDuration = (mins: number) => {
    setIsRunning(false);
    setDuration(mins * 60);
    setTimeLeft(mins * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus Space</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Timer Circle */}
      <View style={[styles.timerContainer, isRunning && styles.timerContainerActive]}>
        <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
        <Text style={styles.timerSubText}>{isRunning ? 'Stay Focused' : 'Ready'}</Text>
      </View>

      {/* Quick Selects */}
      <View style={styles.durationRow}>
        {[15, 25, 50].map((mins) => (
          <TouchableOpacity
            key={mins}
            style={[styles.durationBtn, duration === mins * 60 && styles.durationBtnActive]}
            onPress={() => selectDuration(mins)}
          >
            <Text style={[styles.durationText, duration === mins * 60 && styles.durationTextActive]}>
              {mins}m
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Play / Reset Buttons */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.playBtn, isRunning ? styles.pauseBtn : null]} onPress={toggleTimer}>
          <Text style={styles.playBtnText}>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsBox}>
        <Text style={styles.statsLabel}>Completed Sessions Today</Text>
        <Text style={styles.statsValue}>{sessionCount} 🔥</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  backBtn: {
    padding: 10,
  },
  backBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  timerContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 6,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#1E293B',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
  timerContainerActive: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  timer: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  timerSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  durationRow: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  durationBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  durationBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  durationText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  durationTextActive: {
    color: '#F8FAFC',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  resetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    marginRight: 20,
  },
  resetBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  pauseBtn: {
    backgroundColor: '#EF4444',
  },
  playBtnText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsBox: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 6,
  },
});
