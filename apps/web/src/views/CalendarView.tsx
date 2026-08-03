import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Task } from '@saarathi/types';

interface CalendarViewProps {
  tasks: Task[];
  onAddTask: (title: string, category: string, energy: 'Low' | 'Medium' | 'High') => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onAddTask }) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [showAddModal, setShowAddModal] = useState(false);
  const [blockTitle, setBlockTitle] = useState('');
  const [blockCategory, setBlockCategory] = useState('Coding');
  const [blockEnergy, setBlockEnergy] = useState<'Low' | 'Medium' | 'High'>('High');

  const daysOfWeek = ['Mon 3', 'Tue 4', 'Wed 5', 'Thu 6', 'Fri 7', 'Sat 8', 'Sun 9'];
  const hours = [
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM',
    '08:00 PM',
  ];

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (blockTitle.trim()) {
      onAddTask(blockTitle.trim(), blockCategory, blockEnergy);
      setBlockTitle('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gray-900/80 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Kairo Smart Calendar & Buffer Blocks</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">August 2026</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Day / Week Switcher */}
          <div className="flex p-1 bg-gray-950 border border-white/10 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'
              }`}
            >
              Week
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Time-block Event</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gray-900/80 border border-white/10 overflow-x-auto shadow-2xl">
        {/* Days Header */}
        <div className="grid grid-cols-8 gap-2 min-w-[700px] border-b border-white/10 pb-4 mb-4 text-xs font-bold text-gray-300">
          <div className="text-gray-500 font-mono">Time</div>
          {daysOfWeek.map((day, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl text-center ${
                idx === 0
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                  : 'bg-gray-950/60'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Hour Rows */}
        <div className="space-y-2 min-w-[700px]">
          {hours.map((hour, hIdx) => (
            <div key={hIdx} className="grid grid-cols-8 gap-2 items-center text-xs">
              <div className="font-mono text-gray-500 text-[11px] shrink-0">{hour}</div>

              {daysOfWeek.map((day, dIdx) => {
                // Match task to hour slot if available
                const matchedTask = tasks[hIdx % tasks.length];
                const isPeakSlot = hIdx >= 1 && hIdx <= 3 && dIdx === 0; // Mon 9:30-11:30 AM

                return (
                  <div
                    key={dIdx}
                    className={`h-14 p-1.5 rounded-xl border transition-all text-[10px] overflow-hidden flex flex-col justify-between ${
                      isPeakSlot
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200'
                        : matchedTask && dIdx === 0
                          ? 'bg-gray-950 border-white/10 text-gray-300 hover:border-indigo-500/30'
                          : 'bg-gray-950/30 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {isPeakSlot && (
                      <div className="flex items-center gap-1 text-[9px] text-indigo-400 font-bold">
                        <Sparkles className="w-3 h-3" /> Peak Focus
                      </div>
                    )}
                    {dIdx === 0 && matchedTask ? (
                      <div>
                        <div className="font-semibold truncate text-white">{matchedTask.title}</div>
                        <div className="text-[9px] text-gray-400">
                          {matchedTask.estimatedDuration}m
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-700 font-mono text-[9px]">+ Add</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Add Time Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <span>Create Calendar Time Block</span>
            </h3>

            <form onSubmit={handleCreateBlock} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. System Architecture Design Session"
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-950 text-xs text-white rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={blockCategory}
                    onChange={(e) => setBlockCategory(e.target.value)}
                    className="w-full p-2.5 bg-gray-950 text-xs text-white rounded-xl border border-white/10"
                  >
                    <option value="Coding">Coding</option>
                    <option value="College">College</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Energy Required
                  </label>
                  <select
                    value={blockEnergy}
                    onChange={(e) => setBlockEnergy(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-950 text-xs text-white rounded-xl border border-white/10"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20"
                >
                  Save Time Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
