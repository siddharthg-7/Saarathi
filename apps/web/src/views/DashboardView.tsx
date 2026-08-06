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
      <div className="relative overflow-hidden rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>
                Kairo AI Daily Briefing •{' '}
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Good morning, {userProfile.brandingName || userProfile.name}! 👋
            </h1>

            <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
              You completed <strong className="text-success">8 of 10 tasks</strong> yesterday
              with an <strong className="text-primary font-bold">8.8/10 focus score</strong>. Sleep quality
              is evaluated at 84%.
            </p>

            {/* Optimal Focus Window Box */}
            <div className="mt-4 p-4 rounded-2xl bg-surfaceSecondary border border-border flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-text flex items-center gap-2">
                  Optimal Focus Window:{' '}
                  <span className="text-primary font-mono font-bold">09:30 AM – 11:30 AM</span>
                </div>
                <p className="text-textSecondary">
                  Peak cognitive capacity detected. Tackle high-friction tasks like{' '}
                  <strong className="text-text">Revise DBMS Relational Schema</strong> first.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Trigger */}
          <div className="flex flex-col gap-3 shrink-0">
            <button
              onClick={() => setBriefingAccepted(true)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                briefingAccepted
                  ? 'bg-success text-white'
                  : 'bg-primary hover:bg-primaryHover text-white'
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
              className="px-5 py-2.5 bg-surface hover:bg-surfaceSecondary text-textSecondary font-semibold text-xs rounded-xl border border-border flex items-center justify-center gap-2 transition-all"
            >
              <Bot className="w-4 h-4 text-primary" />
              <span>Discuss with Kairo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Procrastination Risk Alert Banner */}
      {highRiskTask && (
        <div className="p-4 rounded-2xl bg-warning/10 border border-warning/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-warning/20 text-warning shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-warning">
                  PROCRASTINATION RISK DETECTED
                </span>
                <span className="px-2 py-0.5 rounded-md bg-danger/10 text-danger text-[10px] font-bold border border-danger/25">
                  {highRiskTask.skipProbability}% SKIP RISK
                </span>
              </div>
              <p className="text-xs text-textSecondary mt-1">
                <strong className="text-text">"{highRiskTask.title}"</strong> has been postponed{' '}
                {highRiskTask.postponeCount} times on Monday evenings due to fatigue.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onPostponeTask(highRiskTask.id)}
              className="px-3 py-1.5 bg-warning/15 hover:bg-warning/25 text-warning border border-warning/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reschedule Tomorrow 7 AM</span>
            </button>
          </div>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-textSecondary font-medium">Today's Progress</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-extrabold text-text">
            {completedCount}{' '}
            <span className="text-xs text-muted font-normal">/ {tasks.length} tasks</span>
          </div>
          <div className="mt-2 w-full h-1.5 bg-surfaceSecondary rounded-full overflow-hidden">
            <div
              className="h-full bg-success transition-all duration-300"
              style={{ width: `${(completedCount / (tasks.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-textSecondary font-medium">Focus Score</span>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-text">
            8.8 <span className="text-xs text-muted font-normal">/ 10</span>
          </div>
          <div className="mt-1 text-[10px] text-success flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> +12% vs last week
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-textSecondary font-medium">Active Streak</span>
            <Flame className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl font-extrabold text-text">
            14 <span className="text-xs text-muted font-normal">Days</span>
          </div>
          <div className="mt-1 text-[10px] text-warning font-medium">Morning Cold Shower</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-textSecondary font-medium">Deep Work</span>
            <Timer className="w-4 h-4 text-purple" />
          </div>
          <div className="text-2xl font-extrabold text-text">
            4.5 <span className="text-xs text-muted font-normal">Hours Today</span>
          </div>
          <div className="mt-1 text-[10px] text-textSecondary">Target: 5.0 hrs</div>
        </div>
      </div>

      {/* Main Grid: Priority Tasks & Intelligence Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule & Priority Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span>Priority Tasks for Today</span>
            </h2>
            <button
              onClick={() => onSelectView('tasks')}
              className="text-xs text-primary hover:text-primaryHover flex items-center gap-1 font-semibold"
            >
              View All Tasks ({tasks.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all flex items-start justify-between gap-4 group shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleTaskComplete(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      task.status === 'completed'
                        ? 'bg-success border-success text-white'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-text group-hover:text-primary transition-colors">
                        {task.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surfaceSecondary border border-border text-textSecondary">
                        {task.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-primary border border-primary/10">
                        ⚡ {task.energyRequired} Energy
                      </span>
                    </div>

                    <p className="text-[11px] text-textSecondary leading-snug">{task.aiSummary}</p>

                    <div className="flex items-center gap-3 text-[10px] text-muted pt-1">
                      <span>⏱️ {task.estimatedDuration} mins</span>
                      <span>⏰ Scheduled: {task.scheduledTime || 'Flexible'}</span>
                      {task.skipProbability > 50 && (
                        <span className="text-warning font-bold">
                          ⚠️ {task.skipProbability}% Skip Risk
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectView('focus')}
                  className="p-2 rounded-xl bg-surfaceSecondary hover:bg-primary text-textSecondary hover:text-white border border-border transition-all shrink-0"
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
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Quick Intelligence Triggers</span>
          </h2>

          <div
            onClick={() => onSelectView('braindump')}
            className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/40 cursor-pointer shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono font-semibold">
                Voice AI
              </span>
            </div>
            <h3 className="font-bold text-xs text-text mb-1">Voice Brain Dump</h3>
            <p className="text-[11px] text-textSecondary leading-relaxed">
              Record spoken thoughts and automatically convert them into structured, scheduled
              tasks.
            </p>
          </div>

          <div
            onClick={() => onSelectView('focus')}
            className="p-5 rounded-2xl bg-surface border border-border hover:border-purple/40 cursor-pointer shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple/10 text-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                <Timer className="w-5 h-5" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple/15 text-purple font-mono font-semibold">
                25m Pomodoro
              </span>
            </div>
            <h3 className="font-bold text-xs text-text mb-1">Pomodoro Focus Timer</h3>
            <p className="text-[11px] text-textSecondary leading-relaxed">
              Launch distraction-free timer with ambient soundscapes (Rain, Binaural Beats, Cafe).
            </p>
          </div>

          <div
            onClick={() => onSelectView('aichat')}
            className="p-5 rounded-2xl bg-surface border border-border hover:border-success/40 cursor-pointer shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-mono font-semibold">
                Chat OS
              </span>
            </div>
            <h3 className="font-bold text-xs text-text mb-1">Ask Kairo AI Coach</h3>
            <p className="text-[11px] text-textSecondary leading-relaxed">
              Inquire about schedule optimization, deadline prioritization, or long-term vector
              memory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
