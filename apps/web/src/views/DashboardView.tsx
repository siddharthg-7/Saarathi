import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Mic,
  Timer,
  Bot,
  AlertTriangle,
  Play,
  RotateCcw,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Task, UserProfile, ViewType } from '@saarathi/types';

interface DashboardViewProps {
  userProfile: UserProfile;
  tasks: Task[];
  onSelectView: (view: ViewType) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onPostponeTask: (taskId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  tasks,
  onSelectView,
  onToggleTaskComplete,
  onPostponeTask,
}) => {
  const [briefingAccepted, setBriefingAccepted] = useState(false);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const highRiskTask = tasks.find((t) => t.skipProbability > 70 && t.status !== 'completed');

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Greeting & Daily Briefing Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-indigo-950/60 to-gray-900 border border-white/10 p-6 sm:p-8 shadow-2xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>
                Kairo AI Daily Briefing •{' '}
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good morning, {userProfile.brandingName || userProfile.name}! 👋
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              You completed <strong className="text-emerald-400">8 of 10 tasks</strong> yesterday
              with an <strong className="text-indigo-400">8.8/10 focus score</strong>. Sleep quality
              is evaluated at 84%.
            </p>

            {/* Optimal Focus Window Box */}
            <div className="mt-4 p-4 rounded-2xl bg-gray-950/80 border border-indigo-500/30 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 mt-0.5 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-gray-200 flex items-center gap-2">
                  Optimal Focus Window:{' '}
                  <span className="text-indigo-400 font-mono">09:30 AM – 11:30 AM</span>
                </div>
                <p className="text-gray-400">
                  Peak cognitive capacity detected. Tackle high-friction tasks like{' '}
                  <strong className="text-white">Revise DBMS Relational Schema</strong> first.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Trigger */}
          <div className="flex flex-col gap-3 shrink-0">
            <button
              onClick={() => setBriefingAccepted(true)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                briefingAccepted
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:scale-[1.02]'
              }`}
            >
              {briefingAccepted ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Schedule Locked & Active</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lock Kairo Schedule</span>
                </>
              )}
            </button>

            <button
              onClick={() => onSelectView('aichat')}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-200 font-medium text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all"
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Discuss with Kairo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Procrastination Risk Alert Banner */}
      {highRiskTask && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-amber-300">
                  PROCRASTINATION RISK DETECTED
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                  {highRiskTask.skipProbability}% SKIP RISK
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                <strong>"{highRiskTask.title}"</strong> has been postponed{' '}
                {highRiskTask.postponeCount} times on Monday evenings due to fatigue.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onPostponeTask(highRiskTask.id)}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reschedule Tomorrow 7 AM</span>
            </button>
          </div>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gray-900/70 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Today's Progress</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {completedCount}{' '}
            <span className="text-xs text-gray-500 font-normal">/ {tasks.length} tasks</span>
          </div>
          <div className="mt-2 w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(completedCount / (tasks.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/70 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Focus Score</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            8.8 <span className="text-xs text-gray-500 font-normal">/ 10</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% vs last week
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/70 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Active Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            14 <span className="text-xs text-gray-500 font-normal">Days</span>
          </div>
          <div className="mt-1 text-[10px] text-amber-400 font-medium">Morning Cold Shower</div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/70 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Deep Work</span>
            <Timer className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            4.5 <span className="text-xs text-gray-500 font-normal">Hours Today</span>
          </div>
          <div className="mt-1 text-[10px] text-gray-400">Target: 5.0 hrs</div>
        </div>
      </div>

      {/* Main Grid: Priority Tasks & Intelligence Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule & Priority Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <span>Priority Tasks for Today</span>
            </h2>
            <button
              onClick={() => onSelectView('tasks')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              View All Tasks ({tasks.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-gray-900/70 border border-white/10 hover:border-indigo-500/30 transition-all flex items-start justify-between gap-4 group"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleTaskComplete(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      task.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-white/20 hover:border-indigo-400'
                    }`}
                  >
                    {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">
                        {task.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                        {task.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        ⚡ {task.energyRequired} Energy
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-snug">{task.aiSummary}</p>

                    <div className="flex items-center gap-3 text-[10px] text-gray-500 pt-1">
                      <span>⏱️ {task.estimatedDuration} mins</span>
                      <span>⏰ Scheduled: {task.scheduledTime || 'Flexible'}</span>
                      {task.skipProbability > 50 && (
                        <span className="text-amber-400 font-bold">
                          ⚠️ {task.skipProbability}% Skip Risk
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectView('focus')}
                  className="p-2 rounded-xl bg-gray-800 hover:bg-indigo-600 text-gray-300 hover:text-white border border-white/5 transition-all shrink-0"
                  title="Start Focus Mode for this task"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Quick Intelligence Tools */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Quick Intelligence Triggers</span>
          </h2>

          <div
            onClick={() => onSelectView('braindump')}
            className="p-5 rounded-2xl bg-gradient-to-br from-gray-900 to-indigo-950/40 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Voice AI
              </span>
            </div>
            <h3 className="font-bold text-xs text-white mb-1">Voice Brain Dump</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Record spoken thoughts and automatically convert them into structured, scheduled
              tasks.
            </p>
          </div>

          <div
            onClick={() => onSelectView('focus')}
            className="p-5 rounded-2xl bg-gradient-to-br from-gray-900 to-purple-950/40 border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Timer className="w-5 h-5" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                25m Pomodoro
              </span>
            </div>
            <h3 className="font-bold text-xs text-white mb-1">Pomodoro Focus Timer</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Launch distraction-free timer with ambient soundscapes (Rain, Binaural Beats, Cafe).
            </p>
          </div>

          <div
            onClick={() => onSelectView('aichat')}
            className="p-5 rounded-2xl bg-gradient-to-br from-gray-900 to-emerald-950/40 border border-white/10 hover:border-emerald-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Chat OS
              </span>
            </div>
            <h3 className="font-bold text-xs text-white mb-1">Ask Kairo AI Coach</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Inquire about schedule optimization, deadline prioritization, or long-term vector
              memory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
