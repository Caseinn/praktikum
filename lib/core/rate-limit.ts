import { redis } from "@/lib/core/redis";

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

const requireRedis = process.env.NODE_ENV === "production" && !redis;

export function getRateLimitKey(
  req: Request,
  scope: string,
  identifier?: string | null
): string {
  const trustProxy = process.env.TRUST_PROXY === "true";
  const forwardedFor = trustProxy ? req.headers.get("x-forwarded-for") : null;
  const ip = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  const parts = [scope, identifier ?? "", ip].filter(Boolean);
  return parts.join(":");
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<{ ok: boolean; retryAfter: number }> {
  const windowSeconds = Math.ceil(options.windowMs / 1000);

  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    if (count > options.max) {
      const ttl = await redis.ttl(key);
      return { ok: false, retryAfter: ttl && ttl > 0 ? ttl : windowSeconds };
    }
    return { ok: true, retryAfter: 0 };
  }

  if (requireRedis) {
    return { ok: false, retryAfter: windowSeconds };
  }

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (entry.count >= options.max) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }

  entry.count += 1;
  store.set(key, entry);
  return { ok: true, retryAfter: 0 };
}
