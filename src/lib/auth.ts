// 认证逻辑 — 邮箱密码登录 + 用户名

import { getSupabaseBrowserClient } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string;
}

/**
 * 注册新用户
 * @param email 邮箱
 * @param password 密码（最少6位）
 * @param username 用户名（唯一，2-20字符）
 */
export async function signUp(email: string, password: string, username: string): Promise<{ user: AuthUser | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  // 验证用户名格式
  if (!username || username.length < 2 || username.length > 20) {
    return { user: null, error: '用户名需要 2-20 个字符' };
  }

  // 检查用户名是否已被占用
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (existing) {
    return { user: null, error: '用户名已被占用，请换一个' };
  }

  // 创建用户
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (!data.user) {
    return { user: null, error: '注册失败，请稍后重试' };
  }

  // 创建 profile（RLS 策略会通过 trigger 自动创建，这里确保有 username）
  // 使用 onConflict:'id' 避免与 trigger 创建的记录冲突
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: data.user.id,
      username,
      name: username,
      email,
    }, { onConflict: 'id' });

  // 忽略 profile 写入错误（trigger 已经创建了记录）
  if (profileError && !profileError.message.includes('duplicate')) {
    console.warn('Profile upsert warning:', profileError.message);
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email || email,
      username,
      name: username,
      avatarUrl: '',
    },
    error: null,
  };
}

/**
 * 邮箱/用户名密码登录
 * @param identifier 邮箱或用户名（包含 @ 视为邮箱，否则视为用户名）
 * @param password 密码
 */
export async function signIn(identifier: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();

  let email = identifier;

  // 如果不含 @，视为用户名，通过 RPC 查找对应邮箱
  if (!identifier.includes('@')) {
    const { data: resolvedEmail, error: rpcError } = await supabase.rpc('lookup_email_by_username', {
      p_username: identifier,
    });

    if (rpcError) {
      return { user: null, error: '查询用户名失败：' + rpcError.message };
    }

    if (!resolvedEmail) {
      return { user: null, error: '用户名不存在' };
    }

    email = resolvedEmail;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // 将 Supabase 通用错误信息替换为更友好的中文提示
    if (error.message.includes('Invalid login credentials')) {
      return { user: null, error: '密码错误或账号不存在' };
    }
    return { user: null, error: error.message };
  }

  if (!data.user) {
    return { user: null, error: '登录失败' };
  }

  // 获取 profile 信息
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, name, avatar_url')
    .eq('id', data.user.id)
    .single();

  return {
    user: {
      id: data.user.id,
      email: data.user.email || email,
      username: profile?.username || data.user.user_metadata?.username || '',
      name: profile?.name || profile?.username || '',
      avatarUrl: profile?.avatar_url || '',
    },
    error: null,
  };
}

/**
 * 登出
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseBrowserClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 获取 profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, name, avatar_url')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email || '',
    username: profile?.username || user.user_metadata?.username || '',
    name: profile?.name || profile?.username || '',
    avatarUrl: profile?.avatar_url || '',
  };
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const supabase = getSupabaseBrowserClient();

  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, name, avatar_url')
        .eq('id', session.user.id)
        .single();

      callback({
        id: session.user.id,
        email: session.user.email || '',
        username: profile?.username || session.user.user_metadata?.username || '',
        name: profile?.name || profile?.username || '',
        avatarUrl: profile?.avatar_url || '',
      });
    } else if (event === 'SIGNED_OUT') {
      callback(null);
    }
  });
}

/**
 * 检查用户名是否可用
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  return !data;
}
