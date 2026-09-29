import type { NextFunction, Request, Response } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function cleanup() {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

setInterval(cleanup, 5 * 60 * 1000).unref();

export function rateLimit(options: { windowMs: number; max: number; keyPrefix: string; keyFn?: (req: Request) => string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identity = options.keyFn ? options.keyFn(req) : (req.ip || req.socket.remoteAddress || 'unknown');
    const key = `${options.keyPrefix}:${identity}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (current.count >= options.max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Trop de requêtes. Réessayez plus tard.' });
    }

    current.count += 1;
    return next();
  };
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  return next();
}
