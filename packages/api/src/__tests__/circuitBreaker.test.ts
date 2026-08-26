import { describe, it, expect } from 'vitest';
import { ClientCircuitBreaker } from '../resilience/circuitBreaker';

describe('ClientCircuitBreaker', () => {
  it('starts in CLOSED state', () => {
    const cb = new ClientCircuitBreaker('test-client-cb');
    expect(cb.state).toBe('CLOSED');
    expect(cb.canExecute()).toBe(true);
  });

  it('trips to OPEN after failure threshold is reached', () => {
    const cb = new ClientCircuitBreaker('test-client-cb', { failureThreshold: 3 });

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe('CLOSED');
    expect(cb.canExecute()).toBe(true);

    cb.recordFailure(); // 3rd failure
    expect(cb.state).toBe('OPEN');
    expect(cb.canExecute()).toBe(false);
  });

  it('resets cleanly to CLOSED state', () => {
    const cb = new ClientCircuitBreaker('test-client-cb', { failureThreshold: 2 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe('OPEN');

    cb.reset();
    expect(cb.state).toBe('CLOSED');
    expect(cb.canExecute()).toBe(true);
  });
});
