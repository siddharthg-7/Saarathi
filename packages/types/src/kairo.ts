import { HybridSearchResult } from './memory';

export interface KairoMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
  source?: string;
  retrievedMemories?: HybridSearchResult[];
  suggestedActions?: {
    actionType: 'START_TASK' | 'RESCHEDULE' | 'BREAK_DOWN' | string;
    taskId?: string;
    label: string;
  }[];
}

export interface FocusSession {
  timeRemaining: number;
  totalDuration: number;
  isActive: boolean;
  mode: 'work' | 'shortBreak' | 'longBreak';
  activeTaskId?: string;
  activeTaskTitle?: string;
  ambientSound: string;
  interruptionsCount: number;
}
