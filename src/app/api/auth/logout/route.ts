import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true, redirectTo: '/login' });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
