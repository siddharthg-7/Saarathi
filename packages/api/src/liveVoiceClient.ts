import { KairoVoicePersona, KairoLiveVoiceEvent, KairoSuggestedAction } from '@saarathi/types';
import { env } from './config/env';
import { auth } from './firebase';

export interface LiveVoiceClientOptions {
  voice?: KairoVoicePersona;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onActions?: (actions: KairoSuggestedAction[]) => void;
  onStateChange?: (state: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR') => void;
  onError?: (err: Error) => void;
}

export class LiveVoiceClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private audioQueue: Array<{ buffer: AudioBuffer }> = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private options: LiveVoiceClientOptions;
  private isConnected = false;

  constructor(options: LiveVoiceClientOptions = {}) {
    this.options = options;
  }

  public setVoice(voice: KairoVoicePersona): void {
    this.options.voice = voice;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'set_voice', voice }));
    }
  }

  public async start(): Promise<void> {
    if (this.isConnected) return;

    let token = '';
    try {
      token = (await auth.currentUser?.getIdToken()) || '';
    } catch {}

    const baseUrl = env.apiBaseUrl;
    let wsUrl = baseUrl.replace(/^http/, 'ws');
    if (wsUrl.startsWith('/')) {
      const loc = typeof window !== 'undefined' ? window.location : { host: 'localhost', protocol: 'http:' };
      const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${proto}//${loc.host}${wsUrl}`;
    }

    const voice = this.options.voice || 'Puck';
    const endpoint = `${wsUrl}/kairo/live-voice/ws?voice=${encodeURIComponent(voice)}${
      token ? `&token=${encodeURIComponent(token)}` : ''
    }`;

    // 1. Initialize Microphone Audio Stream
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx({ sampleRate: 16000 });
      }

      if (navigator?.mediaDevices?.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
      }
    } catch (err: any) {
      console.warn('Microphone access notice in LiveVoiceClient:', err);
    }

    // 2. Establish WebSocket
    try {
      this.ws = new WebSocket(endpoint);
    } catch (e: any) {
      this.options.onError?.(e);
      return;
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this.options.onStateChange?.('LISTENING');
      this.startAudioCapture();
    };

    this.ws.onmessage = async (event) => {
      try {
        const data: KairoLiveVoiceEvent = JSON.parse(event.data);
        if (data.type === 'transcript') {
          this.options.onTranscript?.(data.text || '', data.isFinal || false);
        } else if (data.type === 'audio' && data.data) {
          await this.handleIncomingAudio(data.data, data.mimeType);
        } else if (data.type === 'actions' && data.suggestedActions) {
          this.options.onActions?.(data.suggestedActions);
        } else if (data.type === 'turn_complete') {
          if (!this.isPlaying && this.audioQueue.length === 0) {
            this.options.onStateChange?.('LISTENING');
          }
        }
      } catch (err) {
        console.error('Failed to parse live voice message:', err);
      }
    };

    this.ws.onerror = (err) => {
      console.warn('LiveVoice WebSocket error:', err);
      this.options.onStateChange?.('ERROR');
      this.options.onError?.(new Error('Live Voice WebSocket connection failure.'));
    };

    this.ws.onclose = () => {
      this.stop();
    };
  }

  private startAudioCapture(): void {
    if (!this.audioContext || !this.mediaStream) return;

    try {
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      // Process chunks of 2048 samples (approx 128ms @ 16kHz)
      this.processorNode = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert float32 [-1.0, 1.0] to Int16 PCM bytes
        const pcmBuffer = new ArrayBuffer(inputData.length * 2);
        const pcmView = new DataView(pcmBuffer);

        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmView.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }

        // Send raw PCM bytes frame
        this.ws.send(pcmBuffer);
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Failed to start audio processing node:', e);
    }
  }

  /**
   * Barge-in interruption handler: instantly flushes audio playback queue
   * and cancels active speaker node when user speaks or interrupts.
   */
  public interrupt(): void {
    // 1. Flush local playback buffers
    this.audioQueue = [];
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.options.onAudioEnd?.();
    this.options.onStateChange?.('LISTENING');

    // 2. Notify backend of barge-in
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'interrupt' }));
    }
  }

  private async handleIncomingAudio(base64Data: string, mimeType?: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;
      if (mimeType && mimeType.includes('pcm')) {
        // Raw 16-bit PCM (default 24kHz output from Gemini Live)
        const sampleRate = 24000;
        const int16 = new Int16Array(bytes.buffer);
        audioBuffer = this.audioContext.createBuffer(1, int16.length, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < int16.length; i++) {
          channelData[i] = int16[i] / 32768.0;
        }
      } else {
        // Decode standard container audio
        audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer.slice(0));
      }

      this.audioQueue.push({ buffer: audioBuffer });
      if (!this.isPlaying) {
        this.playNextInQueue();
      }
    } catch (e) {
      console.warn('Error decoding incoming live audio buffer:', e);
    }
  }

  private playNextInQueue(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.options.onAudioEnd?.();
      this.options.onStateChange?.('LISTENING');
      return;
    }

    if (!this.audioContext) return;

    this.isPlaying = true;
    this.options.onAudioStart?.();
    this.options.onStateChange?.('SPEAKING');

    const next = this.audioQueue.shift();
    if (!next) return;

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = next.buffer;
      source.connect(this.audioContext.destination);

      this.currentSource = source;

      source.onended = () => {
        this.currentSource = null;
        this.playNextInQueue();
      };

      source.start();
    } catch (e) {
      console.warn('Audio playback error:', e);
      this.playNextInQueue();
    }
  }

  public stop(): void {
    this.isConnected = false;
    this.interrupt();

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {}
      this.processorNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.options.onStateChange?.('IDLE');
  }
}
