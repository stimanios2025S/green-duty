/**
 * Simple in-memory rate limiter for API routes.
 * Production: use Redis-backed rate limiting instead.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check and increment rate limit for a given key.
 * @param key — unique identifier (e.g. "login:192.168.1.1")
 * @param maxAttempts — max requests allowed in the window
 * @param windowMs — time window in milliseconds
 */
export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60_000): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetMs: windowMs };
  }

  entry.count++;

  if (entry.count > maxAttempts) {
    return { allowed: false, remaining: 0, resetMs: entry.resetAt - now };
  }

  return { allowed: true, remaining: maxAttempts - entry.count, resetMs: entry.resetAt - now };
}

/** Get client IP from request headers */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
