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

export type KairoVoicePersona =
  | 'Puck'
  | 'Kore'
  | 'Zephyr'
  | 'Charon'
  | 'Fenrir'
  | 'Aoede'
  | 'Leda'
  | 'Orus'
  | 'Callirhoe'
  | 'Autonoe'
  | 'Enceladus'
  | 'Iapetus'
  | 'Umbriel'
  | 'Algieba'
  | 'Despina'
  | 'Erinome'
  | 'Algenib'
  | 'Rasalgethi'
  | 'Laomedeia'
  | 'Achernar'
  | 'Alnilam'
  | 'Schedar'
  | 'Gacrux'
  | 'Pulcherrima'
  | 'Achird'
  | 'Zubenelgenubi'
  | 'Vindemiatrix'
  | 'Sadachbia'
  | string;

export interface KairoVoicePersonaInfo {
  id: KairoVoicePersona;
  name: string;
  description: string;
  tone: string;
  gender: string;
  category: 'popular' | 'calm' | 'energetic' | 'deep' | 'celestial';
}

export const KAIRO_VOICE_PERSONAS: KairoVoicePersonaInfo[] = [
  // Flagship & Popular
  { id: 'Puck', name: 'Puck', description: 'Clear, professional, versatile', tone: 'Engaging & Balanced', gender: 'Dynamic', category: 'popular' },
  { id: 'Kore', name: 'Kore', description: 'Warm, adaptable, multilingual master', tone: 'Gentle & Natural', gender: 'Warm', category: 'popular' },
  { id: 'Zephyr', name: 'Zephyr', description: 'Youthful, casual, modern assistant', tone: 'Brisk & Friendly', gender: 'Youthful', category: 'popular' },
  { id: 'Charon', name: 'Charon', description: 'Deep, measured, calm & grounding', tone: 'Steady & Resonant', gender: 'Deep', category: 'popular' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Confident, friendly & natural', tone: 'Direct & Supportive', gender: 'Warm', category: 'popular' },
  { id: 'Aoede', name: 'Aoede', description: 'Clear, articulate & melodic', tone: 'Polished & Focused', gender: 'Melodic', category: 'popular' },

  // Calm & Mindful
  { id: 'Leda', name: 'Leda', description: 'Gentle, empathetic & serene', tone: 'Soothing & Soft', gender: 'Calm', category: 'calm' },
  { id: 'Umbriel', name: 'Umbriel', description: 'Mellow, soft & thoughtful', tone: 'Relaxed & Meditative', gender: 'Calm', category: 'calm' },
  { id: 'Erinome', name: 'Erinome', description: 'Tender, comforting & whisper-soft', tone: 'Delicate & Quiet', gender: 'Gentle', category: 'calm' },
  { id: 'Gacrux', name: 'Gacrux', description: 'Grounded, peaceful & steady', tone: 'Tranquil & Balanced', gender: 'Calm', category: 'calm' },
  { id: 'Sadachbia', name: 'Sadachbia', description: 'Subtle, breathy & intimate', tone: 'Whisper-Ready', gender: 'Gentle', category: 'calm' },

  // Energetic & Modern
  { id: 'Orus', name: 'Orus', description: 'Vibrant, dynamic & high-energy', tone: 'Upbeat & Motivating', gender: 'Energetic', category: 'energetic' },
  { id: 'Autonoe', name: 'Autonoe', description: 'Focused, bright & cheerful', tone: 'Lively & Inspiring', gender: 'Bright', category: 'energetic' },
  { id: 'Despina', name: 'Despina', description: 'Fast-paced, witty & conversational', tone: 'Spirited & Quick', gender: 'Energetic', category: 'energetic' },
  { id: 'Schedar', name: 'Schedar', description: 'Inspiring, commanding & radiant', tone: 'Bold & Encouraging', gender: 'Vibrant', category: 'energetic' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', description: 'Sunny, optimistic & playful', tone: 'Joyful & Fresh', gender: 'Bright', category: 'energetic' },

  // Deep & Resonant
  { id: 'Enceladus', name: 'Enceladus', description: 'Rich baritone & reassuring', tone: 'Strong & Warm', gender: 'Deep', category: 'deep' },
  { id: 'Iapetus', name: 'Iapetus', description: 'Stately, poised & narrative', tone: 'Storyteller & Authoritative', gender: 'Deep', category: 'deep' },
  { id: 'Rasalgethi', name: 'Rasalgethi', description: 'Deep, reflective & mature', tone: 'Low & Thoughtful', gender: 'Deep', category: 'deep' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', description: 'Rich, velvet & commanding', tone: 'Profound & Steady', gender: 'Deep', category: 'deep' },

  // Celestial HD Expressive
  { id: 'Callirhoe', name: 'Callirhoe', description: 'Smooth, refined & expressive', tone: 'Elegant & Fluent', gender: 'Expressive', category: 'celestial' },
  { id: 'Algieba', name: 'Algieba', description: 'Distinct, resonant & crisp', tone: 'Sharp & Professional', gender: 'Articulate', category: 'celestial' },
  { id: 'Algenib', name: 'Algenib', description: 'Bold, assertive & clear', tone: 'Decisive & Direct', gender: 'Confident', category: 'celestial' },
  { id: 'Laomedeia', name: 'Laomedeia', description: 'Melodious, lyrical & relaxed', tone: 'Flowing & Harmonic', gender: 'Melodic', category: 'celestial' },
  { id: 'Achernar', name: 'Achernar', description: 'Polished, commanding & vivid', tone: 'Executive & Clear', gender: 'Crisp', category: 'celestial' },
  { id: 'Alnilam', name: 'Alnilam', description: 'Balanced, steady & informative', tone: 'Neutral & Academic', gender: 'Steady', category: 'celestial' },
  { id: 'Pulcherrima', name: 'Pulcherrima', description: 'Warm, comforting & expressive', tone: 'Harmonious & Kind', gender: 'Warm', category: 'celestial' },
  { id: 'Achird', name: 'Achird', description: 'Precise, crisp & focused', tone: 'Analytical & Clean', gender: 'Precise', category: 'celestial' },
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


