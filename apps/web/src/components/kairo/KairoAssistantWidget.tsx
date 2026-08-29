import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Clock,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { KairoSuggestedAction, Task, ViewType, KairoVoicePersona, KAIRO_VOICE_PERSONAS } from '@saarathi/types';
import { useKairoStore, useTaskStore } from '@saarathi/store';
import { MemoryProvenanceBadge } from '../memory/MemoryProvenanceBadge';
import { KairoOrb } from './KairoOrb';
import { Radio, Headphones } from 'lucide-react';

interface KairoAssistantWidgetProps {
  tasks: Task[];
  onSelectView?: (view: ViewType) => void;
  onPostponeTask?: (taskId: string) => void;
}

export const KairoAssistantWidget: React.FC<KairoAssistantWidgetProps> = ({
  tasks,
  onSelectView,
  onPostponeTask,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<KairoSuggestedAction | null>(null);
  const [voiceCategory, setVoiceCategory] = useState<string>('all');
  const [voiceSearch, setVoiceSearch] = useState('');

  const filteredVoices = KAIRO_VOICE_PERSONAS.filter((v) => {
    const matchesCategory = voiceCategory === 'all' || v.category === voiceCategory;
    const matchesSearch =
      !voiceSearch ||
      v.name.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      v.description.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      v.tone.toLowerCase().includes(voiceSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const {
    chatHistory,
    isThinking,
    isListening,
    isSpeaking,
    speechSynthesisEnabled,
    liveVoiceActive,
    liveTranscript,
    selectedVoicePersona,
    visualState,
    sendMessage,
    clearHistory,
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

  const quickChips = [
    'What should I work on now?',
    'Give me my morning briefing',
    "I'm feeling exhausted",
    'Summarize my productivity',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isThinking, isOpen]);

  // Speech Synthesis: speak assistant messages when speech synthesis is enabled
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !speechSynthesisEnabled || liveVoiceActive) return;
    window.speechSynthesis.cancel();

    // Clean markdown/json formatting from speech text
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
  }, [speechSynthesisEnabled, liveVoiceActive, setSpeaking]);

  // Trigger speech on new assistant message if voice responses are enabled
  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMsg = chatHistory[chatHistory.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.message && !isThinking) {
        speakText(lastMsg.message);
      }
    }
  }, [chatHistory, isThinking, speakText]);

  // Toggle Gemini Live Voice Bidirectional Streaming Session
  const toggleLiveVoice = async () => {
    if (liveVoiceActive) {
      stopLiveVoice();
    } else {
      await startLiveVoice();
    }
  };

  // Push-to-Talk Speech Recognition / Barge-in
  const handleMicClick = () => {
    if (isSpeaking) {
      // Barge-in: interrupt AI speech immediately
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
          handleSendText(transcript);
        }
      };
      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setListening(false);
      };
      recognition.onend = () => setListening(false);

      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setListening(false);
    }
  };

  const handleSendText = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isThinking) return;

    setInput('');
    try {
      await sendMessage(text, {
        tasksCount: tasks.length,
        pendingTasks: tasks.filter((t) => t.status !== 'completed').map((t) => t.title),
      });
    } catch (err) {
      console.error('Error sending message to Kairo:', err);
    }
  };

  const handleActionClick = (action: KairoSuggestedAction) => {
    if (action.actionType === 'DELETE_TASK' && action.requiresConfirmation) {
      setConfirmDeleteAction(action);
      return;
    }

    // Execute standard actions
    executeAction(action);

    if (action.actionType === 'START_TASK' || action.actionType === 'START_FOCUS') {
      if (onSelectView) onSelectView('focus');
    } else if (action.actionType === 'RESCHEDULE' && action.taskId) {
      if (onPostponeTask) onPostponeTask(action.taskId);
    } else if (action.actionType === 'COMPLETE_TASK' && action.taskId) {
      useTaskStore.getState().toggleTaskComplete(action.taskId);
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteAction && confirmDeleteAction.taskId) {
      useTaskStore.getState().deleteTask(confirmDeleteAction.taskId);
      setConfirmDeleteAction(null);
    }
  };

  return (
    <>
      {/* Floating Kairo Trigger Button in Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-surface/90 border border-border backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg text-xs font-semibold text-text flex items-center gap-2 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setIsOpen(true)}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Ask Kairo</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-surface border-2 border-primary/30 shadow-2xl flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Open Kairo AI Assistant"
        >
          <KairoOrb state={visualState} size="sm" showWaveform={true} />
        </motion.button>
      </div>

      {/* Floating Assistant Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-50 bg-surface/95 backdrop-blur-xl border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded
                ? 'bottom-4 right-4 left-4 top-4 md:left-auto md:w-[680px] md:h-[calc(100vh-2rem)]'
                : 'bottom-24 right-6 w-[92vw] sm:w-[420px] h-[580px] max-h-[80vh]'
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-surfaceSecondary/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <KairoOrb state={visualState} size="sm" showWaveform={false} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-text">Kairo Assistant</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                      {visualState}
                    </span>
                  </div>
                  <p className="text-[11px] text-textSecondary">
                    Voice & text companion for Saarathi OS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Gemini Live Voice Mode Toggle */}
                <button
                  onClick={toggleLiveVoice}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    liveVoiceActive
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 animate-pulse'
                      : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                  }`}
                  title={liveVoiceActive ? 'Disconnect Gemini Live Voice' : 'Start Gemini Live Voice Session'}
                >
                  <Radio className={`w-3.5 h-3.5 ${liveVoiceActive ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline font-mono">{liveVoiceActive ? 'Live' : 'Live Voice'}</span>
                </button>

                {/* Voice Persona Dropdown Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                    className="p-2 text-textSecondary hover:text-text hover:bg-surface rounded-xl border border-border transition-colors text-xs flex items-center gap-1"
                    title={`Active Voice: ${selectedVoicePersona}`}
                  >
                    <Headphones className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-medium hidden md:inline">{selectedVoicePersona}</span>
                  </button>

                  {showVoiceMenu && (
                    <div className="absolute right-0 mt-2 w-72 max-h-96 bg-surface border border-border rounded-2xl shadow-2xl p-3 z-50 flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                          <Headphones className="w-3.5 h-3.5 text-primary" />
                          <span>Gemini HD Voices ({KAIRO_VOICE_PERSONAS.length})</span>
                        </div>
                        <button
                          onClick={() => setShowVoiceMenu(false)}
                          className="text-textSecondary hover:text-text p-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Search Bar */}
                      <input
                        type="text"
                        placeholder="Search 2026 HD voices..."
                        value={voiceSearch}
                        onChange={(e) => setVoiceSearch(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-surfaceSecondary border border-border rounded-lg text-text focus:outline-none focus:border-primary"
                      />

                      {/* Category Chips */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
                        {['all', 'popular', 'calm', 'energetic', 'deep', 'celestial'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setVoiceCategory(cat)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize shrink-0 transition-colors ${
                              voiceCategory === cat
                                ? 'bg-primary text-white font-semibold'
                                : 'bg-surfaceSecondary text-textSecondary hover:text-text border border-border'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Voice List */}
                      <div className="overflow-y-auto max-h-56 space-y-1 pr-1">
                        {filteredVoices.map((vp) => (
                          <button
                            key={vp.id}
                            onClick={() => {
                              setVoicePersona(vp.id);
                              setShowVoiceMenu(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              selectedVoicePersona === vp.id
                                ? 'bg-primary/15 text-primary font-semibold border border-primary/20'
                                : 'text-text hover:bg-surfaceSecondary'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[11px]">{vp.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-surfaceSecondary text-textSecondary border border-border font-mono">
                                  {vp.gender}
                                </span>
                              </div>
                              <div className="text-[10px] text-textSecondary truncate">{vp.description}</div>
                            </div>
                            {selectedVoicePersona === vp.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Voice Output Toggle */}
                <button
                  onClick={toggleSpeechSynthesis}
                  className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                    speechSynthesisEnabled
                      ? 'bg-primary/15 text-primary border border-primary/20'
                      : 'text-textSecondary hover:text-text hover:bg-surface'
                  }`}
                  title={speechSynthesisEnabled ? 'Voice Responses ON' : 'Voice Responses OFF'}
                >
                  {speechSynthesisEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>

                {/* Clear Chat */}
                <button
                  onClick={clearHistory}
                  className="p-2 text-textSecondary hover:text-text hover:bg-surface rounded-xl transition-colors"
                  title="Clear conversation"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Expand / Minimize */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden sm:block p-2 text-textSecondary hover:text-text hover:bg-surface rounded-xl transition-colors"
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                {/* Close Drawer */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-textSecondary hover:text-text hover:bg-surface rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Streaming Subtitle Banner */}
            {liveVoiceActive && (
              <div className="px-4 py-2 bg-gradient-to-r from-primary/15 via-rose-500/10 to-indigo-500/15 border-b border-primary/20 flex items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="text-[11px] text-text font-medium truncate">
                    {liveTranscript || `🎙️ Live with ${selectedVoicePersona}. Speak naturally in any language...`}
                  </span>
                </div>
                {isSpeaking && (
                  <button
                    onClick={bargeIn}
                    className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white text-[10px] font-bold shrink-0 transition-colors"
                    title="Interrupt AI speaking"
                  >
                    Barge In
                  </button>
                )}
              </div>
            )}

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2.5 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-surface border border-border text-text rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.message}</p>

                    {/* Action buttons */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5 border-t border-divider">
                        {msg.suggestedActions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => handleActionClick(act)}
                            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/15 rounded-xl text-[10px] font-semibold flex items-center gap-1 transition-all"
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

                    {/* Long-term memory badge context */}
                    {msg.role === 'assistant' &&
                      msg.retrievedMemories &&
                      msg.retrievedMemories.length > 0 && (
                        <div className="pt-1.5 border-t border-divider flex flex-wrap gap-1">
                          {msg.retrievedMemories.map((mem, idx) => (
                            <MemoryProvenanceBadge key={idx} memory={mem} />
                          ))}
                        </div>
                      )}

                    <div className="text-[9px] text-muted text-right font-mono">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-xs text-textSecondary bg-surface p-3 rounded-2xl border border-border w-fit shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span>Kairo is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 pt-2 pb-1 bg-surface border-t border-border flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
              {quickChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendText(chip)}
                  disabled={isThinking}
                  className="px-2.5 py-1 bg-surfaceSecondary hover:bg-primary/10 hover:text-primary text-textSecondary text-[10px] rounded-lg border border-border whitespace-nowrap transition-colors"
                >
                  ✨ {chip}
                </button>
              ))}
            </div>

            {/* Input Footer & Push-to-Talk */}
            <div className="p-3 bg-surface border-t border-border flex items-center gap-2 shrink-0">
              {/* Push-to-Talk / Barge-in Mic Button */}
              <button
                type="button"
                onClick={handleMicClick}
                className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center shrink-0 ${
                  isSpeaking
                    ? 'bg-amber-500 text-white border-amber-600 animate-bounce'
                    : isListening || liveVoiceActive
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse ring-4 ring-rose-500/20'
                    : 'bg-surfaceSecondary border-border text-textSecondary hover:text-primary hover:border-primary/30'
                }`}
                title={
                  isSpeaking
                    ? 'AI is speaking (Tap to Barge-in)'
                    : liveVoiceActive
                    ? 'Live Voice Active (Tap to disconnect)'
                    : isListening
                    ? 'Listening... (Tap to stop)'
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

              {/* Text Input */}
              <input
                type="text"
                placeholder={isListening ? 'Listening...' : 'Message Kairo...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText();
                  }
                }}
                disabled={isThinking}
                className="flex-1 bg-surfaceSecondary border border-border rounded-2xl px-3.5 py-2.5 text-xs text-text placeholder:text-muted focus:outline-none focus:border-primary"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendText()}
                disabled={!input.trim() || isThinking}
                className="p-2.5 bg-primary hover:bg-primaryHover disabled:opacity-40 text-white rounded-2xl shadow-sm transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Safety Dialog */}
      <AnimatePresence>
        {confirmDeleteAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-text">Confirm Action</h4>
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
