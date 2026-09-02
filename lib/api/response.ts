import { NextResponse } from 'next/server';
import { isNetworkRequestError } from '@/lib/network/fetch';

export const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

export function apiError(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ error: code, message }, { status, headers: NO_STORE_HEADERS });
}

export function providerErrorStatus(error: unknown): 500 | 502 | 504 {
  if (isNetworkRequestError(error, 'timeout')) return 504;
  if (isNetworkRequestError(error)) return 502;
  return 500;
}

export function logSafeApiError(context: string, error: unknown): void {
  if (isNetworkRequestError(error)) {
    console.error(context, { kind: error.kind, status: error.status });
  } else {
    console.error(context, { name: error instanceof Error ? error.name : 'UnknownError' });
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
