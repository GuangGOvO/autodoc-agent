// POST /api/auth/login — 邮箱或用户名登录

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');

    if (!identifier || !password) {
      return NextResponse.json({ error: '请输入账号和密码' }, { status: 400 });
    }

    const { rows } = await pool.query<{
      id: string;
      email: string;
      username: string;
      password_hash: string;
      name: string | null;
      avatar_url: string | null;
    }>(
      `select id, email, username, password_hash, name, avatar_url
       from users
       where email = $1 or username = $2
       limit 1`,
      [identifier.toLowerCase(), identifier]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: '密码错误或账号不存在' }, { status: 401 });
    }

    const user = rows[0];
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: '密码错误或账号不存在' }, { status: 401 });
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name || user.username,
        avatarUrl: user.avatar_url || '',
      },
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    console.error('[auth] login error:', error);
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
