// JWT 会话（edge 安全：不依赖 Node API，proxy/middleware 可复用）
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'autodoc_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 天

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  role: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 未配置，请检查环境变量');
  }
  const isPlaceholder =
    secret.length < 32 ||
    /请设置|你的|changeme|example|secret-key|\.\.\./.test(secret);
  if (isPlaceholder) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET 无效：生产环境必须使用 ≥32 字符的随机密钥（可执行 openssl rand -base64 48 生成）'
      );
    }
    console.warn('[session] ⚠️ JWT_SECRET 过短或为占位符，仅限本地开发使用');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    username: user.username,
    name: user.name ?? null,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      !payload.sub ||
      typeof payload.email !== 'string' ||
      typeof payload.username !== 'string'
    ) {
      return null;
    }
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      name: typeof payload.name === 'string' ? payload.name : null,
      role: typeof payload.role === 'string' ? payload.role : 'user',
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  // 显式设置 COOKIE_SECURE 可覆盖默认行为（如 Nginx 后尚未上 TLS 的内网部署）
  secure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DURATION_SECONDS,
};
