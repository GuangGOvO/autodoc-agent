// 认证状态 Provider — 管理全局登录状态（自托管 JWT 会话）

'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AUTH_CHANGED_EVENT, type AuthUser } from '@/lib/auth';
import { UNAUTHORIZED_EVENT, UNAUTHORIZED_REDIRECT_KEY } from '@/lib/apiClient';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// 不需要登录就能访问的页面
const PUBLIC_PATHS = ['/', '/login', '/register', '/about'];

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    try {
      const response = await withTimeout(fetch('/api/auth/me'), 8000);
      if (!response || !response.ok) {
        setUser(null);
        return;
      }
      const data = (await response.json()) as { user: AuthUser };
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化：获取当前用户
  useEffect(() => {
    // 初始化认证状态：同步外部系统，setState 发生在异步回调之后
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUser();
  }, [fetchUser]);

  // 登录/登出事件同步
  useEffect(() => {
    const handler = () => {
      void fetchUser();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler);
  }, [fetchUser]);

  // 401 事件：由 apiFetch 触发，统一跳转登录页并保留原路径
  useEffect(() => {
    const handler = () => {
      if (pathname.startsWith('/login')) return;
      const redirect = window.sessionStorage.getItem(UNAUTHORIZED_REDIRECT_KEY);
      const target = redirect
        ? `/login?redirect=${encodeURIComponent(redirect)}`
        : '/login';
      router.push(target);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [pathname, router]);

  // 路由保护：未登录访问受保护页面时跳转
  useEffect(() => {
    if (loading) return;
    const isPublicPath = PUBLIC_PATHS.some(p => pathname === p);
    if (!user && !isPublicPath) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
