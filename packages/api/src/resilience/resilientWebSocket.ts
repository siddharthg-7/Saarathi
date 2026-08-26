import { computeClientBackoffDelay } from './retryClient';

export type WSConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface ResilientWebSocketOptions {
  url: string;
  token?: string;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
  onMessage?: (data: any) => void;
  onStateChange?: (state: WSConnectionState) => void;
  onError?: (error: any) => void;
  onFallbackRequired?: (reason: string) => void;
}

export class ResilientWebSocketClient {
  private url: string;
  private token?: string;
  private ws: WebSocket | null = null;
  public state: WSConnectionState = 'disconnected';
  private maxReconnectAttempts: number;
  private heartbeatIntervalMs: number;

  private reconnectAttempts: number = 0;
  private heartbeatTimer: any = null;
  private reconnectTimer: any = null;
  private isIntentionallyClosed: boolean = false;

  private onMessageCb?: (data: any) => void;
  private onStateChangeCb?: (state: WSConnectionState) => void;
  private onErrorCb?: (error: any) => void;
  private onFallbackRequiredCb?: (reason: string) => void;

  constructor(options: ResilientWebSocketOptions) {
    this.url = options.url;
    this.token = options.token;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 15000;
    this.onMessageCb = options.onMessage;
    this.onStateChangeCb = options.onStateChange;
    this.onErrorCb = options.onError;
    this.onFallbackRequiredCb = options.onFallbackRequired;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.setState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      const fullUrl = this.token ? `${this.url}?token=${encodeURIComponent(this.token)}` : this.url;
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            return; // Handled heartbeat
          }
          if (this.onMessageCb) {
            this.onMessageCb(data);
          }
        } catch {
          if (this.onMessageCb) {
            this.onMessageCb(event.data);
          }
        }
      };

      this.ws.onerror = (err) => {
        if (this.onErrorCb) {
          this.onErrorCb(err);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (!this.isIntentionallyClosed) {
          this.handleReconnect();
        } else {
          this.setState('disconnected');
        }
      };
    } catch (err) {
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.isIntentionallyClosed) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('disconnected');
      if (this.onFallbackRequiredCb) {
        this.onFallbackRequiredCb('Max WebSocket reconnect attempts exceeded; fallback to HTTP active.');
      }
      return;
    }

    this.setState('reconnecting');
    const delayMs = computeClientBackoffDelay(this.reconnectAttempts, 1000, 15000, 0.2);
    this.reconnectAttempts++;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delayMs);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch {
          // Handled on close
        }
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public send(data: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(payload);
      return true;
    }
    return false;
  }

  public close(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.setState('disconnected');
  }

  private setState(newState: WSConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      if (this.onStateChangeCb) {
        this.onStateChangeCb(newState);
      }
    }
  }
}
