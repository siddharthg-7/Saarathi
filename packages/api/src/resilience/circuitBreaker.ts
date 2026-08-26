export type ClientCircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ClientCircuitBreakerConfig {
  failureThreshold?: number;
  successThreshold?: number;
  openDurationMs?: number;
  halfOpenMaxTrials?: number;
}

export class ClientCircuitBreaker {
  public name: string;
  public state: ClientCircuitState = 'CLOSED';
  private failureThreshold: number;
  private successThreshold: number;
  private openDurationMs: number;
  private halfOpenMaxTrials: number;

  private failureCount: number = 0;
  private successCount: number = 0;
  private halfOpenTrials: number = 0;
  private lastStateChange: number = Date.now();

  constructor(name: string, config: ClientCircuitBreakerConfig = {}) {
    this.name = name;
    this.failureThreshold = config.failureThreshold ?? 5;
    this.successThreshold = config.successThreshold ?? 2;
    this.openDurationMs = config.openDurationMs ?? 20000;
    this.halfOpenMaxTrials = config.halfOpenMaxTrials ?? 2;
  }

  canExecute(): boolean {
    const now = Date.now();

    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      const elapsed = now - this.lastStateChange;
      if (elapsed >= this.openDurationMs) {
        this.state = 'HALF_OPEN';
        this.lastStateChange = now;
        this.halfOpenTrials = 0;
        this.successCount = 0;
        return true;
      }
      return false;
    }

    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenTrials < this.halfOpenMaxTrials) {
        this.halfOpenTrials++;
        return true;
      }
      return false;
    }

    return true;
  }

  recordSuccess(): void {
    const now = Date.now();
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.lastStateChange = now;
        this.failureCount = 0;
        this.successCount = 0;
        this.halfOpenTrials = 0;
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  recordFailure(): void {
    const now = Date.now();
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.lastStateChange = now;
      this.failureCount = this.failureThreshold;
      this.halfOpenTrials = 0;
    } else if (this.state === 'CLOSED') {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        this.lastStateChange = now;
      }
    }
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenTrials = 0;
    this.lastStateChange = Date.now();
  }
}

export const defaultApiClientCircuit = new ClientCircuitBreaker('saarathi-backend-api');
