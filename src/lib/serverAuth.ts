// 服务端认证工具 — 用于 API Routes 和 Server Components

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 从请求 cookies 中获取当前用户
 * 用于 API Routes 中验证登录状态
 */
export async function getServerUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // API routes 中不需要设置 cookies
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
