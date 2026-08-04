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
        // 超时：清除过期 session，视为未登录
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      const { data: { user: authUser }, error } = result;

      if (error || !authUser) {
        // getUser 返回错误（token 过期/无效）或无用户 → 清理 session
        if (error) {
          console.warn('[AuthProvider] getUser error, clearing session:', error.message);
          await supabase.auth.signOut();
        }
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
      // 出错时彻底清理客户端 session，避免残留的无效 cookie
      try {
        await supabase.auth.signOut();
      } catch {
        // signOut 本身也可能失败（比如 token 已无效），忽略
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 初始化：获取当前用户
  useEffect(() => {
    // 初始化认证状态：同步外部系统（Supabase Auth），setState 发生在异步回调之后
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听认证状态变化 — 包括 TOKEN_REFRESHED 失败处理
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
      } else if (event === 'SIGNED_IN') {
        await fetchUser();
      } else if (event === 'TOKEN_REFRESHED') {
        // Token 刷新成功 — 正常情况，无需额外操作
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
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
