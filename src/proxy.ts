// Next.js Proxy — 路由保护（自托管 JWT 会话）
// 未登录用户访问受保护页面时重定向到登录页

import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

export async function proxy(request: NextRequest) {
  // 受保护的路径
  const protectedPaths = ['/diagnose', '/vehicles', '/history', '/profile', '/used-car', '/admin'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;

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

  return NextResponse.next({ request });
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
