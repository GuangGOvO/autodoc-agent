// JWT 会话（edge 安全：不依赖 Node API，proxy/middleware 可复用）
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'autodoc_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 天

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  name?: string | null;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 未配置，请检查环境变量');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    username: user.username,
    name: user.name ?? null,
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
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DURATION_SECONDS,
};
