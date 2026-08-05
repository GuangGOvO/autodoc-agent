// POST /api/auth/logout — 清除会话 Cookie

import { NextResponse } from 'next/server';
import { sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
