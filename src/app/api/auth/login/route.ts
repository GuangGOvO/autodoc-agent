// POST /api/auth/login — 邮箱或用户名登录

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';
import { getClientIp, hitRateLimit, rateLimitedResponse } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');

    if (!identifier || !password) {
      return NextResponse.json({ error: '请输入账号和密码' }, { status: 400 });
    }

    // 限流：同一 IP+账号 10 次/分钟，同一 IP 30 次/分钟
    const ip = getClientIp(request);
    const perAccount = hitRateLimit({
      scope: 'login:acct',
      key: `${ip}:${identifier.toLowerCase()}`,
      limit: 10,
    });
    if (perAccount.limited) return rateLimitedResponse(perAccount.retryAfterSec);
    const perIp = hitRateLimit({ scope: 'login:ip', key: ip, limit: 30 });
    if (perIp.limited) return rateLimitedResponse(perIp.retryAfterSec);

    const { rows } = await pool.query<{
      id: string;
      email: string;
      username: string;
      password_hash: string;
      name: string | null;
      avatar_url: string | null;
      role: string;
    }>(
      `select id, email, username, password_hash, name, avatar_url, role
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
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name || user.username,
        avatarUrl: user.avatar_url || '',
        role: user.role,
      },
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    console.error('[auth] login error:', error);
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
