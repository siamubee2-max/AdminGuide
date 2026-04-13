import { Context, Next } from "hono";

/**
 * Admin API Key Authentication Middleware
 *
 * Protects admin endpoints (leads, subscribers list, stats) by requiring
 * a valid API key in the Authorization header.
 *
 * Usage: adminAuth middleware on admin-only routes
 * Header: Authorization: Bearer <ADMIN_API_KEY>
 */

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * App API Key Authentication Middleware
 *
 * Protects AI endpoints from unauthorized access by requiring
 * a valid app key in the X-App-Key header. This prevents external
 * abuse of expensive AI API calls.
 */

const APP_API_KEY = process.env.APP_API_KEY;

export async function appKeyAuth(c: Context, next: Next) {
  if (!APP_API_KEY) {
    // If no key configured, allow requests (development mode)
    await next();
    return;
  }

  const appKey = c.req.header("X-App-Key");

  if (!appKey || appKey !== APP_API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
}

export async function adminAuth(c: Context, next: Next) {
  // If no ADMIN_API_KEY is configured, block all admin access in production
  if (!ADMIN_API_KEY) {
    console.warn(
      "[Auth] ADMIN_API_KEY not configured — admin endpoints are disabled"
    );
    return c.json(
      {
        error: "Admin access is not configured. Set ADMIN_API_KEY in environment.",
      },
      503
    );
  }

  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      { error: "Missing or invalid Authorization header. Use: Bearer <api_key>" },
      401
    );
  }

  const token = authHeader.replace("Bearer ", "").trim();

  if (token !== ADMIN_API_KEY) {
    console.warn("[Auth] Invalid admin API key attempt");
    return c.json({ error: "Invalid API key" }, 403);
  }

  await next();
}

/**
 * Rate Limiting Middleware
 *
 * Simple in-memory rate limiter to prevent abuse on public endpoints.
 * In production, use Redis for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}) {
  const { windowMs, maxRequests, keyPrefix = "rl" } = options;

  return async (c: Context, next: Next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      return c.json(
        {
          error: "Trop de requêtes. Veuillez réessayer plus tard.",
          retryAfter,
        },
        429
      );
    }

    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Remaining", String(maxRequests - entry.count));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    await next();
  };
}
