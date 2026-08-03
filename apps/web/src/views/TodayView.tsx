import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Plus,
  Zap,
  Filter,
  RotateCcw,
  Play,
  ChevronRight,
  Sparkles,
  MapPin,
  Check,
} from 'lucide-react';
import { Task, EnergyLevel, ContextType, ViewType } from '@saarathi/types';

interface TodayViewProps {
  tasks: Task[];
  onToggleTaskComplete: (taskId: string) => void;
  onPostponeTask: (taskId: string) => void;
  onAddTask: (title: string, category: string, energy: EnergyLevel) => void;
  onSelectView: (view: ViewType) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  onToggleTaskComplete,
  onPostponeTask,
  onAddTask,
  onSelectView,
}) => {
  const [selectedEnergy, setSelectedEnergy] = useState<string>('ALL');
  const [selectedContext, setSelectedContext] = useState<string>('ALL');
  const [newTitle, setNewTitle] = useState('');
  const [newEnergy, setNewEnergy] = useState<EnergyLevel>('Medium');
  const [newCategory, setNewCategory] = useState('Coding');

  const filteredTasks = tasks.filter((t) => {
    if (selectedEnergy !== 'ALL' && t.energyRequired !== selectedEnergy) return false;
    if (selectedContext !== 'ALL' && t.context !== selectedContext) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onAddTask(newTitle.trim(), newCategory, newEnergy);
      setNewTitle('');
    }
  };

  const timeSlots = [
    { time: '08:00 AM', label: 'Morning Warmup & Cold Shower' },
    { time: '09:30 AM', label: 'Peak Focus Window Commences' },
    { time: '11:00 AM', label: 'Full-Stack Development' },
    { time: '01:00 PM', label: 'Lunch & Rest Recovery' },
    { time: '02:00 PM', label: 'DSA Practice & Problem Solving' },
    { time: '04:30 PM', label: 'Review & Documentation' },
    { time: '06:00 PM', label: 'Evening Workout / Fitness' },
    { time: '08:30 PM', label: 'Night Wind Down & Reading' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header & Quick Create Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gray-900/80 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>
              Time-Blocked Schedule •{' '}
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Today's Priority Agenda</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400 ml-2" />
            <span className="text-gray-500 text-[10px] uppercase font-bold">Energy:</span>
            {['ALL', 'Low', 'Medium', 'High'].map((energy) => (
              <button
                key={energy}
                onClick={() => setSelectedEnergy(energy)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedEnergy === energy
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {energy}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-white/10 text-xs">
            <span className="text-gray-500 text-[10px] uppercase font-bold ml-2">Context:</span>
            {['ALL', 'Home', 'College', 'Office', 'Travel'].map((ctx) => (
              <button
                key={ctx}
                onClick={() => setSelectedContext(ctx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedContext === ctx
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {ctx}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Add Task Input Form */}
      <form
        onSubmit={handleCreate}
        className="p-3 rounded-2xl bg-gray-900 border border-white/10 flex flex-col sm:flex-row items-center gap-3 shadow-lg"
      >
        <div className="relative flex-1 w-full">
          <Plus className="absolute left-3 top-2.5 w-4 h-4 text-indigo-400" />
          <input
            type="text"
            placeholder="Type a new task for today (e.g., 'Draft System Architecture Diagram')..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-950 text-xs text-white placeholder-gray-500 rounded-xl border border-white/5 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={newEnergy}
            onChange={(e) => setNewEnergy(e.target.value as EnergyLevel)}
            className="bg-gray-950 text-xs text-gray-300 px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
          >
            <option value="Low">Low Energy</option>
            <option value="Medium">Medium Energy</option>
            <option value="High">High Energy</option>
          </select>

          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="bg-gray-950 text-xs text-gray-300 px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
          >
            <option value="Coding">Coding</option>
            <option value="College">College</option>
            <option value="Fitness">Fitness</option>
            <option value="Personal">Personal</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 shrink-0 transition-all"
          >
            Add Task
          </button>
        </div>
      </form>

      {/* Time-Blocked Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Timeblock Anchor Points */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-gray-900/60 border border-white/10 space-y-4">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Kairo Time-Block Anchors</span>
          </h3>

          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
            {timeSlots.map((slot, index) => (
              <div key={index} className="relative flex items-center gap-3 pl-8 text-xs">
                <div className="absolute left-2 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-gray-900" />
                <div className="font-mono text-indigo-400 font-bold shrink-0 w-16">{slot.time}</div>
                <div className="text-gray-300 text-[11px] font-medium">{slot.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 8 Cols: Filtered Interactive Tasks List */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-300">
              Scheduled Actions ({filteredTasks.length})
            </span>
            <span className="text-[11px] text-gray-500">Sorted by Scheduled Window</span>
          </div>

          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-5 rounded-2xl bg-gray-900/80 border transition-all ${
                  task.status === 'completed'
                    ? 'border-emerald-500/20 opacity-75'
                    : 'border-white/10 hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleTaskComplete(task.id)}
                      className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-white/20 hover:border-indigo-400'
                      }`}
                    >
                      {task.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-bold text-xs ${
                            task.status === 'completed'
                              ? 'line-through text-gray-500'
                              : 'text-white'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                          {task.category}
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          ⚡ {task.energyRequired} Energy
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {task.context}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400">{task.aiSummary}</p>

                      {/* Subtasks checklist if present */}
                      {task.subtasks.length > 0 && (
                        <div className="pt-2 space-y-1">
                          {task.subtasks.map((st) => (
                            <div
                              key={st.id}
                              className="flex items-center gap-2 text-[11px] text-gray-400"
                            >
                              <span
                                className={`w-3 h-3 rounded flex items-center justify-center border text-[8px] ${
                                  st.completed
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-white/20'
                                }`}
                              >
                                {st.completed && '✓'}
                              </span>
                              <span className={st.completed ? 'line-through text-gray-600' : ''}>
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[10px] text-gray-500 pt-2">
                        <span>⏱️ {task.estimatedDuration} mins</span>
                        <span>⏰ Scheduled: {task.scheduledTime || '09:30 AM'}</span>
                        {task.skipProbability > 50 && (
                          <span className="text-amber-400 font-bold">
                            ⚠️ {task.skipProbability}% Procrastination Risk
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onPostponeTask(task.id)}
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl border border-white/5 text-xs font-medium transition-colors"
                      title="Postpone Task"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectView('focus')}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-500/20 text-xs font-medium transition-colors"
                      title="Start Focus Timer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-gray-500 border border-dashed border-white/10 rounded-2xl">
              No tasks match the selected energy and context filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
