import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Plus,
  Filter,
  RotateCcw,
  Play,
  MapPin,
  Check,
} from 'lucide-react';
import { Task, EnergyLevel, ViewType } from '@saarathi/types';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-surface border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span>
              Time-Blocked Schedule •{' '}
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-text">Today's Priority Agenda</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surfaceSecondary p-1 rounded-xl border border-border text-xs">
            <Filter className="w-3.5 h-3.5 text-muted ml-2" />
            <span className="text-muted text-[10px] uppercase font-bold">Energy:</span>
            {['ALL', 'Low', 'Medium', 'High'].map((energy) => (
              <button
                key={energy}
                onClick={() => setSelectedEnergy(energy)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedEnergy === energy
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-textSecondary hover:text-text'
                }`}
              >
                {energy}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-surfaceSecondary p-1 rounded-xl border border-border text-xs">
            <span className="text-muted text-[10px] uppercase font-bold ml-2">Context:</span>
            {['ALL', 'Home', 'College', 'Office', 'Travel'].map((ctx) => (
              <button
                key={ctx}
                onClick={() => setSelectedContext(ctx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedContext === ctx
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-textSecondary hover:text-text'
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
        className="p-3 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center gap-3 shadow-sm"
      >
        <div className="relative flex-1 w-full">
          <Plus className="absolute left-3 top-2.5 w-4 h-4 text-primary" />
          <input
            type="text"
            placeholder="Type a new task for today (e.g., 'Draft System Architecture Diagram')..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surfaceSecondary text-xs text-text placeholder-muted rounded-xl border border-border focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={newEnergy}
            onChange={(e) => setNewEnergy(e.target.value as EnergyLevel)}
            className="bg-surfaceSecondary text-xs text-textSecondary px-3 py-2 rounded-xl border border-border focus:outline-none"
          >
            <option value="Low">Low Energy</option>
            <option value="Medium">Medium Energy</option>
            <option value="High">High Energy</option>
          </select>

          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="bg-surfaceSecondary text-xs text-textSecondary px-3 py-2 rounded-xl border border-border focus:outline-none"
          >
            <option value="Coding">Coding</option>
            <option value="College">College</option>
            <option value="Fitness">Fitness</option>
            <option value="Personal">Personal</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-primary hover:bg-primaryHover text-white text-xs font-semibold rounded-xl shadow-sm shrink-0 transition-all"
          >
            Add Task
          </button>
        </div>
      </form>

      {/* Time-Blocked Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Timeblock Anchor Points */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-surfaceSecondary border border-border space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Kairo Time-Block Anchors</span>
          </h3>

          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-divider">
            {timeSlots.map((slot, index) => (
              <div key={index} className="relative flex items-center gap-3 pl-8 text-xs">
                <div className="absolute left-2 w-3 h-3 rounded-full bg-primary ring-4 ring-surface" />
                <div className="font-mono text-primary font-bold shrink-0 w-16">{slot.time}</div>
                <div className="text-textSecondary text-[11px] font-medium">{slot.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 8 Cols: Filtered Interactive Tasks List */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-textSecondary">
              Scheduled Actions ({filteredTasks.length})
            </span>
            <span className="text-[11px] text-muted">Sorted by Scheduled Window</span>
          </div>

          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-5 rounded-2xl bg-surface border transition-all shadow-sm ${
                  task.status === 'completed'
                    ? 'border-success/20 opacity-75'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleTaskComplete(task.id)}
                      className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-success border-success text-white'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {task.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-bold text-xs ${
                            task.status === 'completed'
                              ? 'line-through text-muted'
                              : 'text-text'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surfaceSecondary border border-border text-textSecondary">
                          {task.category}
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-primary border border-primary/10">
                          ⚡ {task.energyRequired} Energy
                        </span>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surfaceSecondary text-textSecondary flex items-center gap-1 border border-border">
                          <MapPin className="w-2.5 h-2.5" /> {task.context}
                        </span>
                      </div>

                      <p className="text-xs text-textSecondary">{task.aiSummary}</p>

                      {/* Subtasks checklist if present */}
                      {task.subtasks.length > 0 && (
                        <div className="pt-2 space-y-1">
                          {task.subtasks.map((st) => (
                            <div
                              key={st.id}
                              className="flex items-center gap-2 text-[11px] text-textSecondary"
                            >
                              <span
                                className={`w-3 h-3 rounded flex items-center justify-center border text-[8px] ${
                                  st.completed
                                    ? 'bg-success border-success text-white'
                                    : 'border-border'
                                }`}
                              >
                                {st.completed && '✓'}
                              </span>
                              <span className={st.completed ? 'line-through text-muted' : ''}>
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[10px] text-muted pt-2">
                        <span>⏱️ {task.estimatedDuration} mins</span>
                        <span>⏰ Scheduled: {task.scheduledTime || '09:30 AM'}</span>
                        {task.skipProbability > 50 && (
                          <span className="text-warning font-bold">
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
                      className="p-2 bg-surfaceSecondary hover:bg-surfaceHover text-textSecondary hover:text-text rounded-xl border border-border text-xs font-medium transition-colors"
                      title="Postpone Task"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectView('focus')}
                      className="p-2 bg-primary hover:bg-primaryHover text-white rounded-xl shadow-sm text-xs font-medium transition-colors"
                      title="Start Focus Timer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-muted border border-dashed border-border rounded-2xl bg-surface">
              No tasks match the selected energy and context filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
