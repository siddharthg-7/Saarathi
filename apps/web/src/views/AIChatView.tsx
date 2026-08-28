import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Clock,
  AlertTriangle,
  User,
} from 'lucide-react';
import { KairoMessage, KairoSuggestedAction, Task, ViewType, KairoVoicePersona, KAIRO_VOICE_PERSONAS } from '@saarathi/types';
import { useKairoStore, useTaskStore } from '@saarathi/store';
import { MemoryProvenanceBadge } from '../components/memory/MemoryProvenanceBadge';
import { KairoOrb } from '../components/kairo/KairoOrb';
import { Radio, Headphones, CheckCircle2 as CheckIcon } from 'lucide-react';

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
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<KairoSuggestedAction | null>(null);

  const {
    isListening,
    isSpeaking,
    speechSynthesisEnabled,
    liveVoiceActive,
    liveTranscript,
    selectedVoicePersona,
    visualState,
    setListening,
    setSpeaking,
    toggleSpeechSynthesis,
    setVoicePersona,
    startLiveVoice,
    stopLiveVoice,
    bargeIn,
    executeAction,
  } = useKairoStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const presetPrompts = [
    'What should I work on right now?',
    'Give me my morning briefing',
    'Why is my workout predicted at high delay risk?',
    'Reschedule my postponed session with evidence',
    'How do I break down my DBMS revision?',
    "I'm feeling exhausted, what should I do?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isSending]);

  // Speech Synthesis
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis || !speechSynthesisEnabled || liveVoiceActive) return;
      window.speechSynthesis.cancel();

      const cleanSpeech = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[*_#`~]/g, '')
        .replace(/\{[\s\S]*?\}/g, '')
        .trim();

      if (!cleanSpeech) return;

      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [speechSynthesisEnabled, liveVoiceActive, setSpeaking]
  );

  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMsg = chatHistory[chatHistory.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.message && !isSending) {
        speakText(lastMsg.message);
      }
    }
  }, [chatHistory, isSending, speakText]);

  // Toggle Live Voice Streaming Session
  const toggleLiveVoice = async () => {
    if (liveVoiceActive) {
      stopLiveVoice();
    } else {
      await startLiveVoice();
    }
  };

  // Push-to-Talk Speech Recognition & Barge-in handler
  const handleMicClick = () => {
    if (isSpeaking) {
      bargeIn();
      return;
    }

    if (liveVoiceActive) {
      stopLiveVoice();
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toggleLiveVoice();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(undefined, transcript);
        }
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setListening(false);
    }
  };

  const handleSend = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (directText || input).trim();
    if (!textToSend || isSending) return;

    setInput('');
    setIsSending(true);

    try {
      await onSendMessage(textToSend);
    } catch (err) {
      console.error('Error sending message to Kairo:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleActionClick = (act: KairoSuggestedAction) => {
    if (act.actionType === 'DELETE_TASK' && act.requiresConfirmation) {
      setConfirmDeleteAction(act);
      return;
    }

    executeAction(act);

    if (act.actionType === 'START_TASK' || act.actionType === 'START_FOCUS') {
      onSelectView('focus');
    } else if (act.actionType === 'RESCHEDULE' && act.taskId) {
      onPostponeTask(act.taskId);
    } else if (act.actionType === 'COMPLETE_TASK' && act.taskId) {
      useTaskStore.getState().toggleTaskComplete(act.taskId);
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteAction?.taskId) {
      useTaskStore.getState().deleteTask(confirmDeleteAction.taskId);
      setConfirmDeleteAction(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] pb-4 animate-in fade-in duration-200">
      {/* Top Kairo Awareness Banner */}
      <div className="p-4 rounded-3xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <KairoOrb state={visualState} size="sm" showWaveform={true} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-text">Kairo Assistant & Coach</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                {visualState}
              </span>
            </div>
            <p className="text-[11px] text-textSecondary">
              Aware of {tasks.length} tasks, peak focus window (09:30 AM), and habit streak telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gemini Live Voice Mode Toggle */}
          <button
            onClick={toggleLiveVoice}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              liveVoiceActive
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 animate-pulse'
                : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
            }`}
            title={liveVoiceActive ? 'Disconnect Gemini Live Voice' : 'Start Gemini Live Voice Session'}
          >
            <Radio className={`w-4 h-4 ${liveVoiceActive ? 'animate-spin' : ''}`} />
            <span className="font-mono">{liveVoiceActive ? 'Live Streaming' : 'Live Voice'}</span>
          </button>

          {/* Voice Persona Selector */}
          <div className="relative">
            <button
              onClick={() => setShowVoiceMenu(!showVoiceMenu)}
              className="px-3 py-2 text-textSecondary hover:text-text hover:bg-surfaceSecondary rounded-2xl border border-border transition-colors text-xs flex items-center gap-1.5"
              title={`Active Voice Persona: ${selectedVoicePersona}`}
            >
              <Headphones className="w-4 h-4 text-primary" />
              <span className="font-medium hidden sm:inline">{selectedVoicePersona}</span>
            </button>

            {showVoiceMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-surface border border-border rounded-2xl shadow-xl p-2 z-50 space-y-1">
                <div className="text-[10px] font-bold text-muted px-2 py-1 uppercase tracking-wider">
                  Gemini Voice Persona
                </div>
                {KAIRO_VOICE_PERSONAS.map((vp) => (
                  <button
                    key={vp.id}
                    onClick={() => {
                      setVoicePersona(vp.id);
                      setShowVoiceMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      selectedVoicePersona === vp.id
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-text hover:bg-surfaceSecondary'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{vp.name}</div>
                      <div className="text-[10px] text-textSecondary">{vp.description}</div>
                    </div>
                    {selectedVoicePersona === vp.id && <CheckIcon className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleSpeechSynthesis}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
              speechSynthesisEnabled
                ? 'bg-primary/15 border-primary/20 text-primary'
                : 'bg-surfaceSecondary border-border text-textSecondary hover:text-text'
            }`}
          >
            {speechSynthesisEnabled ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className="hidden md:inline">{speechSynthesisEnabled ? 'Voice Responses ON' : 'Mute Voice'}</span>
          </button>
        </div>
      </div>

      {/* Live Streaming Subtitle Banner */}
      {liveVoiceActive && (
        <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary/15 via-rose-500/10 to-indigo-500/15 border border-primary/20 flex items-center justify-between gap-3 text-xs mb-3 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="text-xs text-text font-medium truncate">
              {liveTranscript || `🎙️ Live with ${selectedVoicePersona}. Speak naturally in any language (English, Spanish, Hindi, etc.).`}
            </span>
          </div>
          {isSpeaking && (
            <button
              onClick={bargeIn}
              className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
              title="Interrupt AI speaking"
            >
              Barge In
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 rounded-3xl bg-surfaceSecondary/40 border border-border space-y-4 mb-4 shadow-inner">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-border text-primary'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <KairoOrb state={visualState} size="sm" showWaveform={false} />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-xl p-4 rounded-3xl text-xs leading-relaxed space-y-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-surface border border-border text-text rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-line">{msg.message}</p>

              {/* Action Buttons */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2 border-t border-divider">
                  {msg.suggestedActions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleActionClick(act)}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/15 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                    >
                      {act.actionType === 'START_TASK' && <Play className="w-3 h-3" />}
                      {act.actionType === 'COMPLETE_TASK' && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      )}
                      {act.actionType === 'DELETE_TASK' && (
                        <Trash2 className="w-3 h-3 text-rose-500" />
                      )}
                      {act.actionType === 'RESCHEDULE' && <RotateCcw className="w-3 h-3" />}
                      {act.actionType === 'CREATE_REMINDER' && <Clock className="w-3 h-3" />}
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Long-Term Memory Provenance Badges */}
              {msg.role === 'assistant' &&
                msg.retrievedMemories &&
                msg.retrievedMemories.length > 0 && (
                  <div className="pt-2 border-t border-divider space-y-1.5">
                    <div className="text-[10px] font-semibold text-textSecondary uppercase tracking-wider">
                      Retrieved Context:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.retrievedMemories.map((mem, idx) => (
                        <MemoryProvenanceBadge key={idx} memory={mem} />
                      ))}
                    </div>
                  </div>
                )}

              <div className="text-[10px] text-muted text-right font-mono">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary shadow-sm">
              <Sparkles className="w-4 h-4 animate-spin text-primary" />
            </div>
            <div className="p-3.5 bg-surface border border-border rounded-3xl rounded-tl-none text-xs text-textSecondary flex items-center gap-2 shadow-sm">
              <KairoOrb state="THINKING" size="sm" showWaveform={false} />
              <span>Kairo is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Prompts & Input Area */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {presetPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(prompt);
              }}
              className="px-3.5 py-1.5 bg-surface hover:bg-surfaceSecondary text-textSecondary hover:text-text border border-border rounded-2xl text-[11px] whitespace-nowrap transition-colors shadow-sm"
            >
              ✨ {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          {/* Push-to-Talk / Barge-in Button */}
          <button
            type="button"
            onClick={handleMicClick}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center shrink-0 ${
              isSpeaking
                ? 'bg-amber-500 text-white border-amber-600 animate-bounce'
                : isListening || liveVoiceActive
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse ring-4 ring-rose-500/20'
                : 'bg-surface border-border text-textSecondary hover:text-primary hover:border-primary/30 shadow-sm'
            }`}
            title={
              isSpeaking
                ? 'AI is speaking (Tap to Barge-in)'
                : liveVoiceActive
                ? 'Live Voice Active (Tap to disconnect)'
                : isListening
                ? 'Stop listening'
                : 'Push to talk with Kairo'
            }
          >
            {isSpeaking ? (
              <MicOff className="w-4 h-4" />
            ) : isListening || liveVoiceActive ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </button>

          <input
            type="text"
            placeholder={
              isListening
                ? 'Listening to voice...'
                : 'Ask Kairo about tasks, energy windows, or scheduling...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            className="flex-1 px-4 py-3.5 bg-surface border border-border rounded-2xl text-xs text-text placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
          />

          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-3.5 bg-primary hover:bg-primaryHover disabled:opacity-50 text-white rounded-2xl shadow-sm transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Confirmation Safety Dialog */}
      {confirmDeleteAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-sm text-text">Confirm Delete</h4>
              <p className="text-xs text-textSecondary">
                Are you sure you want Kairo to permanently delete this task?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteAction(null)}
                className="flex-1 py-2.5 bg-surfaceSecondary hover:bg-surface border border-border rounded-xl text-xs font-semibold text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
