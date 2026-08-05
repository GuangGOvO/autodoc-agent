// 服务端认证工具 — JWT 会话（自托管）

import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE } from './session';
import { pool } from './db';

// 管理员邮箱白名单（逗号分隔，来自环境变量 ADMIN_EMAILS）
// 注册与登录时都会同步角色：命中白名单的邮箱自动获得 admin
export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export interface ServerUser {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  phone: string | null;
  role: string;
}

/** 从请求 Cookie 读取会话（服务端组件 / API 路由） */
async function readSessionFromCookies() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * 从请求 cookies 中获取当前用户（签名与旧 Supabase 版本一致）
 * 用于 API Routes 中验证登录状态
 */
export async function getServerUser(): Promise<{
  user: ServerUser | null;
  error: Error | null;
}> {
  try {
    const session = await readSessionFromCookies();
    if (!session) return { user: null, error: null };

    const { rows } = await pool.query<{
      id: string;
      email: string;
      username: string;
      name: string | null;
      avatar_url: string | null;
      phone: string | null;
      role: string;
    }>(
      `select id, email, username, name, avatar_url, phone, role
       from users
       where id = $1
       limit 1`,
      [session.id]
    );

    if (rows.length === 0) return { user: null, error: null };
    const row = rows[0];
    return {
      user: {
        id: row.id,
        email: row.email,
        username: row.username,
        name: row.name,
        avatarUrl: row.avatar_url,
        phone: row.phone,
        role: row.role || 'user',
      },
      error: null,
    };
  } catch (error) {
    console.error('[serverAuth] getServerUser error:', error);
    return {
      user: null,
      error: error instanceof Error ? error : new Error('认证服务异常'),
    };
  }
}
