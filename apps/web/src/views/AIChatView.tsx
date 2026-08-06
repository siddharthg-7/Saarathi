import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  User,
} from 'lucide-react';
import { KairoMessage, Task, ViewType } from '@saarathi/types';

interface AIChatViewProps {
  tasks: Task[];
  chatHistory: KairoMessage[];
  onSendMessage: (msg: string) => Promise<void>;
  onSelectView: (view: ViewType) => void;
  onPostponeTask: (taskId: string) => void;
}

export const AIChatView: React.FC<AIChatViewProps> = ({
  tasks,
  chatHistory,
  onSendMessage,
  onSelectView,
  onPostponeTask,
}) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetPrompts = [
    'What should I work on right now?',
    'Reschedule my postponed workout session',
    'How do I break down my DBMS revision?',
    'Summarize my focus metrics for today',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isSending]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;

    const userText = input.trim();
    setInput('');
    setIsSending(true);

    try {
      await onSendMessage(userText);
    } catch (err) {
      console.error('Error sending message to Kairo:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] pb-4 animate-in fade-in duration-200">
      {/* Top Kairo Awareness Banner */}
      <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-xs text-text">Kairo Productivity Assistant</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/15 font-medium">
                Active Context
              </span>
            </div>
            <p className="text-[11px] text-textSecondary">
              Aware of {tasks.length} tasks, peak focus window (09:30 AM), and 14-day habit streak.
            </p>
          </div>
        </div>

        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
            audioEnabled
              ? 'bg-primary/15 border-primary/20 text-primary'
              : 'bg-surfaceSecondary border-border text-textSecondary hover:text-text'
          }`}
        >
          {audioEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-primary" />
          ) : (
            <VolumeX className="w-3.5 h-3.5" />
          )}
          <span>{audioEnabled ? 'Voice Responses ON' : 'Mute Voice'}</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 rounded-3xl bg-[#F8FAFC] border border-border space-y-4 mb-4 shadow-sm">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-border text-primary'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none shadow-sm'
                  : 'bg-surface border border-border text-text rounded-tl-none shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line">{msg.message}</p>

              {/* Action Buttons if Kairo returned suggested actions */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2 border-t border-divider">
                  {msg.suggestedActions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (act.actionType === 'START_TASK') onSelectView('focus');
                        if (act.actionType === 'RESCHEDULE' && act.taskId)
                          onPostponeTask(act.taskId);
                      }}
                      className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                    >
                      {act.actionType === 'START_TASK' && <Play className="w-3 h-3" />}
                      {act.actionType === 'RESCHEDULE' && <RotateCcw className="w-3 h-3" />}
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-muted text-right font-mono">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-primary shadow-sm">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-3 bg-surface border border-border rounded-2xl rounded-tl-none text-xs text-textSecondary flex items-center gap-2 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
              <span>Kairo is analyzing schedule and synthesizing response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Prompts & Input Area */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {presetPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(prompt);
              }}
              className="px-3 py-1.5 bg-surface hover:bg-surfaceSecondary text-textSecondary hover:text-text border border-border rounded-xl text-[11px] whitespace-nowrap transition-colors shadow-sm"
            >
              ✨ {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask Kairo about tasks, energy windows, or scheduling..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            className="w-full pl-4 pr-12 py-3 bg-surface border border-border rounded-2xl text-xs text-text placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="absolute right-2 p-2 bg-primary hover:bg-primaryHover disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
