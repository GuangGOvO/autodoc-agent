// GET /api/auth/check-username?username=xxx — 用户名是否可用

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const username = (request.nextUrl.searchParams.get('username') || '').trim();
    if (!username) {
      return NextResponse.json({ available: true });
    }
    const { rows } = await pool.query<{ id: string }>(
      'select id from users where username = $1 limit 1',
      [username]
    );
    return NextResponse.json({ available: rows.length === 0 });
  } catch (error) {
    console.error('[auth] check-username error:', error);
    return NextResponse.json({ error: '查询失败，请稍后重试' }, { status: 500 });
  }
}
