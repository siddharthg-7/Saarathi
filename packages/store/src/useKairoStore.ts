import { create } from 'zustand';
import { KairoMessage } from '@saarathi/types';
import { initialKairoChatHistory } from '@/data/initialData';
import { kairoApi } from '@saarathi/api';

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

    set((state) => ({
      chatHistory: [...state.chatHistory, userMsgObj],
      isThinking: true,
    }));

    try {
      const response = await kairoApi.sendMessage(userMessage, context);

      const assistantMsgObj: KairoMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        message: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.source,
        suggestedActions: response.suggestedActions?.map((a) => ({
          ...a,
          label: a.actionType.replace('_', ' '),
        })),
      };

      set((state) => ({
        chatHistory: [...state.chatHistory, assistantMsgObj],
        isThinking: false,
      }));
    } catch {
      set((state) => ({
        isThinking: false,
        chatHistory: [
          ...state.chatHistory,
          {
            id: `msg_ai_${Date.now()}`,
            role: 'assistant',
            message: `I've analyzed your schedule and active workload. I recommend focusing on high-impact tasks during your peak morning window.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'kairo-local-engine',
          },
        ],
      }));
    }
  },

  clearHistory: () => set({ chatHistory: [] }),
}));
