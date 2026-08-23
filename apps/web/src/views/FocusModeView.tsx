import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Timer,
  AlertCircle,
  Maximize2,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';
import { Task } from '@saarathi/types';
import { TelemetryClient } from '@saarathi/api';

interface FocusModeViewProps {
  tasks: Task[];
  onToggleTaskComplete: (taskId: string) => void;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({ tasks, onToggleTaskComplete }) => {
  const [timerMode, setTimerMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [ambientSound, setAmbientSound] = useState('Rain');
  const [isMuted, setIsMuted] = useState(false);
  const [interruptions, setInterruptions] = useState(0);

  const sessionIdRef = useRef<string>(`foc_${Date.now()}`);
  const plannedSecondsRef = useRef<number>(25 * 60);
  const actualSecondsRef = useRef<number>(0);

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        actualSecondsRef.current += 1;
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Focus block completed
      TelemetryClient.trackFocus('focus_completed', sessionIdRef.current, {
        taskId: activeTask?.id,
        taskTitle: activeTask?.title,
        mode: timerMode,
        plannedDurationMinutes: Math.round(plannedSecondsRef.current / 60),
        actualDurationSeconds: actualSecondsRef.current,
        interruptionCount: interruptions,
        ambientSound: !isMuted ? ambientSound : 'None',
        completionStatus: 'completed',
      }).catch(() => {});
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, activeTask, timerMode, interruptions, isMuted, ambientSound]);

  const handleStartPause = () => {
    if (!isRunning) {
      // Starting / resuming
      setIsRunning(true);
      const isInitialStart = actualSecondsRef.current === 0;
      TelemetryClient.trackFocus(
        isInitialStart ? 'focus_started' : 'focus_resumed',
        sessionIdRef.current,
        {
          taskId: activeTask?.id,
          taskTitle: activeTask?.title,
          mode: timerMode,
          plannedDurationMinutes: Math.round(plannedSecondsRef.current / 60),
          actualDurationSeconds: actualSecondsRef.current,
          ambientSound: !isMuted ? ambientSound : 'None',
        }
      ).catch(() => {});
    } else {
      // Pausing
      setIsRunning(false);
      TelemetryClient.trackFocus('focus_paused', sessionIdRef.current, {
        taskId: activeTask?.id,
        mode: timerMode,
        actualDurationSeconds: actualSecondsRef.current,
      }).catch(() => {});
    }
  };

  const handleReset = () => {
    if (actualSecondsRef.current > 30) {
      TelemetryClient.trackFocus('focus_abandoned', sessionIdRef.current, {
        taskId: activeTask?.id,
        mode: timerMode,
        plannedDurationMinutes: Math.round(plannedSecondsRef.current / 60),
        actualDurationSeconds: actualSecondsRef.current,
        completionStatus: 'abandoned',
      }).catch(() => {});
    }
    setIsRunning(false);
    sessionIdRef.current = `foc_${Date.now()}`;
    actualSecondsRef.current = 0;
    if (timerMode === 'work') setTimeLeft(25 * 60);
    if (timerMode === 'shortBreak') setTimeLeft(5 * 60);
    if (timerMode === 'longBreak') setTimeLeft(15 * 60);
  };

  const handleSwitchMode = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setTimerMode(mode);
    setIsRunning(false);
    sessionIdRef.current = `foc_${Date.now()}`;
    actualSecondsRef.current = 0;
    if (mode === 'work') {
      setTimeLeft(25 * 60);
      plannedSecondsRef.current = 25 * 60;
    }
    if (mode === 'shortBreak') {
      setTimeLeft(5 * 60);
      plannedSecondsRef.current = 5 * 60;
    }
    if (mode === 'longBreak') {
      setTimeLeft(15 * 60);
      plannedSecondsRef.current = 15 * 60;
    }
  };

  const handleLogInterruption = () => {
    const nextCount = interruptions + 1;
    setInterruptions(nextCount);
    TelemetryClient.trackFocus('focus_interrupted', sessionIdRef.current, {
      taskId: activeTask?.id,
      interruptionCount: nextCount,
    }).catch(() => {});
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  const ambientSoundOptions = [
    { name: 'Rain', label: '🌧️ Heavy Rain & Storms' },
    { name: 'Cyber', label: '🎧 Cyber Synth Ambient' },
    { name: 'Binaural', label: '🧠 Binaural Alpha Beats (432Hz)' },
    { name: 'Cafe', label: '☕ Cafe Atmosphere' },
    { name: 'WhiteNoise', label: '📻 Gentle White Noise' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-3xl mx-auto text-center">
      {/* Header Mode Selector */}
      <div className="flex items-center justify-center gap-2 p-1.5 bg-gray-900 border border-white/10 rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => handleSwitchMode('work')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            timerMode === 'work'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Pomodoro (25m)
        </button>
        <button
          onClick={() => handleSwitchMode('shortBreak')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            timerMode === 'shortBreak'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Short Break (5m)
        </button>
        <button
          onClick={() => handleSwitchMode('longBreak')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            timerMode === 'longBreak'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Long Break (15m)
        </button>
      </div>

      {/* Main Focus Timer Canvas Display */}
      <div className="p-10 rounded-3xl bg-gray-900 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow pulse when running */}
        {isRunning && (
          <div className="absolute inset-0 bg-indigo-600/5 animate-pulse pointer-events-none" />
        )}

        {/* Task Selector Banner */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-300 bg-gray-950/80 p-3 rounded-2xl border border-white/5 max-w-lg mx-auto">
          <ListTodo className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Active Task:</span>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="bg-transparent font-bold text-white focus:outline-none cursor-pointer truncate max-w-xs"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id} className="bg-gray-900 text-white">
                {t.title} ({t.estimatedDuration}m)
              </option>
            ))}
          </select>
        </div>

        {/* Timer Display */}
        <div className="text-6xl sm:text-8xl font-extrabold font-mono text-white tracking-widest my-4">
          {formatTime(timeLeft)}
        </div>

        {/* Play/Pause Controls */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={handleStartPause}
            className={`w-16 h-16 rounded-2xl font-bold flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30'
            }`}
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>

          <button
            onClick={handleReset}
            className="p-4 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-white/10 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {activeTask && (
            <button
              onClick={() => onToggleTaskComplete(activeTask.id)}
              className="p-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-colors"
              title="Mark Task Complete"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Ambient Sound & Interruption Counter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ambient Sound Selector */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-white/10 space-y-3 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-gray-300">
            <span className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" /> Ambient Focus Soundscape
            </span>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-gray-400 hover:text-white text-[11px]"
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {ambientSoundOptions.map((snd) => (
              <button
                key={snd.name}
                onClick={() => setAmbientSound(snd.name)}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                  ambientSound === snd.name && !isMuted
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-gray-950 border-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>{snd.label}</span>
                {ambientSound === snd.name && !isMuted && (
                  <span className="text-[10px] text-emerald-400 font-mono">Playing</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Interruption Logger */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-white/10 space-y-3 text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-300 mb-2">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Interruption Logger
              </span>
              <span className="text-xl font-mono font-bold text-white">{interruptions}</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Track distractions during this focus block. Logging interruptions helps Kairo refine
              your optimal focus windows.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleLogInterruption}
              className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all"
            >
              +1 Log Distraction
            </button>
            <button
              onClick={() => setInterruptions(0)}
              className="px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-xl text-xs"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
