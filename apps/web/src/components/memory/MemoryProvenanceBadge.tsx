import React, { useState } from 'react';
import {
  Brain,
  FileText,
  Target,
  MessageSquare,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Calendar,
  X,
  Database
} from 'lucide-react';
import { HybridSearchResult, MemorySourceType } from '@saarathi/types';

interface MemoryProvenanceBadgeProps {
  memory: HybridSearchResult;
}

export const MemoryProvenanceBadge: React.FC<MemoryProvenanceBadgeProps> = ({ memory }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getSourceIcon = (sourceType: MemorySourceType) => {
    switch (sourceType) {
      case 'brain_dump':
        return <Brain className="w-3 h-3 text-purple-400" />;
      case 'note':
        return <FileText className="w-3 h-3 text-blue-400" />;
      case 'goal':
        return <Target className="w-3 h-3 text-emerald-400" />;
      case 'kairo_chat':
        return <MessageSquare className="w-3 h-3 text-amber-400" />;
      case 'user_preference':
        return <Bookmark className="w-3 h-3 text-pink-400" />;
      case 'task':
      case 'task_history':
        return <CheckCircle2 className="w-3 h-3 text-cyan-400" />;
      case 'analytics_insight':
        return <Sparkles className="w-3 h-3 text-indigo-400" />;
      default:
        return <Database className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatSourceLabel = (sourceType: MemorySourceType) => {
    return sourceType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-surface-hover/80 hover:bg-surface-border text-text-secondary hover:text-text-primary border border-surface-border transition-all duration-200 shadow-sm"
        title="Retrieved from Long-Term Memory (Click for provenance details)"
      >
        {getSourceIcon(memory.sourceType)}
        <span>{formatSourceLabel(memory.sourceType)}</span>
        <span className="text-text-muted">•</span>
        <span className="text-text-muted text-[11px]">{formatDate(memory.createdAt)}</span>
        <span className="text-[10px] px-1 py-0.2 bg-primary/10 text-primary-light font-mono rounded">
          {Math.round(memory.hybridScore * 100)}% match
        </span>
      </button>

      {/* Provenance Details Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                {getSourceIcon(memory.sourceType)}
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  Memory Provenance Details
                </h3>
                <p className="text-xs text-text-muted">
                  Source: {formatSourceLabel(memory.sourceType)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-dark p-3.5 rounded-xl border border-surface-border">
                <div className="text-xs font-medium text-text-muted mb-1">Content:</div>
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {memory.content}
                </p>
              </div>

              {memory.summary && memory.summary !== memory.content && (
                <div className="bg-surface-dark/60 p-3 rounded-xl border border-surface-border">
                  <div className="text-xs font-medium text-text-muted mb-1">Summary:</div>
                  <p className="text-xs text-text-secondary">{memory.summary}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-dark/50 p-2.5 rounded-xl border border-surface-border text-center">
                  <div className="text-[11px] text-text-muted">Semantic Similarity</div>
                  <div className="text-sm font-semibold text-primary-light font-mono mt-0.5">
                    {Math.round(memory.semanticScore * 100)}%
                  </div>
                </div>
                <div className="bg-surface-dark/50 p-2.5 rounded-xl border border-surface-border text-center">
                  <div className="text-[11px] text-text-muted">Keyword Score</div>
                  <div className="text-sm font-semibold text-amber-400 font-mono mt-0.5">
                    {Math.round(memory.keywordScore * 100)}%
                  </div>
                </div>
                <div className="bg-surface-dark/50 p-2.5 rounded-xl border border-surface-border text-center">
                  <div className="text-[11px] text-text-muted">Combined Hybrid</div>
                  <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">
                    {Math.round(memory.hybridScore * 100)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-surface-border">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Recorded on {formatDate(memory.createdAt)}
                </span>
                <span>Importance: {Math.round(memory.importance * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
