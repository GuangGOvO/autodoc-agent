// GET /api/stats — 使用统计

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getServerUser } from '@/lib/serverAuth';

export async function GET() {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const [sessions, completed, vehicles, evaluations] = await Promise.all([
    pool.query<{ count: string }>('select count(*)::text as count from diagnosis_sessions where user_id = $1', [user.id]),
    pool.query<{ count: string }>('select count(*)::text as count from diagnosis_sessions where user_id = $1 and status = $2', [user.id, 'completed']),
    pool.query<{ count: string }>('select count(*)::text as count from vehicles where user_id = $1', [user.id]),
    pool.query<{ count: string }>('select count(*)::text as count from used_car_evaluations where user_id = $1', [user.id]),
  ]);

  return NextResponse.json({
    stats: {
      totalSessions: Number(sessions.rows[0]?.count) || 0,
      completedSessions: Number(completed.rows[0]?.count) || 0,
      totalVehicles: Number(vehicles.rows[0]?.count) || 0,
      totalEvaluations: Number(evaluations.rows[0]?.count) || 0,
    },
  });
}
