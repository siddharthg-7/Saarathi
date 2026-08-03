import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Bot,
  Mic,
  Zap,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  Flame,
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
    <div className="min-h-full bg-gray-950 text-gray-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Background Subtle Gradient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-600/15 via-purple-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 shadow-sm shadow-indigo-500/10">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
          <span>Next-Gen Personal Productivity OS & Kairo AI</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto mb-6">
          Your AI-Powered <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">
            Productivity Operating System
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Saarathi unifies task scheduling, voice brain-dumping, habit tracking, and proactive ML
          procrastination prediction guided by your calm AI coach,{' '}
          <strong className="text-gray-200">Kairo</strong>.
        </p>

        {/* Primary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-12">
          <button
            onClick={onEnterWorkspace}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <span>Launch Saarathi Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-gray-800 text-gray-200 font-semibold text-sm rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Get Started Free</span>
          </button>
        </div>

        {/* Live Feature Preview Banner Frame */}
        <div className="relative rounded-2xl border border-white/10 bg-gray-900/80 p-4 sm:p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-md text-left max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs text-gray-400 font-mono">saarathi.os/dashboard</span>
            </div>
            <span className="text-xs text-indigo-400 font-medium flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Kairo Online
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Daily Briefing Card */}
            <div className="p-4 rounded-xl bg-gray-950/80 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Sparkles className="w-4 h-4" /> Daily Briefing
              </div>
              <p className="text-gray-300 leading-relaxed">
                "Good morning Siddhartha! Peak focus window: 09:30 AM – 11:30 AM. Tackle DBMS Schema
                first."
              </p>
              <div className="text-[10px] text-emerald-400 font-medium">92% Energy Match</div>
            </div>

            {/* Voice Brain Dump */}
            <div className="p-4 rounded-xl bg-gray-950/80 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Mic className="w-4 h-4" /> Voice Brain Dump
              </div>
              <p className="text-gray-300 leading-relaxed">
                Spoken audio parsed instantly into structured tasks, subtasks, and assigned
                priorities via Groq.
              </p>
              <div className="text-[10px] text-indigo-400 font-medium">Auto-extracted 3 tasks</div>
            </div>

            {/* Procrastination Predictor */}
            <div className="p-4 rounded-xl bg-gray-950/80 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Activity className="w-4 h-4" /> Procrastination ML
              </div>
              <p className="text-gray-300 leading-relaxed">
                82% skip probability detected for Monday night workout due to fatigue.
                Auto-reschedule available.
              </p>
              <div className="text-[10px] text-amber-400 font-medium">Proactive Nudge</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Built for High-Leverage Execution
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            Inspired by Linear, Notion, Raycast, and Arc Browser — engineered for zero-friction
            daily flow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            onClick={() => {
              onSelectView('braindump');
            }}
            className="p-5 rounded-2xl bg-gray-900/60 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer group hover:-translate-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Voice Brain Dump</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Record raw, unformatted audio thoughts and let Kairo extract tasks, deadlines, and
              urgency automatically.
            </p>
          </div>

          <div
            onClick={() => {
              onSelectView('tasks');
            }}
            className="p-5 rounded-2xl bg-gray-900/60 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer group hover:-translate-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Procrastination ML</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Machine learning algorithms analyze energy patterns, difficulty, and postpone counts
              to warn you before skips occur.
            </p>
          </div>

          <div
            onClick={() => {
              onSelectView('focus');
            }}
            className="p-5 rounded-2xl bg-gray-900/60 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer group hover:-translate-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Focus Mode & Sounds</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Minimalist Pomodoro timer paired with ambient soundscapes (Rain, Cafe, Binaural Beats)
              to sustain deep work.
            </p>
          </div>

          <div
            onClick={() => {
              onSelectView('analytics');
            }}
            className="p-5 rounded-2xl bg-gray-900/60 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer group hover:-translate-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Analytics & Heatmaps</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Track focus scores, deep work hours, completion ratios, and 30-day consistency
              heatmaps.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Launch CTA Banner */}
      <section className="mt-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950/80 to-gray-900 border border-indigo-500/30 shadow-2xl">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Ready to experience Saarathi OS?
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto mb-6">
            Jump into the fully interactive prototype right now or create your personalized profile.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onEnterWorkspace}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-200 font-semibold text-xs rounded-xl border border-white/10 transition-all"
            >
              Sign In Modal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
