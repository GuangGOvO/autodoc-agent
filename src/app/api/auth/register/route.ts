// POST /api/auth/register — 注册并自动登录

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';
import { getClientIp, hitRateLimit, rateLimitedResponse } from '@/lib/rateLimit';

// 管理员邮箱白名单（逗号分隔，来自环境变量 ADMIN_EMAILS）
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    // 限流：同一 IP 10 次/分钟
    const ip = getClientIp(request);
    const perIp = hitRateLimit({ scope: 'register:ip', key: ip, limit: 10 });
    if (perIp.limited) return rateLimitedResponse(perIp.retryAfterSec);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }
    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ error: '用户名需要 2-20 个字符' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 });
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return NextResponse.json({ error: '密码过长，请控制在 72 字节以内' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
    let userId: string;
    try {
      const { rows } = await pool.query<{ id: string }>(
        `insert into users (email, username, password_hash, name, role)
         values ($1, $2, $3, $2, $4)
         returning id`,
        [email, username, passwordHash, role]
      );
      userId = rows[0].id;
    } catch (err) {
      const msg = (err as { message?: string }).message || '';
      if (msg.includes('users_email_key') || (msg.includes('duplicate key') && msg.includes('email'))) {
        return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
      }
      if (msg.includes('users_username_key') || (msg.includes('duplicate key') && msg.includes('username'))) {
        return NextResponse.json({ error: '用户名已被占用，请换一个' }, { status: 409 });
      }
      throw err;
    }

    const token = await createSessionToken({ id: userId, email, username, role });
    const response = NextResponse.json({
      user: { id: userId, email, username, name: username, avatarUrl: '', role },
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    console.error('[auth] register error:', error);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
