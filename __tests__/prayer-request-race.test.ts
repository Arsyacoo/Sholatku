import { describe, expect, it } from 'vitest';
import { LatestRequestController } from '@/lib/network/latest-request';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createHarness() {
  const requests = new LatestRequestController();
  let value: string | null = null;
  let error: string | null = null;

  const run = async (result: Promise<string>) => {
    const request = requests.begin();
    try {
      const next = await result;
      if (request.isCurrent()) value = next;
    } catch (caught) {
      if (request.isCurrent()) error = caught instanceof Error ? caught.message : 'error';
    } finally {
      requests.finish(request);
    }
    return request.signal;
  };

  return {
    requests,
    run,
    state: () => ({ value, error }),
  };
}

describe('prayer latest-request coordination', () => {
  it('keeps B when B resolves before A', async () => {
    const harness = createHarness();
    const a = deferred<string>();
    const b = deferred<string>();
    const runA = harness.run(a.promise);
    const runB = harness.run(b.promise);

    b.resolve('Denpasar');
    await runB;
    a.resolve('Jakarta');
    await runA;

    expect(harness.state()).toEqual({ value: 'Denpasar', error: null });
  });

  it('ignores an A error while B is active', async () => {
    const harness = createHarness();
    const a = deferred<string>();
    const b = deferred<string>();
    const runA = harness.run(a.promise);
    const runB = harness.run(b.promise);

    a.reject(new Error('Jakarta failed'));
    await runA;
    b.resolve('Denpasar');
    await runB;

    expect(harness.state()).toEqual({ value: 'Denpasar', error: null });
  });

  it('ignores a stale offline fallback from A', async () => {
    const harness = createHarness();
    const a = deferred<string>();
    const b = deferred<string>();
    const runA = harness.run(a.promise);
    const runB = harness.run(b.promise);

    a.resolve('Jakarta offline');
    await runA;
    b.resolve('Denpasar online');
    await runB;

    expect(harness.state().value).toBe('Denpasar online');
  });

  it('prevents updates after unmount cancellation', async () => {
    const harness = createHarness();
    const pending = deferred<string>();
    const run = harness.run(pending.promise);

    harness.requests.cancel();
    pending.resolve('late result');
    await run;

    expect(harness.state()).toEqual({ value: null, error: null });
  });

  it('aborts the previous attempt when retry starts', async () => {
    const requests = new LatestRequestController();
    const first = requests.begin();
    const retry = requests.begin();

    expect(first.signal.aborted).toBe(true);
    expect(first.isCurrent()).toBe(false);
    expect(retry.signal.aborted).toBe(false);
    expect(retry.isCurrent()).toBe(true);
  });
});
