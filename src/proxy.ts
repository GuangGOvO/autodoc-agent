// Next.js Proxy — 路由保护
// 未登录用户访问受保护页面时重定向到登录页

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 受保护的路径
  const protectedPaths = ['/diagnose', '/vehicles', '/history', '/profile', '/used-car', '/admin'];

  // 检查是否访问受保护路径
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 获取当前用户 — 处理 error（token 过期/无效/部署后 cookie 不一致）
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    // Session 无效：清除所有 Supabase cookie，让客户端重新建立 session
    const clearResponse = isProtectedPath
      ? NextResponse.redirect(new URL('/login', request.url))
      : NextResponse.next({ request });

    // 删除所有 sb- 开头的 cookie（Supabase 项目特定的 cookie 名格式）
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        clearResponse.cookies.delete(cookie.name);
      }
    });

    // 显式删除标准 Supabase cookie
    clearResponse.cookies.delete('sb-access-token');
    clearResponse.cookies.delete('sb-refresh-token');

    // 保护路径附带的重定向参数
    if (isProtectedPath && clearResponse instanceof Response && clearResponse.headers.get('location')) {
      const url = new URL(clearResponse.headers.get('location')!);
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    return clearResponse;
  }

  // 未登录访问受保护路径 → 重定向到登录页
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 已登录访问登录/注册页 → 重定向到首页
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
