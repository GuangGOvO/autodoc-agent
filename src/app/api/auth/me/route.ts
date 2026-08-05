// GET /api/auth/me — 当前登录用户

import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/serverAuth';

export async function GET() {
  const { user } = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name || user.username,
      avatarUrl: user.avatarUrl || '',
    },
  });
}
