import { HybridSearchResult } from './memory';

export type KairoActionType =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'COMPLETE_TASK'
  | 'DELETE_TASK'
  | 'CREATE_REMINDER'
  | 'SNOOZE_REMINDER'
  | 'RESCHEDULE_TASK'
  | 'RESCHEDULE'
  | 'START_TASK'
  | 'START_FOCUS'
  | 'BREAK_DOWN'
  | 'CREATE_GOAL'
  | 'CREATE_MEMORY'
  | string;

export interface KairoSuggestedAction {
  actionType: KairoActionType;
  taskId?: string;
  goalId?: string;
  reminderId?: string;
  memoryId?: string;
  task?: Record<string, unknown>;
  goal?: Record<string, unknown>;
  reminder?: Record<string, unknown>;
  updates?: Record<string, unknown>;
  status?: string;
  snoozeMinutes?: number;
  requiresConfirmation?: boolean;
  label: string;
}

export interface KairoMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
  source?: string;
  retrievedMemories?: HybridSearchResult[];
  suggestedActions?: KairoSuggestedAction[];
  requiresConfirmation?: boolean;
}

export type KairoVisualState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'ERROR';

export type KairoVoicePersona = 'Puck' | 'Kore' | 'Charon' | 'Fenrir' | 'Aoede';

export interface KairoVoicePersonaInfo {
  id: KairoVoicePersona;
  name: string;
  description: string;
  tone: string;
  gender: string;
}

export const KAIRO_VOICE_PERSONAS: KairoVoicePersonaInfo[] = [
  { id: 'Puck', name: 'Puck', description: 'Playful, vibrant & engaging', tone: 'Upbeat & Warm', gender: 'Energetic' },
  { id: 'Kore', name: 'Kore', description: 'Calm, soothing & mindful', tone: 'Gentle & Meditative', gender: 'Relaxed' },
  { id: 'Charon', name: 'Charon', description: 'Deep, resonant & authoritative', tone: 'Steady & Grounded', gender: 'Deep' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Confident, friendly & natural', tone: 'Direct & Supportive', gender: 'Warm' },
  { id: 'Aoede', name: 'Aoede', description: 'Clear, articulate & melodic', tone: 'Polished & Focused', gender: 'Melodic' },
];

export interface KairoLiveVoiceEvent {
  type: 'session_started' | 'transcript' | 'audio' | 'actions' | 'turn_complete' | 'voice_updated' | 'error';
  role?: 'user' | 'assistant';
  text?: string;
  data?: string; // Base64 PCM/audio
  mimeType?: string;
  suggestedActions?: KairoSuggestedAction[];
  voice?: string;
  isLive?: boolean;
  message?: string;
  fullText?: string;
  isFinal?: boolean;
}


