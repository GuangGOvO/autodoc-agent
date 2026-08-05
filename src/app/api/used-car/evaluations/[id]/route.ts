// GET/DELETE /api/used-car/evaluations/[id]

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getServerUser } from '@/lib/serverAuth';

interface EvalRow {
  id: string;
  input: unknown;
  report_markdown: string | null;
  created_at: string;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  const { rows } = await pool.query<EvalRow>(
    'select * from used_car_evaluations where id = $1 and user_id = $2 limit 1',
    [id, user.id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: '评估记录不存在' }, { status: 404 });
  }
  const row = rows[0];
  return NextResponse.json({
    evaluation: {
      id: row.id,
      input: row.input as Record<string, unknown>,
      reportMarkdown: row.report_markdown || '',
      createdAt: row.created_at,
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  await pool.query('delete from used_car_evaluations where id = $1 and user_id = $2', [id, user.id]);
  return NextResponse.json({ ok: true });
}
