// Next.js Proxy — 路由保护
// 未登录用户访问受保护页面时重定向到登录页

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 清除 Response 上所有 Supabase cookie 的辅助函数
function clearSupabaseCookies(response: NextResponse) {
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');
  // Supabase 项目特定的 cookie 名格式：sb-<project-ref>-auth-token
  // 我们无法遍历 response.cookies（只能 set/delete），所以显式列出已知的
  // 同时通过 request.cookies 在调用处遍历删除
}

export async function proxy(request: NextRequest) {
  // 受保护的路径
  const protectedPaths = ['/diagnose', '/vehicles', '/history', '/profile', '/used-car', '/admin'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 获取当前用户
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // ========== Error 处理：token 过期/无效/部署后 cookie 不一致 ==========
  if (error) {
    // 构建唯一的 response：保护路径 → redirect，其他 → next
    const response = isProtectedPath
      ? (() => {
          const url = request.nextUrl.clone();
          url.pathname = '/login';
          url.searchParams.set('redirect', request.nextUrl.pathname);
          return NextResponse.redirect(url);
        })()
      : NextResponse.next({ request });

    // 清除所有 sb- 开头的 cookie
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.delete(cookie.name);
      }
    });
    clearSupabaseCookies(response);

    return response;
  }

  // ========== 未登录访问受保护路径 → 重定向到登录页 ==========
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // ========== 已登录访问登录/注册页 → 重定向到首页 ==========
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static（静态文件）
     * - _next/image（图片优化）
     * - favicon.ico
     * - api 路由
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
