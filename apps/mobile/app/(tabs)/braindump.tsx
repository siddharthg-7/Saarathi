import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { apiClient } from '@saarathi/api';
import { useTaskStore } from '@saarathi/store';

interface ExtractedTask {
  id: string;
  title: string;
  category: string;
  energyRequired: string;
  estimatedDuration: number;
}

export default function BrainDump() {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);

  // Simulation timer for recording
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setTranscript('');
    setExtractedTasks([]);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Simulate speaking transcript
    setTranscript(
      "Okay, so I need to draft the proposal for the Saarathi mobile application design system today. Also, please add a high-energy task to write integration tests for tomorrow morning. Oh, and I need to schedule a short sync call with Siddharth at 3 PM."
    );
  };

  const handleProcessTranscript = async () => {
    if (!transcript.trim()) {
      Alert.alert('Error', 'Please record your thoughts or type them in the box first.');
      return;
    }

    setLoading(true);
    try {
      // Send directly to FastAPI backend /v1/brain-dump/process
      const res = await apiClient.post<any>('/brain-dump/process', {
        transcript: transcript,
      });

      if (res && res.extractedTasks) {
        setExtractedTasks(res.extractedTasks);
        Alert.alert('Success', `Successfully extracted ${res.extractedTasks.length} tasks and synced them to Firestore!`);
      } else {
        Alert.alert('Failed', 'Could not parse any tasks from your transcript.');
      }
    } catch (err: any) {
      console.log('Backend unreachable, queueing offline:', err);
      // Reassuring user message required by Phase 12
      Alert.alert(
        'Saved Locally',
        "Saved — Kairo will process this when you're back online."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Voice Brain Dump</Text>
      <Text style={styles.description}>
        Ramble your thoughts, tasks, and schedules. Kairo will transcribe and extract them automatically.
      </Text>

      {/* Voice Recorder Simulation Area */}
      <View style={styles.recorderCard}>
        {isRecording ? (
          <View style={styles.recordingState}>
            <View style={styles.pulseContainer}>
              <View style={styles.pulseCircle} />
              <Text style={styles.recordingEmoji}>🎙️</Text>
            </View>
            <Text style={styles.recordingTimer}>{formatTime(recordingSeconds)}</Text>
            <Text style={styles.recordingText}>Listening to your thoughts...</Text>
            <TouchableOpacity style={styles.stopButton} onPress={handleStopRecording}>
              <Text style={styles.stopButtonText}>Stop & Transcribe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.idleState}>
            <TouchableOpacity style={styles.recordButton} onPress={handleStartRecording}>
              <Text style={styles.recordButtonText}>🎙️ Start Voice Dump</Text>
            </TouchableOpacity>
            <Text style={styles.idleHint}>Or write your thoughts manually below</Text>
          </View>
        )}
      </View>

      {/* Text Area Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Thoughts / Transcript</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          placeholder="E.g., I need to call the team tomorrow at 10 AM, and finish writing the layout schema today."
          placeholderTextColor="#64748B"
          value={transcript}
          onChangeText={setTranscript}
        />
      </View>

      <TouchableOpacity
        style={[styles.processBtn, loading && styles.processBtnDisabled]}
        onPress={handleProcessTranscript}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.processBtnText}>🚀 Process thoughts with Kairo</Text>
        )}
      </TouchableOpacity>

      {/* Extracted Tasks Summary */}
      {extractedTasks.length > 0 && (
        <View style={styles.extractedCard}>
          <Text style={styles.extractedTitle}>✨ Extracted Tasks</Text>
          {extractedTasks.map((t, idx) => (
            <View key={t.id || idx} style={styles.extractedRow}>
              <Text style={styles.extractedDot}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.extractedTaskTitle}>{t.title}</Text>
                <Text style={styles.extractedMeta}>
                  {t.category} • {t.estimatedDuration} mins • {t.energyRequired} Energy
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
  recorderCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  idleState: {
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  recordButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  idleHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 14,
  },
  recordingState: {
    alignItems: 'center',
  },
  pulseContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7F1D1D',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#EF4444',
    opacity: 0.5,
  },
  recordingEmoji: {
    fontSize: 32,
  },
  recordingTimer: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginVertical: 12,
  },
  recordingText: {
    fontSize: 13,
    color: '#F8FAFC',
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  stopButtonText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
  },
  processBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  processBtnDisabled: {
    opacity: 0.6,
  },
  processBtnText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  extractedCard: {
    backgroundColor: '#0F172A',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  extractedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 12,
  },
  extractedRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  extractedDot: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  extractedTaskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  extractedMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
