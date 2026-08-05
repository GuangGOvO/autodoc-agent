// GET/POST /api/diagnose/sessions — 诊断会话列表与新建

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
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

function mapSession(row: SessionRow, messages: MessageRow[] = []) {
  return {
    id: row.id,
    status: row.status as 'in_progress' | 'completed',
    initialSymptom: row.initial_symptom || '',
    messages: messages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      timestamp: m.created_at,
    })),
    report: row.report !== null && row.report !== undefined ? row.report : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { rows: sessions } = await pool.query<SessionRow>(
    'select * from diagnosis_sessions where user_id = $1 order by created_at desc',
    [user.id]
  );

  const sessionIds = sessions.map(s => s.id);
  const messagesBySession = new Map<string, MessageRow[]>();
  if (sessionIds.length > 0) {
    const { rows: messages } = await pool.query<MessageRow>(
      'select * from diagnosis_messages where session_id = any($1::uuid[]) order by created_at asc',
      [sessionIds]
    );
    messages.forEach(m => {
      const list = messagesBySession.get(m.session_id) || [];
      list.push(m);
      messagesBySession.set(m.session_id, list);
    });
  }

  return NextResponse.json({
    sessions: sessions.map(s => mapSession(s, messagesBySession.get(s.id) || [])),
  });
}

export async function POST(request: NextRequest) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  try {
    const body = await request.json();
    const initialSymptom = String(body.initialSymptom || '').slice(0, 1000);
    const { rows } = await pool.query<SessionRow>(
      `insert into diagnosis_sessions (user_id, initial_symptom, status)
       values ($1, $2, 'in_progress')
       returning *`,
      [user.id, initialSymptom]
    );
    return NextResponse.json({ session: mapSession(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error('[diagnose] create session error:', error);
    return NextResponse.json({ error: '创建会话失败，请稍后重试' }, { status: 500 });
  }
}
