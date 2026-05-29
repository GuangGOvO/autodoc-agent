// Supabase 客户端初始化
// 浏览器端和服务端分别使用不同的客户端

import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// 浏览器端客户端（用于 Client Components）
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 服务端客户端（用于 Server Components 和 API Routes）
export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 单例浏览器客户端（推荐在 Client Components 中使用）
let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }
  return browserClient;
}
