// 认证状态 Provider — 管理全局登录状态

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { AuthUser } from '@/lib/auth';

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

// 超时辅助：防止 Supabase 连接卡死
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
  const supabase = getSupabaseBrowserClient();

  // 获取用户 profile — 带 try/catch/finally + 超时保护
  const fetchUser = async () => {
    try {
      const result = await withTimeout(supabase.auth.getUser(), 8000);

      if (!result) {
        // 超时：视为未登录，避免永久卡住
        setUser(null);
        return;
      }

      const { data: { user: authUser } } = result;

      if (!authUser) {
        setUser(null);
        return;
      }

      const profileResult = await withTimeout(
        supabase
          .from('profiles')
          .select('username, name, avatar_url')
          .eq('id', authUser.id)
          .single(),
        5000
      );

      const profile = profileResult?.data;

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        username: profile?.username || authUser.user_metadata?.username || '',
        name: profile?.name || profile?.username || '',
        avatarUrl: profile?.avatar_url || '',
      });
    } catch (err) {
      console.error('[AuthProvider] fetchUser error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 初始化：获取当前用户
  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
      } else if (event === 'SIGNED_IN') {
        await fetchUser();
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 路由保护：未登录访问受保护页面时跳转
  useEffect(() => {
    if (loading) return;

    const isPublicPath = PUBLIC_PATHS.some(p => pathname === p);

    if (!user && !isPublicPath) {
      router.push('/login');
    }
  }, [user, loading, pathname]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
