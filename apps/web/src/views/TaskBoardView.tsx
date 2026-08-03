import React, { useState } from 'react';
import {
  CheckSquare,
  Kanban,
  List,
  Search,
  Plus,
  Zap,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Filter,
} from 'lucide-react';
import { Task, TaskStatus, ViewType } from '@saarathi/types';

interface TaskBoardViewProps {
  tasks: Task[];
  onToggleTaskComplete: (taskId: string) => void;
  onPostponeTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectView: (view: ViewType) => void;
}

export const TaskBoardView: React.FC<TaskBoardViewProps> = ({
  tasks,
  onToggleTaskComplete,
  onPostponeTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onSelectView,
}) => {
  const [boardLayout, setBoardLayout] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'pending', title: 'Pending / To Do', color: 'border-indigo-500/30 text-indigo-400' },
    { status: 'in_progress', title: 'In Progress', color: 'border-amber-500/30 text-amber-400' },
    { status: 'completed', title: 'Completed', color: 'border-emerald-500/30 text-emerald-400' },
    { status: 'skipped', title: 'Postponed / Skipped', color: 'border-rose-500/30 text-rose-400' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gray-900/80 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Saarathi Kanban & Attribute Matrix</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Task Management Center</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-gray-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-950 border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Coding">Coding</option>
            <option value="College">College</option>
            <option value="Fitness">Fitness</option>
            <option value="Personal">Personal</option>
          </select>

          {/* View Toggle */}
          <div className="flex p-1 bg-gray-950 border border-white/10 rounded-xl text-xs">
            <button
              onClick={() => setBoardLayout('kanban')}
              className={`p-1.5 rounded-lg transition-all ${
                boardLayout === 'kanban' ? 'bg-indigo-600 text-white' : 'text-gray-400'
              }`}
              title="Kanban View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setBoardLayout('list')}
              className={`p-1.5 rounded-lg transition-all ${
                boardLayout === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {boardLayout === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="p-4 rounded-3xl bg-gray-900/60 border border-white/10 flex flex-col h-[600px]"
              >
                <div
                  className={`pb-3 mb-3 border-b flex items-center justify-between ${col.color}`}
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider">{col.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 font-mono">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-gray-950 border border-white/10 hover:border-indigo-500/40 transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-indigo-300">
                          {task.title}
                        </span>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="text-gray-600 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-400 leading-snug">{task.aiSummary}</p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
                          {task.category}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          ⚡ {task.energyRequired}
                        </span>

                        {/* Skip Probability Badge */}
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold border ${
                            task.skipProbability > 70
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                              : task.skipProbability > 30
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {task.skipProbability}% Skip Risk
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-white/5">
                        <span>⏱️ {task.estimatedDuration}m</span>
                        <div className="flex items-center gap-1">
                          {col.status !== 'completed' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'completed')}
                              className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded text-[9px] font-bold"
                            >
                              Done
                            </button>
                          )}
                          {col.status === 'pending' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'in_progress')}
                              className="px-2 py-0.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded text-[9px] font-bold"
                            >
                              Start
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="p-6 rounded-3xl bg-gray-900/80 border border-white/10 space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-2xl bg-gray-950 border border-white/10 hover:border-indigo-500/40 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleTaskComplete(task.id)}
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                    task.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-white/20'
                  }`}
                >
                  {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <div>
                  <div className="font-bold text-xs text-white">{task.title}</div>
                  <div className="text-[11px] text-gray-400">{task.aiSummary}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-mono">
                  {task.estimatedDuration} mins
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    task.skipProbability > 70
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {task.skipProbability}% Risk
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
