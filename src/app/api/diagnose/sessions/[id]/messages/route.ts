// POST /api/diagnose/sessions/[id]/messages — 添加消息

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getServerUser } from '@/lib/serverAuth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const role = String(body.role || '');
  const content = String(body.content || '');
  if (!['user', 'assistant', 'system'].includes(role) || !content) {
    return NextResponse.json({ error: '消息格式不正确' }, { status: 400 });
  }

  // 校验会话归属
  const { rows: sessions } = await pool.query<{ id: string }>(
    'select id from diagnosis_sessions where id = $1 and user_id = $2 limit 1',
    [id, user.id]
  );
  if (sessions.length === 0) {
    return NextResponse.json({ error: '诊断记录不存在' }, { status: 404 });
  }

  const { rows } = await pool.query<{ id: string; role: string; content: string; created_at: string }>(
    `insert into diagnosis_messages (session_id, role, content)
     values ($1, $2, $3)
     returning id, role, content, created_at`,
    [id, role, content]
  );
  const msg = rows[0];
  return NextResponse.json(
    {
      message: {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
      },
    },
    { status: 201 }
  );
}
