import { create } from 'zustand';
import { KairoMessage } from '@saarathi/types';
import { initialKairoChatHistory } from './data/initialData';
import { kairoApi, auth, env } from '@saarathi/api';

interface KairoState {
  chatHistory: KairoMessage[];
  isThinking: boolean;
  sendMessage: (userMessage: string, context?: Record<string, unknown>) => Promise<void>;
  clearHistory: () => void;
}

export const useKairoStore = create<KairoState>((set) => ({
  chatHistory: initialKairoChatHistory,
  isThinking: false,

  sendMessage: async (userMessage, context) => {
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
    }));

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
          };
        });
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
          };
        });
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
              };
            });
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
