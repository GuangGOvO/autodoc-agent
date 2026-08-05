// GET/PATCH /api/profile — 个人资料

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getServerUser } from '@/lib/serverAuth';

export async function GET() {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { rows } = await pool.query<{
    name: string | null;
    phone: string | null;
    email: string;
    avatar_url: string | null;
  }>('select name, phone, email, avatar_url from users where id = $1 limit 1', [user.id]);
  if (rows.length === 0) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }
  const row = rows[0];
  return NextResponse.json({
    profile: {
      name: row.name || '',
      phone: row.phone || '',
      email: row.email,
      avatarUrl: row.avatar_url || '',
    },
  });
}

export async function PATCH(request: NextRequest) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  try {
    const body = await request.json();
    await pool.query(
      `update users
       set name = $1, phone = $2, email = $3, avatar_url = $4, updated_at = now()
       where id = $5`,
      [
        String(body.name || '') || null,
        String(body.phone || '') || null,
        String(body.email || '') || null,
        String(body.avatarUrl || '') || null,
        user.id,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[profile] update error:', error);
    return NextResponse.json({ error: '保存失败，请稍后重试' }, { status: 500 });
  }
}
