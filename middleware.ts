import { NextRequest, NextResponse } from 'next/server';
import { getCapacitorCorsHeaders } from '@/lib/api/cors';

export function middleware(request: NextRequest) {
  const corsHeaders = getCapacitorCorsHeaders(request.headers.get('origin'));

  if (request.method === 'OPTIONS' && corsHeaders.has('Access-Control-Allow-Origin')) {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  corsHeaders.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
