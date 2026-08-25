import React from 'react';
import {
  Brain,
  Sparkles,
  Info,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { XAIExplanation, FeatureContributor } from '@saarathi/types';
import { useXAIStore } from '@saarathi/store';

interface ExplainabilityCardProps {
  explanation: XAIExplanation;
  onOpenScheduleRecommendation?: () => void;
  className?: string;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({
  explanation,
  onOpenScheduleRecommendation,
  className = '',
}) => {
  const openExplanationModal = useXAIStore((s) => s.openExplanationModal);

  const getStrengthBadge = (contributor: FeatureContributor) => {
    switch (contributor.strength) {
      case 'strong_positive':
        return {
          label: 'Strong Risk Signal',
          classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'positive':
        return {
          label: 'Elevated Signal',
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'strong_negative':
        return {
          label: 'Strong Success Factor',
          classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'negative':
        return {
          label: 'Favorable Factor',
          classes: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
      default:
        return {
          label: 'Neutral Baseline',
          classes: 'bg-gray-800 text-gray-300 border-gray-700',
        };
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'strong_evidence':
        return {
          label: 'Strong Evidence (15+ Sessions)',
          classes: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        };
      case 'moderate_evidence':
        return {
          label: 'Verified History (5-14 Sessions)',
          classes: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
        };
      case 'limited_evidence':
        return {
          label: 'Early Signal (<5 Sessions)',
          classes: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        };
      default:
        return {
          label: 'Heuristic Cold-Start',
          classes: 'bg-gray-800 text-gray-400 border-gray-700',
        };
    }
  };

  const qualityBadge = getQualityBadge(explanation.quality);
  const topContributors = (explanation.contributors || []).slice(0, 3);
  const primaryEvidence = explanation.evidence && explanation.evidence.length > 0 ? explanation.evidence[0] : null;

  return (
    <div
      className={`p-5 rounded-3xl bg-gray-900/90 border border-indigo-500/20 backdrop-blur-xl shadow-xl space-y-4 text-white ${className}`}
      data-testid="explainability-card"
      role="region"
      aria-label="Kairo AI Reasoning and Explanation"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Kairo's Reasoning
              </h4>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${qualityBadge.classes}`}
              >
                {qualityBadge.label}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Evidence-based transparency • Model: {explanation.modelMetadata?.modelName || 'task_risk_rf'} v
              {explanation.modelMetadata?.modelVersion || '1.0.0'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-extrabold font-mono text-white">
            {Math.round(explanation.probability)}%
          </div>
          <div className="text-[9px] uppercase font-bold text-gray-400">
            {explanation.predictionType === 'task_risk' ? 'Predicted Delay Risk' : 'Probability'}
          </div>
        </div>
      </div>

      {/* Why? Contributing Factors */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Contributing Factors</span>
        </div>

        {topContributors.length > 0 ? (
          <div className="space-y-2">
            {topContributors.map((c) => {
              const badge = getStrengthBadge(c);
              return (
                <div
                  key={c.feature}
                  className="p-2.5 rounded-2xl bg-gray-950/70 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.direction === 'positive'
                            ? 'bg-rose-400'
                            : c.direction === 'negative'
                            ? 'bg-emerald-400'
                            : 'bg-gray-400'
                        }`}
                      />
                      <span>{c.displayName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({String(c.value)})</span>
                    </div>
                    {c.description && (
                      <p className="text-[10px] text-gray-400 leading-tight">{c.description}</p>
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-md border shrink-0 ${badge.classes}`}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-gray-950/70 text-xs text-gray-400">
            Standard task attributes align with baseline workload.
          </div>
        )}
      </div>

      {/* Behavioral Evidence Section */}
      {primaryEvidence && (
        <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300">
            <span>Verified Behavioral Evidence</span>
            <span className="font-mono text-gray-400">Sample Size: {primaryEvidence.sampleSize}</span>
          </div>
          <div className="text-gray-200 font-medium">{primaryEvidence.fact}</div>
          <div className="text-[11px] text-indigo-200 font-mono">{primaryEvidence.metric}</div>
        </div>
      )}

      {/* Actions / Drill-down */}
      <div className="flex items-center justify-between pt-1 gap-2 border-t border-white/5">
        <button
          onClick={() => openExplanationModal(explanation)}
          className="text-xs text-indigo-300 hover:text-indigo-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          aria-label="Inspect detailed feature contributions"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Why am I seeing this?</span>
        </button>

        {onOpenScheduleRecommendation && (
          <button
            onClick={onOpenScheduleRecommendation}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <span>Review Optimal Timing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
