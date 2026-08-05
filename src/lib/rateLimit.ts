// 简单的进程内固定窗口限流器
// 自托管单实例场景够用；若未来横向扩容到多实例，需替换为 Redis 等共享存储。
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

// 定期清理过期窗口，避免内存无限增长（unref 不阻塞进程退出）
const CLEANUP_INTERVAL_MS = 60_000;
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS);
cleanup.unref?.();

export interface RateLimitOptions {
  /** 限流键，如 IP 或用户 ID */
  key: string;
  /** 窗口内允许的最大请求数 */
  limit: number;
  /** 窗口时长（毫秒），默认 60 秒 */
  windowMs?: number;
  /** 命名空间前缀，区分不同接口的计数器 */
  scope?: string;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  retryAfterSec: number;
}

/** 对 key 计数一次并返回是否超限（固定窗口，简单可靠） */
export function hitRateLimit(options: RateLimitOptions): RateLimitResult {
  const windowMs = options.windowMs ?? 60_000;
  const fullKey = `${options.scope ?? 'rl'}:${options.key}`;
  const now = Date.now();

  let window = buckets.get(fullKey);
  if (!window || window.resetAt <= now) {
    window = { count: 0, resetAt: now + windowMs };
    buckets.set(fullKey, window);
  }
  window.count += 1;

  return {
    limited: window.count > options.limit,
    remaining: Math.max(0, options.limit - window.count),
    retryAfterSec: Math.max(1, Math.ceil((window.resetAt - now) / 1000)),
  };
}

/** 从请求头提取客户端 IP（兼容 Nginx 反代） */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

/** 构造统一的 429 响应 */
export function rateLimitedResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: `请求过于频繁，请在 ${retryAfterSec} 秒后重试` },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    }
  );
}
