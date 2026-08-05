// GET/POST /api/used-car/evaluations

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getServerUser } from '@/lib/serverAuth';

interface EvalRow {
  id: string;
  input: unknown;
  report_markdown: string | null;
  created_at: string;
}

function mapEval(row: EvalRow) {
  return {
    id: row.id,
    input: row.input as Record<string, unknown>,
    reportMarkdown: row.report_markdown || '',
    createdAt: row.created_at,
  };
}

export async function GET() {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { rows } = await pool.query<EvalRow>(
    'select * from used_car_evaluations where user_id = $1 order by created_at desc',
    [user.id]
  );
  return NextResponse.json({ evaluations: rows.map(mapEval) });
}

export async function POST(request: NextRequest) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  try {
    const body = await request.json();
    const input = body.input;
    const reportMarkdown = String(body.reportMarkdown || '');
    if (!input || typeof input !== 'object') {
      return NextResponse.json({ error: '评估输入不完整' }, { status: 400 });
    }
    const { rows } = await pool.query<EvalRow>(
      `insert into used_car_evaluations (user_id, input, report_markdown)
       values ($1, $2::jsonb, $3)
       returning *`,
      [user.id, JSON.stringify(input), reportMarkdown]
    );
    return NextResponse.json({ evaluation: mapEval(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error('[used-car] create evaluation error:', error);
    return NextResponse.json({ error: '保存失败，请稍后重试' }, { status: 500 });
  }
}
