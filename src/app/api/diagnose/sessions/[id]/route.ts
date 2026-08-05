// GET/PATCH/DELETE /api/diagnose/sessions/[id]

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getServerUser } from '@/lib/serverAuth';

interface SessionRow {
  id: string;
  status: string;
  initial_symptom: string | null;
  report: unknown;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  const { rows } = await pool.query<SessionRow>(
    'select * from diagnosis_sessions where id = $1 and user_id = $2 limit 1',
    [id, user.id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: '诊断记录不存在' }, { status: 404 });
  }

  const { rows: messages } = await pool.query<MessageRow>(
    'select id, role, content, created_at from diagnosis_messages where session_id = $1 order by created_at asc',
    [id]
  );
  const session = rows[0];
  return NextResponse.json({
    session: {
      id: session.id,
      status: session.status as 'in_progress' | 'completed',
      initialSymptom: session.initial_symptom || '',
      messages: messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        timestamp: m.created_at,
      })),
      report: session.report !== null && session.report !== undefined ? session.report : undefined,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updates: string[] = ['updated_at = now()'];
  const values: unknown[] = [id, user.id];
  if (body.status) {
    values.push(body.status);
    updates.push(`status = $${values.length}`);
  }
  if (body.report !== undefined) {
    values.push(JSON.stringify(body.report));
    updates.push(`report = $${values.length}::jsonb`);
  }

  const { rows } = await pool.query<SessionRow>(
    `update diagnosis_sessions set ${updates.join(', ')}
     where id = $1 and user_id = $2
     returning *`,
    values
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: '诊断记录不存在' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  await pool.query('delete from diagnosis_sessions where id = $1 and user_id = $2', [id, user.id]);
  return NextResponse.json({ ok: true });
}
