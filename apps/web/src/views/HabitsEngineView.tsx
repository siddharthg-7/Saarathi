import React, { useState } from 'react';
import { Flame, Plus, CheckCircle2, TrendingUp, Award, Calendar } from 'lucide-react';
import { Habit } from '@saarathi/types';

interface HabitsEngineViewProps {
  habits: Habit[];
  onToggleHabitDay: (habitId: string, dayIndex: number) => void;
  onAddHabit: (title: string, category: string, color: string) => void;
}

export const HabitsEngineView: React.FC<HabitsEngineViewProps> = ({
  habits,
  onToggleHabitDay,
  onAddHabit,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Health');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onAddHabit(newTitle.trim(), newCategory, '#10B981');
      setNewTitle('');
      setShowModal(false);
    }
  };

  const daysLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gray-900/80 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Flame className="w-4 h-4" />
            <span>Saarathi Habit Momentum & Consistency Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Habits & Daily Streaks</h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Track New Habit</span>
        </button>
      </div>

      {/* Habit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 hover:border-emerald-500/30 transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {habit.category}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{habit.title}</h3>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">
                <Flame className="w-4 h-4 fill-current" />
                <span>{habit.streakCount} Day Streak</span>
              </div>
            </div>

            {/* Weekly Days Grid (Mon-Sun) */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 font-medium">This Week Progress</span>
              <div className="grid grid-cols-7 gap-2">
                {daysLabel.map((day, dIdx) => {
                  const active = habit.activeDays[dIdx];
                  return (
                    <button
                      key={dIdx}
                      onClick={() => onToggleHabitDay(habit.id, dIdx)}
                      className={`p-2 rounded-xl text-center border text-xs transition-all ${
                        active
                          ? 'bg-emerald-500 text-gray-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-gray-950 border-white/5 text-gray-500 hover:text-white'
                      }`}
                    >
                      <div className="text-[9px] uppercase">{day}</div>
                      <div className="text-sm font-bold mt-0.5">{active ? '✓' : '•'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
              <span>
                Consistency: <strong className="text-white">{habit.completionPercentage}%</strong>
              </span>
              <span>
                Peak Day: <strong className="text-emerald-400">{habit.bestDay}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* New Habit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-gray-900 border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>Track New Habit</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Habit Title</label>
                <input
                  type="text"
                  placeholder="e.g. Read 20 pages of technical documentation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-950 text-xs text-white rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 bg-gray-950 text-xs text-white rounded-xl border border-white/10"
                >
                  <option value="Health">Health</option>
                  <option value="Coding">Coding</option>
                  <option value="Mindset">Mindset</option>
                  <option value="Sleep">Sleep</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-500/20"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
