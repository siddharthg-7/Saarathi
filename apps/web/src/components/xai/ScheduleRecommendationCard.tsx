import React from 'react';
import {
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Check,
  X,
  RotateCcw,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { ScheduleRecommendation } from '@saarathi/types';
import { useXAIStore } from '@saarathi/store';

interface ScheduleRecommendationCardProps {
  recommendation: ScheduleRecommendation;
  onApplySchedule: (newDate: string, newTime: string) => void;
  onDismiss?: () => void;
  onChooseCustomTime?: () => void;
  className?: string;
}

export const ScheduleRecommendationCard: React.FC<ScheduleRecommendationCardProps> = ({
  recommendation,
  onApplySchedule,
  onDismiss,
  onChooseCustomTime,
  className = '',
}) => {
  const acceptRecommendation = useXAIStore((s) => s.acceptRecommendation);
  const rejectRecommendation = useXAIStore((s) => s.rejectRecommendation);

  const handleApply = () => {
    acceptRecommendation(recommendation);
    onApplySchedule(
      recommendation.recommendedSchedule.date,
      recommendation.recommendedSchedule.time
    );
  };

  const handleDismiss = () => {
    rejectRecommendation(recommendation);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      className={`p-6 rounded-3xl bg-gradient-to-br from-indigo-950/90 via-gray-900/90 to-purple-950/80 border border-indigo-500/30 backdrop-blur-xl shadow-2xl space-y-5 text-white ${className}`}
      data-testid="schedule-recommendation-card"
      role="region"
      aria-label="Smart Schedule Recommendation"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Kairo Smart Schedule Recommendation
            </h3>
            <p className="text-[11px] text-gray-400">
              Human-in-the-loop optimization • Model-backed improvement
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
          +{Math.round(recommendation.predictedImprovement)}% Predicted Success
        </span>
      </div>

      {/* Comparison Grid: Current vs Recommended */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Current Schedule Slot */}
        <div className="p-4 rounded-2xl bg-gray-950/70 border border-white/5 space-y-2">
          <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>Current Schedule</span>
          </div>

          <div className="text-sm font-bold text-gray-300">
            {recommendation.currentSchedule.date} at {recommendation.currentSchedule.time}
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/5">
            <span>Predicted Completion:</span>
            <span className="font-mono font-bold text-amber-400">
              {Math.round(recommendation.currentSchedule.predictedCompletion)}%
            </span>
          </div>
        </div>

        {/* Recommended Schedule Slot */}
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-2 shadow-inner">
          <div className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Recommended Slot</span>
          </div>

          <div className="text-sm font-bold text-white">
            {recommendation.recommendedSchedule.date} at {recommendation.recommendedSchedule.time}
          </div>

          <div className="flex items-center justify-between text-[11px] text-indigo-200 pt-1 border-t border-indigo-500/20">
            <span>Predicted Completion:</span>
            <span className="font-mono font-bold text-emerald-300">
              {Math.round(recommendation.recommendedSchedule.predictedCompletion)}%
            </span>
          </div>
        </div>
      </div>

      {/* Reason Description */}
      <div className="p-3.5 rounded-2xl bg-gray-950/60 border border-white/5 text-xs text-gray-300 leading-relaxed">
        {recommendation.reason}
      </div>

      {/* Human Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Move Task</span>
          </button>

          <button
            onClick={handleDismiss}
            className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-white/10 text-gray-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Keep Current Time</span>
          </button>
        </div>

        {onChooseCustomTime && (
          <button
            onClick={onChooseCustomTime}
            className="text-xs text-indigo-300 hover:text-indigo-200 font-semibold cursor-pointer underline-offset-4 hover:underline"
          >
            Choose Another Time
          </button>
        )}
      </div>
    </div>
  );
};
