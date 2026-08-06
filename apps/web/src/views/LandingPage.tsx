import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Bot,
  Mic,
  Zap,
  BarChart3,
  ShieldCheck,
  Calendar,
  Layers,
  Activity,
} from 'lucide-react';
import { AuthModalMode, ViewType } from '@saarathi/types';

interface LandingPageProps {
  onOpenAuth: (mode: AuthModalMode) => void;
  onEnterWorkspace: () => void;
  onSelectView: (view: ViewType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onEnterWorkspace,
  onSelectView,
}) => {
  return (
    <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/20 selection:text-primary pb-20">
      {/* Background Subtle Gradient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/10 via-purple/5 to-transparent blur-3xl pointer-events-none" />

      {/* Landing Top Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between border-b border-divider">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Saarathi Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="font-extrabold text-lg tracking-tight text-text">
            Saarathi <span className="text-primary font-normal">OS</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('signin')}
            className="px-4 py-2 text-xs font-semibold text-textSecondary hover:text-text hover:bg-surfaceSecondary rounded-xl border border-border transition-all"
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primaryHover text-white rounded-xl shadow-sm transition-all"
          >
            Get Started Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-primary" />
          <span>Next-Gen Personal Productivity OS & Kairo AI</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-text tracking-tight leading-tight max-w-4xl mx-auto mb-6">
          Your AI-Powered <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple to-cyan">
            Productivity Operating System
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-textSecondary max-w-2xl mx-auto leading-relaxed mb-8">
          Saarathi unifies task scheduling, voice brain-dumping, habit tracking, and proactive ML
          procrastination prediction guided by your calm AI coach,{' '}
          <strong className="text-text font-bold">Kairo</strong>.
        </p>

        {/* Primary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-12">
          <button
            onClick={onEnterWorkspace}
            className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primaryHover text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <span>Launch Saarathi Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-6 py-3 bg-surface border border-border text-textSecondary font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-surfaceSecondary"
          >
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Get Started Free</span>
          </button>
        </div>

        {/* Live Feature Preview Banner Frame */}
        <div className="relative rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-medium-premium text-left max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-divider">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs text-textSecondary font-mono">saarathi.os/dashboard</span>
            </div>
            <span className="text-xs text-primary font-medium flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Kairo Online
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Daily Briefing Card */}
            <div className="p-4 rounded-xl bg-surfaceSecondary border border-border space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Sparkles className="w-4 h-4" /> Daily Briefing
              </div>
              <p className="text-textSecondary leading-relaxed">
                "Good morning Siddhartha! Peak focus window: 09:30 AM – 11:30 AM. Tackle DBMS Schema
                first."
              </p>
              <div className="text-[10px] text-success font-medium">92% Energy Match</div>
            </div>

            {/* Voice Brain Dump */}
            <div className="p-4 rounded-xl bg-surfaceSecondary border border-border space-y-2">
              <div className="flex items-center gap-2 text-success font-bold">
                <Mic className="w-4 h-4" /> Voice Brain Dump
              </div>
              <p className="text-textSecondary leading-relaxed">
                Spoken audio parsed instantly into structured tasks, subtasks, and assigned
                priorities via Groq.
              </p>
              <div className="text-[10px] text-primary font-medium">Auto-extracted 3 tasks</div>
            </div>

            {/* Procrastination Predictor */}
            <div className="p-4 rounded-xl bg-surfaceSecondary border border-border space-y-2">
              <div className="flex items-center gap-2 text-warning font-bold">
                <Activity className="w-4 h-4" /> Procrastination ML
              </div>
              <p className="text-textSecondary leading-relaxed">
                82% skip probability detected for Monday night workout due to fatigue.
                Auto-reschedule available.
              </p>
              <div className="text-[10px] text-warning font-medium">Proactive Nudge</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
            Built for High-Leverage Execution
          </h2>
          <p className="text-xs sm:text-sm text-textSecondary max-w-xl mx-auto">
            Inspired by Linear, Notion, Raycast, and Arc Browser — engineered for zero-friction
            daily flow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            onClick={() => {
              onSelectView('braindump');
            }}
            className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/45 transition-all cursor-pointer group hover:-translate-y-1 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-text mb-1">Voice Brain Dump</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Record raw, unformatted audio thoughts and let Kairo extract tasks, deadlines, and
              urgency automatically.
            </p>
          </div>

          <div
            onClick={() => {
              onSelectView('tasks');
            }}
            className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/45 transition-all cursor-pointer group hover:-translate-y-1 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-success/5 border border-success/10 text-success flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-text mb-1">Procrastination ML</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Machine learning algorithms analyze energy patterns, difficulty, and postpone counts
              to warn you before skips occur.
            </p>
          </div>

          <div
            onClick={() => {
              onSelectView('focus');
            }}
            className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/45 transition-all cursor-pointer group hover:-translate-y-1 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-purple/5 border border-purple/10 text-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-text mb-1">Focus Mode & Sounds</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Minimalist Pomodoro timer paired with ambient soundscapes (Rain, Cafe, Binaural Beats)
              to sustain deep work.
            </p>
          </div>

          <div
            onClick={() => {
              onSelectView('analytics');
            }}
            className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/45 transition-all cursor-pointer group hover:-translate-y-1 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan/5 border border-cyan/10 text-cyan flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-text mb-1">Analytics & Heatmaps</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Track focus scores, deep work hours, completion ratios, and 30-day consistency
              heatmaps.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Launch CTA Banner */}
      <section className="mt-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="p-8 rounded-3xl bg-gradient-to-b from-surfaceSecondary to-surface border border-border shadow-medium-premium">
          <h3 className="text-xl sm:text-2xl font-bold text-text mb-3">
            Ready to experience Saarathi OS?
          </h3>
          <p className="text-xs sm:text-sm text-textSecondary max-w-lg mx-auto mb-6">
            Jump into the fully interactive prototype right now or create your personalized profile.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onEnterWorkspace}
              className="px-6 py-2.5 bg-primary hover:bg-primaryHover text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-6 py-2.5 bg-surface hover:bg-surfaceSecondary text-textSecondary font-semibold text-xs rounded-xl border border-border transition-all"
            >
              Sign In Modal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
