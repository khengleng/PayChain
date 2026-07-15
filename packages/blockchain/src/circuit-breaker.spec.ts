import { CircuitBreaker, CircuitOpenError, TimeoutError, withTimeout } from './circuit-breaker';

describe('CircuitBreaker', () => {
  it('opens after the failure threshold and fails fast', async () => {
    const clock = 0;
    const cb = new CircuitBreaker('rpc', { failureThreshold: 3, resetTimeoutMs: 1000, now: () => clock });
    const fail = () => cb.execute(() => Promise.reject(new Error('boom')));

    await expect(fail()).rejects.toThrow('boom');
    await expect(fail()).rejects.toThrow('boom');
    await expect(fail()).rejects.toThrow('boom'); // 3rd failure opens it
    expect(cb.getState()).toBe('OPEN');

    // now fails fast without calling the function
    await expect(cb.execute(() => Promise.resolve('should-not-run'))).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it('half-opens after the reset window and closes on a successful probe', async () => {
    let clock = 0;
    const cb = new CircuitBreaker('rpc', { failureThreshold: 1, resetTimeoutMs: 1000, now: () => clock });
    await expect(cb.execute(() => Promise.reject(new Error('x')))).rejects.toThrow();
    expect(cb.getState()).toBe('OPEN');

    clock = 1000; // advance past reset window
    expect(cb.getState()).toBe('HALF_OPEN');
    await expect(cb.execute(() => Promise.resolve('ok'))).resolves.toBe('ok');
    expect(cb.getState()).toBe('CLOSED');
  });

  it('re-opens if the half-open probe fails', async () => {
    let clock = 0;
    const cb = new CircuitBreaker('rpc', { failureThreshold: 1, resetTimeoutMs: 1000, now: () => clock });
    await expect(cb.execute(() => Promise.reject(new Error('x')))).rejects.toThrow();
    clock = 1000;
    await expect(cb.execute(() => Promise.reject(new Error('still down')))).rejects.toThrow('still down');
    expect(cb.getState()).toBe('OPEN');
  });
});

describe('withTimeout', () => {
  it('rejects when the promise is too slow', async () => {
    const slow = new Promise((r) => setTimeout(r, 50));
    await expect(withTimeout(slow, 10)).rejects.toBeInstanceOf(TimeoutError);
  });

  it('resolves when the promise is fast enough', async () => {
    await expect(withTimeout(Promise.resolve('quick'), 50)).resolves.toBe('quick');
  });
});
