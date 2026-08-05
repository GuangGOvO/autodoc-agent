// 认证逻辑（客户端）— 邮箱密码登录 + 用户名，走 API 路由

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string;
}

export const AUTH_CHANGED_EVENT = 'autodoc-auth-changed';

function notifyAuthChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

async function authFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data;
}

/**
 * 注册新用户
 */
export async function signUp(
  email: string,
  password: string,
  username: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!username || username.length < 2 || username.length > 20) {
    return { user: null, error: '用户名需要 2-20 个字符' };
  }
  try {
    const data = await authFetch<{ user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    notifyAuthChanged();
    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : '注册失败' };
  }
}

/**
 * 邮箱/用户名密码登录
 */
export async function signIn(
  identifier: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const data = await authFetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    notifyAuthChanged();
    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : '登录失败' };
  }
}

/**
 * 登出
 */
export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } finally {
    notifyAuthChanged();
  }
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return null;
    const data = (await response.json()) as { user: AuthUser };
    return data.user;
  } catch {
    return null;
  }
}

/**
 * 检查用户名是否可用
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  try {
    const data = await authFetch<{ available: boolean }>(
      `/api/auth/check-username?username=${encodeURIComponent(username)}`
    );
    return data.available;
  } catch {
    return false;
  }
}
