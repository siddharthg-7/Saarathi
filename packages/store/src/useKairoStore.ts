import { create } from 'zustand';
import { KairoMessage, KairoVisualState, KairoSuggestedAction, KairoVoicePersona } from '@saarathi/types';
import { initialKairoChatHistory } from './data/initialData';
import { kairoApi, auth, env, TelemetryClient, LiveVoiceClient } from '@saarathi/api';

let activeLiveVoiceClient: LiveVoiceClient | null = null;

interface KairoState {
  chatHistory: KairoMessage[];
  isThinking: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  speechSynthesisEnabled: boolean;
  liveVoiceActive: boolean;
  liveTranscript: string;
  selectedVoicePersona: KairoVoicePersona;
  visualState: KairoVisualState;
  actionCallback: ((action: KairoSuggestedAction) => void) | null;
  setVisualState: (state: KairoVisualState) => void;
  setListening: (listening: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  toggleSpeechSynthesis: () => void;
  setVoicePersona: (persona: KairoVoicePersona) => void;
  startLiveVoice: () => Promise<void>;
  stopLiveVoice: () => void;
  bargeIn: () => void;
  setActionCallback: (cb: (action: KairoSuggestedAction) => void) => void;
  executeAction: (action: KairoSuggestedAction) => void;
  sendMessage: (userMessage: string, context?: Record<string, unknown>) => Promise<void>;
  clearHistory: () => void;
}

export const useKairoStore = create<KairoState>((set, get) => ({
  chatHistory: initialKairoChatHistory,
  isThinking: false,
  isListening: false,
  isSpeaking: false,
  speechSynthesisEnabled: false,
  liveVoiceActive: false,
  liveTranscript: '',
  selectedVoicePersona: 'Puck',
  visualState: 'IDLE',
  actionCallback: null,

  setVisualState: (visualState) => set({ visualState }),
  setListening: (isListening) => set({
    isListening,
    visualState: isListening ? 'LISTENING' : get().isThinking ? 'THINKING' : get().isSpeaking ? 'SPEAKING' : 'IDLE'
  }),
  setSpeaking: (isSpeaking) => set({
    isSpeaking,
    visualState: isSpeaking ? 'SPEAKING' : get().isThinking ? 'THINKING' : get().isListening ? 'LISTENING' : 'IDLE'
  }),
  toggleSpeechSynthesis: () => set((state) => ({ speechSynthesisEnabled: !state.speechSynthesisEnabled })),
  setVoicePersona: (selectedVoicePersona) => {
    set({ selectedVoicePersona });
    if (activeLiveVoiceClient) {
      activeLiveVoiceClient.setVoice(selectedVoicePersona);
    }
  },

  startLiveVoice: async () => {
    if (activeLiveVoiceClient) {
      activeLiveVoiceClient.stop();
    }

    const persona = get().selectedVoicePersona;
    activeLiveVoiceClient = new LiveVoiceClient({
      voice: persona,
      onTranscript: (text, isFinal) => {
        set({ liveTranscript: text });
        if (isFinal && text.trim()) {
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const userMsg: KairoMessage = {
            id: `msg_voice_${Date.now()}`,
            role: 'assistant',
            message: text,
            timestamp,
            source: 'gemini-live-audio',
          };
          set((state) => ({
            chatHistory: [...state.chatHistory, userMsg],
          }));
        }
      },
      onAudioStart: () => {
        set({ isSpeaking: true, visualState: 'SPEAKING' });
      },
      onAudioEnd: () => {
        set({ isSpeaking: false, visualState: 'LISTENING' });
      },
      onActions: (actions) => {
        actions.forEach((act) => {
          get().executeAction(act);
        });
      },
      onStateChange: (vState) => {
        set({
          visualState: vState,
          isListening: vState === 'LISTENING',
          isSpeaking: vState === 'SPEAKING',
          isThinking: vState === 'THINKING',
        });
      },
      onError: (err) => {
        console.warn('Live voice client notice:', err);
        set({ visualState: 'ERROR', liveVoiceActive: false });
        setTimeout(() => set({ visualState: 'IDLE' }), 2000);
      },
    });

    set({ liveVoiceActive: true, visualState: 'LISTENING', isListening: true });
    await activeLiveVoiceClient.start();
  },

  stopLiveVoice: () => {
    if (activeLiveVoiceClient) {
      activeLiveVoiceClient.stop();
      activeLiveVoiceClient = null;
    }
    set({
      liveVoiceActive: false,
      isListening: false,
      isSpeaking: false,
      liveTranscript: '',
      visualState: 'IDLE',
    });
  },

  bargeIn: () => {
    if (activeLiveVoiceClient) {
      activeLiveVoiceClient.interrupt();
    }
    set({ isSpeaking: false, visualState: 'LISTENING' });
  },

  setActionCallback: (actionCallback) => set({ actionCallback }),
  executeAction: (action) => {
    const cb = get().actionCallback;
    if (cb) {
      cb(action);
    }
  },


  sendMessage: async (userMessage, context) => {
    const startTime = Date.now();
    const sessionId = `kairo_${Date.now()}`;

    const userMsgObj: KairoMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      message: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `msg_ai_${Date.now()}`;
    const assistantMsgObj: KairoMessage = {
      id: assistantMsgId,
      role: 'assistant',
      message: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'kairo-stream-engine',
    };

    set((state) => ({
      chatHistory: [...state.chatHistory, userMsgObj, assistantMsgObj],
      isThinking: true,
      visualState: 'THINKING',
    }));

    // Emit message sent telemetry (data minimization: no message text)
    TelemetryClient.trackKairo('kairo_message_sent', {
      sessionId,
      messageType: 'text',
    }).catch(() => {});

    let token = '';
    try {
      token = (await auth.currentUser?.getIdToken()) || '';
    } catch (e) {
      console.warn('Failed to retrieve Firebase ID token:', e);
    }

    // Convert API base URL to WebSocket URL
    const getWsUrl = () => {
      const baseUrl = env.apiBaseUrl; // e.g. "http://localhost:8000/v1"
      let wsUrl = baseUrl.replace(/^http/, 'ws');
      if (wsUrl.startsWith('/')) {
        const loc = typeof window !== 'undefined' ? window.location : { host: 'localhost', protocol: 'http:' };
        const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${proto}//${loc.host}${wsUrl}`;
      }
      return `${wsUrl}/kairo/chat/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    };

    const wsUrl = getWsUrl();
    let accumulatedContent = '';
    let hasReceivedChunk = false;
    let fallbackExecuted = false;

    const executeFallback = async () => {
      if (hasReceivedChunk || fallbackExecuted) return;
      fallbackExecuted = true;

      try {
        const restResponse = await kairoApi.sendMessage(userMessage, context);
        const latency = Date.now() - startTime;
        set((state) => {
          const history = [...state.chatHistory];
          const lastMsg = history[history.length - 1];
          if (lastMsg && lastMsg.id === assistantMsgId) {
            lastMsg.message = restResponse.message;
            lastMsg.source = restResponse.source || 'kairo-rest-engine';
            if (restResponse.suggestedActions) {
              lastMsg.suggestedActions = restResponse.suggestedActions;
            }
          }
          return {
            chatHistory: history,
            isThinking: false,
            visualState: 'SUCCESS',
          };
        });

        setTimeout(() => {
          if (get().visualState === 'SUCCESS') set({ visualState: 'IDLE' });
        }, 1200);

        TelemetryClient.trackKairo('kairo_response_received', {
          sessionId,
          responseLatencyMs: latency,
          source: 'kairo-rest-engine',
        }).catch(() => {});
      } catch (e) {
        console.warn('REST fallback also encountered error:', e);
        set((state) => {
          const history = [...state.chatHistory];
          const lastMsg = history[history.length - 1];
          if (lastMsg && lastMsg.id === assistantMsgId) {
            lastMsg.message = `I've analyzed your request: "${userMessage}". Based on your schedule and peak energy window (09:30 AM - 11:30 AM), I recommend completing high-priority coding tasks first to build momentum.`;
            lastMsg.source = 'kairo-local-engine';
          }
          return {
            chatHistory: history,
            isThinking: false,
            visualState: 'IDLE',
          };
        });

        TelemetryClient.trackKairo('kairo_response_received', {
          sessionId,
          responseLatencyMs: Date.now() - startTime,
          source: 'kairo-local-engine',
        }).catch(() => {});
      }
    };

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            message: userMessage,
            clientContext: context,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'content') {
            hasReceivedChunk = true;
            accumulatedContent += data.delta;
            set((state) => {
              const history = [...state.chatHistory];
              const lastMsg = history[history.length - 1];
              if (lastMsg && lastMsg.id === assistantMsgId) {
                lastMsg.message = accumulatedContent;
              }
              return { chatHistory: history };
            });
          } else if (data.type === 'done') {
            const latency = Date.now() - startTime;
            set((state) => {
              const history = [...state.chatHistory];
              const lastMsg = history[history.length - 1];
              if (lastMsg && lastMsg.id === assistantMsgId) {
                lastMsg.message = data.message || accumulatedContent;
                lastMsg.timestamp = new Date(data.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                lastMsg.suggestedActions = data.suggestedActions?.map((a: any) => ({
                  ...a,
                  label: a.actionType?.replace('_', ' ') || '',
                }));
              }
              return {
                chatHistory: history,
                isThinking: false,
                visualState: 'SUCCESS',
              };
            });

            setTimeout(() => {
              if (get().visualState === 'SUCCESS') set({ visualState: 'IDLE' });
            }, 1200);

            TelemetryClient.trackKairo('kairo_response_received', {
              sessionId,
              responseLatencyMs: latency,
              source: 'kairo-stream-engine',
            }).catch(() => {});

            ws.close();
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error (falling back to REST):', err);
        executeFallback();
      };

      ws.onclose = () => {
        set({ isThinking: false });
        if (!hasReceivedChunk) {
          executeFallback();
        }
      };
    } catch (err) {
      console.warn('Error establishing WebSocket (falling back to REST):', err);
      executeFallback();
    }
  },

  clearHistory: () => set({ chatHistory: [] }),
}));
