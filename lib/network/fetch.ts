export type NetworkErrorKind = 'timeout' | 'aborted' | 'network' | 'http' | 'invalid-response';

export class NetworkRequestError extends Error {
  readonly kind: NetworkErrorKind;
  readonly status?: number;

  constructor(
    kind: NetworkErrorKind,
    message: string,
    options: { status?: number; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = 'NetworkRequestError';
    this.kind = kind;
    this.status = options.status;
  }
}

export const NETWORK_TIMEOUTS = {
  prayerRoute: 10_000,
  prayerProvider: 8_000,
  geocoding: 7_000,
  quranProvider: 12_000,
  quranRoute: 15_000,
  quranCorpusProvider: 20_000,
  quranCorpusRoute: 120_000,
} as const;

interface NextFetchOptions {
  revalidate?: number;
  tags?: string[];
}

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs: number;
  rejectHttpErrors?: boolean;
  next?: NextFetchOptions;
}

export function isNetworkRequestError(
  error: unknown,
  kind?: NetworkErrorKind
): error is NetworkRequestError {
  return error instanceof NetworkRequestError && (!kind || error.kind === kind);
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  options: FetchWithTimeoutOptions
): Promise<Response> {
  const { timeoutMs, rejectHttpErrors = true, signal, ...init } = options;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('timeoutMs must be a positive finite number.');
  }
  if (signal?.aborted) {
    throw new NetworkRequestError('aborted', 'Network request was cancelled.', {
      cause: signal.reason,
    });
  }

  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException('Network request timed out.', 'TimeoutError'));
  }, timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    if (rejectHttpErrors && !response.ok) {
      throw new NetworkRequestError('http', 'Network request returned an error response.', {
        status: response.status,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof NetworkRequestError) throw error;
    if (timedOut) {
      throw new NetworkRequestError('timeout', 'Network request timed out.', { cause: error });
    }
    if (signal?.aborted || controller.signal.aborted) {
      throw new NetworkRequestError('aborted', 'Network request was cancelled.', {
        cause: signal?.reason ?? error,
      });
    }
    throw new NetworkRequestError('network', 'Network request failed.', { cause: error });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

export async function readJsonResponse<T = unknown>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new NetworkRequestError('invalid-response', 'Network response was not valid JSON.', {
      status: response.status,
      cause: error,
    });
  }
}

export async function fetchJsonWithTimeout<T = unknown>(
  input: RequestInfo | URL,
  options: FetchWithTimeoutOptions
): Promise<T> {
  return readJsonResponse<T>(await fetchWithTimeout(input, options));
}
