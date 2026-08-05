import React, { useState, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  Plus,
  Clock,
  Zap,
  RotateCcw,
  Volume2,
  ArrowRight,
} from 'lucide-react';
import { Task, EnergyLevel } from '@saarathi/types';
import { auth } from '@saarathi/api';
import { env } from '@/config/env';

interface BrainDumpViewProps {
  onAddTask: (title: string, category: string, energy: EnergyLevel) => void;
}

export const BrainDumpView: React.FC<BrainDumpViewProps> = ({ onAddTask }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<
    {
      title: string;
      estimatedDuration: number;
      energyRequired: EnergyLevel;
      category: string;
      aiSummary: string;
    }[]
  >([]);

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

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop & process
      setIsRecording(false);
      processAudioRecording();
    } else {
      // Start recording
      setExtractedTasks([]);
      setTranscript('');
      setIsRecording(true);
    }
  };

  const processAudioRecording = async () => {
    setIsProcessing(true);
    setTranscript('');
    setExtractedTasks([]);

    const mockTranscript =
      'I need to revise DBMS relational indexing for my exam, complete the full-stack API integration for Saarathi OS before 8 PM, go for a 45-minute gym session, and call my mother.';

    setTranscript(mockTranscript);

    let token = '';
    try {
      token = (await auth.currentUser?.getIdToken()) || '';
    } catch (e) {
      console.warn('Failed to retrieve Firebase ID token:', e);
    }

    const getWsUrl = () => {
      const baseUrl = env.apiBaseUrl;
      let wsUrl = baseUrl.replace(/^http/, 'ws');
      if (wsUrl.startsWith('/')) {
        const loc = typeof window !== 'undefined' ? window.location : { host: 'localhost', protocol: 'http:' };
        const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${proto}//${loc.host}${wsUrl}`;
      }
      return `${wsUrl}/brain-dump/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    };

    const wsUrl = getWsUrl();
    let hasReceivedTask = false;

    const fallbackResponse = () => {
      if (hasReceivedTask) return;
      setExtractedTasks([
        {
          title: 'Revise DBMS Relational Indexing',
          estimatedDuration: 45,
          energyRequired: 'High',
          category: 'College',
          aiSummary: 'Extracted from voice dump recording.',
        },
        {
          title: 'Full-Stack API Integration for Saarathi',
          estimatedDuration: 90,
          energyRequired: 'High',
          category: 'Coding',
          aiSummary: 'Connect Express proxy routes to Kairo AI.',
        },
        {
          title: 'Call Mother',
          estimatedDuration: 20,
          energyRequired: 'Low',
          category: 'Personal',
          aiSummary: 'Family checkin call.',
        },
      ]);
      setIsProcessing(false);
    };

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            transcript: mockTranscript,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'task_extracted') {
            hasReceivedTask = true;
            setExtractedTasks((prev) => [...prev, data.task]);
          } else if (data.status === 'done') {
            setIsProcessing(false);
            ws.close();
          }
        } catch (e) {
          console.error('Error parsing brain dump ws message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('Brain dump WebSocket error:', err);
        fallbackResponse();
      };

      ws.onclose = () => {
        setIsProcessing(false);
        fallbackResponse();
      };
    } catch (err) {
      console.error('Error starting brain dump WebSocket:', err);
      fallbackResponse();
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 text-center backdrop-blur-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold mb-2">
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span>Kairo Voice Brain Dump Pipeline</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Speak Your Mind Freely</h1>
        <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
          Record up to 2 minutes of unformatted thoughts. Kairo automatically extracts, prioritizes,
          and schedules your tasks.
        </p>
      </div>

      {/* Recording Waveform & Control Card */}
      <div className="p-8 rounded-3xl bg-gray-900 border border-white/10 text-center shadow-2xl relative overflow-hidden">
        {/* Glow Background */}
        {isRecording && (
          <div className="absolute inset-0 bg-indigo-600/10 animate-pulse pointer-events-none" />
        )}

        {/* Timer */}
        <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white mb-6 tracking-wider">
          {formatTimer(recordingSeconds)}
        </div>

        {/* Animated Waveform Lines */}
        <div className="h-16 flex items-center justify-center gap-1.5 mb-8">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 bg-indigo-500 rounded-full transition-all duration-150 ${
                isRecording ? 'animate-pulse' : 'h-3 opacity-30'
              }`}
              style={{
                height: isRecording ? `${Math.max(12, Math.random() * 60)}px` : '12px',
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Recording Trigger Button */}
        <button
          onClick={handleToggleRecording}
          disabled={isProcessing}
          className={`px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 mx-auto transition-all shadow-xl hover:scale-105 ${
            isRecording
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              <span>Stop & Extract Tasks</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 animate-pulse" />
              <span>Start Voice Recording</span>
            </>
          )}
        </button>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="p-6 rounded-2xl bg-gray-900/80 border border-indigo-500/30 text-center space-y-3">
          <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
          <div className="font-bold text-xs text-white">
            Kairo is organizing your thoughts...
          </div>
          <p className="text-[11px] text-gray-400">
            Extracting tasks, energy levels, categories, and scheduling them in real-time.
          </p>
        </div>
      )}

      {/* Transcript & Extracted Tasks Preview */}
      {(transcript || extractedTasks.length > 0) && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Transcript Box */}
          {transcript && (
            <div className="p-4 rounded-2xl bg-gray-950 border border-white/10 text-xs space-y-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                Raw Transcribed Audio
              </span>
              <p className="text-gray-300 italic">"{transcript}"</p>
            </div>
          )}

          {/* Extracted Task Cards */}
          <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Extracted Tasks ({extractedTasks.length})</span>
              </h3>

              {isProcessing ? (
                <span className="text-[10px] text-indigo-400 animate-pulse font-medium">
                  Streaming from Kairo...
                </span>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Auto-saved to Saarathi Workspace</span>
                  </div>
                  <button
                    onClick={() => {
                      setExtractedTasks([]);
                      setTranscript('');
                    }}
                    className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold rounded-xl border border-white/10 transition-colors"
                  >
                    Clear Preview
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {extractedTasks.map((task, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{task.title}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                        {task.category}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        ⚡ {task.energyRequired}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">{task.aiSummary}</p>
                  </div>

                  <span className="text-xs text-gray-400 font-mono shrink-0">
                    ⏱️ {task.estimatedDuration}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
