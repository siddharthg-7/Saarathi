import React, { useState } from 'react';
import { Target, Sparkles, Plus, CheckCircle2, ArrowRight, Layers, Clock } from 'lucide-react';
import { Goal, Milestone } from '@saarathi/types';
import { kairoApi } from '@saarathi/api';

interface GoalsSystemViewProps {
  goals: Goal[];
  onAddGoal: (newGoal: Goal) => void;
}

export const GoalsSystemView: React.FC<GoalsSystemViewProps> = ({ goals, onAddGoal }) => {
  const [showDecomposeModal, setShowDecomposeModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('Career');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [isDecomposing, setIsDecomposing] = useState(false);

  const handleDecomposeAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setIsDecomposing(true);

    try {
      const data = await kairoApi.decomposeGoal(goalTitle, targetDate, goalCategory);

      const createdMilestones: Milestone[] = (data.milestones || []).map((m: any, idx: number) => ({
        id: `ms_${Date.now()}_${idx}`,
        title: m.title,
        targetWeeks: m.targetWeeks || 'Weeks 1-4',
        progress: m.progress || 10,
        completed: false,
      }));

      const newGoal: Goal = {
        id: `goal_${Date.now()}`,
        title: goalTitle,
        description: `Auto-decomposed by Kairo AI Architect for target completion by ${targetDate}.`,
        category: goalCategory,
        status: 'in_progress',
        targetDate,
        milestones: createdMilestones,
        dailyTasksCount: 3,
      };

      onAddGoal(newGoal);
      setGoalTitle('');
      setShowDecomposeModal(false);
    } catch (err) {
      console.error('Goal decomposition error:', err);
    } finally {
      setIsDecomposing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gray-900/80 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
            <Target className="w-4 h-4" />
            <span>Kairo Macro-to-Micro Goal Decomposition</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Goals & Strategic Roadmaps</h1>
        </div>

        <button
          onClick={() => setShowDecomposeModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Decompose New Goal with Kairo AI</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-6">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-4 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  {goal.category} • Target: {goal.targetDate}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{goal.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{goal.description}</p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 shrink-0">
                <Layers className="w-4 h-4" />
                <span>{goal.milestones.length} Milestones</span>
              </div>
            </div>

            {/* Milestones Progression */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Decomposed Milestones
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {goal.milestones.map((ms) => (
                  <div
                    key={ms.id}
                    className="p-4 rounded-2xl bg-gray-950 border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{ms.title}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{ms.targetWeeks}</span>
                    </div>

                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${ms.progress}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-gray-400 text-right font-mono">
                      {ms.progress}% Completed
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Goal Decomposer Modal */}
      {showDecomposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-gray-900 border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Goal Decomposer</span>
            </h3>

            <p className="text-xs text-gray-400">
              Input a macro objective. Kairo will break it down into quarterly milestones and daily
              actionable tasks.
            </p>

            <form onSubmit={handleDecomposeAndSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Macro Goal Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Build & Launch SaaS startup MVP in 60 days"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-950 text-xs text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full p-2.5 bg-gray-950 text-xs text-white rounded-xl border border-white/10"
                  >
                    <option value="Career">Career</option>
                    <option value="College">College</option>
                    <option value="Health">Health</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-950 text-xs text-white rounded-xl border border-white/10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDecomposeModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDecomposing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isDecomposing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Decompose & Save</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
