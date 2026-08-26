import { describe, it, expect, vi } from 'vitest';
import { ResilientWebSocketClient } from '../resilience/resilientWebSocket';

describe('ResilientWebSocketClient', () => {
  it('instantiates in disconnected state', () => {
    const client = new ResilientWebSocketClient({
      url: 'ws://localhost:8000/v1/kairo/chat/ws',
    });

    expect(client.state).toBe('disconnected');
  });

  it('triggers onFallbackRequired when max reconnect attempts are exceeded', () => {
    const onFallback = vi.fn();
    const client = new ResilientWebSocketClient({
      url: 'ws://localhost:9999/nonexistent',
      maxReconnectAttempts: 1,
      onFallbackRequired: onFallback,
    });

    // Simulate direct reconnect limit hit
    (client as any).reconnectAttempts = 2;
    (client as any).handleReconnect();

    expect(onFallback).toHaveBeenCalledWith(
      expect.stringContaining('Max WebSocket reconnect attempts exceeded')
    );
    expect(client.state).toBe('disconnected');
  });
});
