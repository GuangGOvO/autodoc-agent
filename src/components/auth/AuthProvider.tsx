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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();

  // 获取用户 profile
  const fetchUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, name, avatar_url')
      .eq('id', authUser.id)
      .single();

    setUser({
      id: authUser.id,
      email: authUser.email || '',
      username: profile?.username || authUser.user_metadata?.username || '',
      name: profile?.name || profile?.username || '',
      avatarUrl: profile?.avatar_url || '',
    });
    setLoading(false);
  };

  // 初始化：获取当前用户
  useEffect(() => {
    fetchUser();
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
