import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchJsonWithTimeout,
  fetchWithTimeout,
  NetworkRequestError,
} from '@/lib/network/fetch';

function abortablePendingFetch(onAbort?: () => void) {
  return vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const abort = () => {
        onAbort?.();
        reject(init?.signal?.reason ?? new DOMException('Aborted', 'AbortError'));
      };
      if (init?.signal?.aborted) abort();
      else init?.signal?.addEventListener('abort', abort, { once: true });
    })
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('shared network fetch', () => {
  it('returns successful JSON responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"ok":true}')));

    await expect(fetchJsonWithTimeout('/ok', { timeoutMs: 1_000 })).resolves.toEqual({ ok: true });
  });

  it('classifies HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 500 })));

    await expect(fetchWithTimeout('/error', { timeoutMs: 1_000 })).rejects.toMatchObject({
      kind: 'http',
      status: 500,
    });
  });

  it('classifies network rejection without exposing its message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('socket secret')));

    await expect(fetchWithTimeout('/network', { timeoutMs: 1_000 })).rejects.toEqual(
      expect.objectContaining({ kind: 'network', message: 'Network request failed.' })
    );
  });

  it('aborts safely on timeout and cleans its timer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', abortablePendingFetch());
    const request = fetchWithTimeout('/slow', { timeoutMs: 100 });
    const assertion = expect(request).rejects.toMatchObject({ kind: 'timeout' });

    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('honors an external caller abort', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    vi.stubGlobal('fetch', abortablePendingFetch());
    const request = fetchWithTimeout('/cancelled', { timeoutMs: 1_000, signal: controller.signal });
    const assertion = expect(request).rejects.toMatchObject({ kind: 'aborted' });

    controller.abort(new DOMException('Superseded', 'AbortError'));
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not fire timeout after caller cancellation', async () => {
    vi.useFakeTimers();
    let abortCount = 0;
    const controller = new AbortController();
    vi.stubGlobal('fetch', abortablePendingFetch(() => abortCount++));
    const request = fetchWithTimeout('/cancelled-first', { timeoutMs: 100, signal: controller.signal });
    const assertion = expect(request).rejects.toMatchObject({ kind: 'aborted' });

    controller.abort();
    await assertion;
    await vi.advanceTimersByTimeAsync(100);
    expect(abortCount).toBe(1);
  });

  it('does not handle a later caller abort twice after timeout', async () => {
    vi.useFakeTimers();
    let abortCount = 0;
    const controller = new AbortController();
    vi.stubGlobal('fetch', abortablePendingFetch(() => abortCount++));
    const request = fetchWithTimeout('/timeout-first', { timeoutMs: 100, signal: controller.signal });
    const assertion = expect(request).rejects.toMatchObject({ kind: 'timeout' });

    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    controller.abort();
    expect(abortCount).toBe(1);
  });

  it('classifies invalid JSON responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')));

    await expect(fetchJsonWithTimeout('/invalid', { timeoutMs: 1_000 })).rejects.toEqual(
      expect.objectContaining<Partial<NetworkRequestError>>({ kind: 'invalid-response' })
    );
  });
});
