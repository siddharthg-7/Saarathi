import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Flame,
  Award,
} from 'lucide-react';
import { AnalyticsData } from '@saarathi/types';

interface AnalyticsViewProps {
  analytics: AnalyticsData;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gray-900/80 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Saarathi Telemetry & Performance Matrix</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Productivity Analytics</h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-gray-950 px-3 py-1.5 rounded-xl border border-white/10">
          <span>Weekly Window: July 28 - Aug 3, 2026</span>
        </div>
      </div>

      {/* Top 4 Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {Math.round((analytics.completedTasksCount / analytics.totalTasksCount) * 100)}%
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {analytics.completedTasksCount} of{' '}
            {analytics.totalTasksCount} tasks
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/70 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Average Focus Score</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics.focusScore} <span className="text-xs text-gray-500 font-normal">/ 10</span>
          </div>
          <div className="text-[10px] text-indigo-400 font-medium">+0.6 vs last month</div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/70 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Deep Work Hours</span>
            <Timer className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{analytics.deepWorkHours}h</div>
          <div className="text-[10px] text-gray-400">
            Total Hours: {analytics.totalHoursWorked}h
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/70 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Avg Skip Risk Rate</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics.procrastinationSkipAverage}%
          </div>
          <div className="text-[10px] text-amber-400 font-medium">Reduced by 18% via Kairo</div>
        </div>
      </div>

      {/* 30-Day Consistency Heatmap Grid */}
      <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>30-Day Consistency & Execution Heatmap</span>
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-gray-950 border border-white/10" />
              <span className="w-2.5 h-2.5 rounded bg-emerald-900" />
              <span className="w-2.5 h-2.5 rounded bg-emerald-700" />
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="w-2.5 h-2.5 rounded bg-emerald-400 ring-2 ring-emerald-300" />
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 pt-2">
          {analytics.heatmap.map((day, idx) => {
            const colors = [
              'bg-gray-950 border-white/5',
              'bg-emerald-900/60 border-emerald-800',
              'bg-emerald-700/80 border-emerald-600',
              'bg-emerald-500 border-emerald-400',
              'bg-emerald-400 text-gray-950 border-emerald-300 font-bold',
            ];
            return (
              <div
                key={idx}
                className={`h-10 rounded-xl border flex flex-col items-center justify-center text-[10px] transition-all hover:scale-105 cursor-pointer ${
                  colors[day.level]
                }`}
                title={`${day.date}: ${day.count} tasks executed`}
              >
                <span className="font-mono">{day.date.split('-')[2]}</span>
                <span className="text-[8px] opacity-80">{day.count}x</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Breakdown & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Completion Bar Chart Simulation */}
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Weekly Task Execution vs Postponements</span>
          </h3>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {analytics.weeklyCompletion.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-36">
                  {/* Completed Bar */}
                  <div
                    className="w-1/2 bg-indigo-500 rounded-t-lg transition-all duration-300"
                    style={{ height: `${(item.completed / 12) * 100}%` }}
                    title={`Completed: ${item.completed}`}
                  />
                  {/* Postponed Bar */}
                  <div
                    className="w-1/2 bg-amber-500/60 rounded-t-lg transition-all duration-300"
                    style={{ height: `${(item.postponed / 12) * 100}%` }}
                    title={`Postponed: ${item.postponed}`}
                  />
                </div>
                <span className="text-[10px] font-mono text-gray-400">{item.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-gray-400 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-indigo-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500/60" />
              <span>Postponed / Rescheduled</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Time Distribution by Category</span>
          </h3>

          <div className="space-y-3 pt-2">
            {analytics.categoryDistribution.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-300">
                  <span>{cat.category}</span>
                  <span className="font-mono text-gray-400">{cat.count} hours</span>
                </div>
                <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(cat.count / 20) * 100}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
