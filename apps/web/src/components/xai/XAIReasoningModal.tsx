import React, { useEffect } from 'react';
import {
  X,
  Brain,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Clock,
  BarChart2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useXAIStore } from '@saarathi/store';

export const XAIReasoningModal: React.FC = () => {
  const explanation = useXAIStore((s) => s.activeModalExplanation);
  const closeModal = useXAIStore((s) => s.closeExplanationModal);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  if (!explanation) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="xai-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gray-950 border border-indigo-500/30 p-6 md:p-8 space-y-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 p-2 rounded-2xl bg-gray-900 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close reasoning modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>Explainable AI • Deep Reasoning & Attribution</span>
          </div>
          <h2 id="xai-modal-title" className="text-xl md:text-2xl font-extrabold text-white">
            Why am I seeing this prediction?
          </h2>
          <p className="text-xs text-gray-400">
            Saarathi inspects local tree decision contributions and user behavioral telemetry to explain this estimate.
          </p>
        </div>

        {/* Overview Score Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-gray-900 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Predicted Probability</span>
            <div className="text-2xl font-extrabold font-mono text-indigo-300">
              {Math.round(explanation.probability)}%
            </div>
            <div className="text-[10px] text-gray-500">
              {explanation.predictionType.replace('_', ' ')}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-900 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Evidence Quality</span>
            <div className="text-sm font-bold text-emerald-300 capitalize">
              {explanation.quality.replace('_', ' ')}
            </div>
            <div className="text-[10px] text-gray-500">
              {explanation.qualityReason || 'Statistical validation complete.'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-900 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Model Engine</span>
            <div className="text-sm font-bold text-white font-mono">
              {explanation.modelMetadata.modelName}
            </div>
            <div className="text-[10px] text-gray-500 font-mono">
              v{explanation.modelMetadata.modelVersion} (Method: {explanation.modelMetadata.explanationMethod})
            </div>
          </div>
        </div>

        {/* Feature Contribution Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>Ranked Feature Contributions (Local Attribution)</span>
          </h3>

          <div className="space-y-2">
            {(explanation.contributors || []).map((c) => (
              <div
                key={c.feature}
                className="p-3.5 rounded-2xl bg-gray-900/90 border border-white/5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gray-800 text-[10px] font-mono flex items-center justify-center text-gray-400">
                      {c.importanceRank}
                    </span>
                    <span>{c.displayName}</span>
                    <span className="text-gray-400 font-mono text-[11px]">({String(c.value)})</span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      c.direction === 'positive'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : c.direction === 'negative'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-gray-800 text-gray-400 border-gray-700'
                    }`}
                  >
                    {c.direction === 'positive'
                      ? `+${Math.round(Math.abs(c.normalizedContribution * 100))}% Risk Push`
                      : c.direction === 'negative'
                      ? `-${Math.round(Math.abs(c.normalizedContribution * 100))}% Risk Push`
                      : 'Neutral'}
                  </span>
                </div>

                {/* Progress Bar Visualizing Normalized Contribution */}
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      c.direction === 'positive'
                        ? 'bg-rose-500'
                        : c.direction === 'negative'
                        ? 'bg-emerald-500'
                        : 'bg-gray-600'
                    }`}
                    style={{
                      width: `${Math.max(10, Math.min(100, Math.abs(c.normalizedContribution * 100)))}%`,
                    }}
                  />
                </div>

                {c.description && (
                  <p className="text-[11px] text-gray-400 leading-relaxed">{c.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Behavioral Evidence */}
        {explanation.evidence && explanation.evidence.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Supporting Telemetry Evidence</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {explanation.evidence.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-gray-900/90 border border-white/5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-gray-400 text-[10px]">
                    <span className="font-bold text-emerald-300">{ev.fact}</span>
                    <span className="font-mono">Sample: {ev.sampleSize}</span>
                  </div>
                  <div className="text-white font-medium text-xs">{ev.metric}</div>
                  {ev.baselineComparison && (
                    <div className="text-[10px] text-gray-500 pt-0.5">
                      Baseline: {ev.baselineComparison}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traceability Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500 font-mono">
          <span>Explanation ID: {explanation.explanationId}</span>
          <span>Feature Set: v{explanation.modelMetadata.featureVersion}</span>
          <span>Task ID: {explanation.taskId}</span>
        </div>
      </div>
    </div>
  );
};
