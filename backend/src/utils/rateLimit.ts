import { Request, Response, NextFunction } from 'express';

// Counts failures (wrong passwords, wrong codes) per key inside a time
// window. Unlike rateLimit below, successful attempts don't count, and a
// success can clear the slate.
export const createAttemptTracker = (opts: { windowMs: number; max: number }) => {
  const fails = new Map<string, { count: number; resetAt: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of fails) if (v.resetAt <= now) fails.delete(k);
  }, opts.windowMs).unref();

  const live = (key: string) => {
    const entry = fails.get(key);
    if (entry && entry.resetAt <= Date.now()) {
      fails.delete(key);
      return undefined;
    }
    return entry;
  };

  return {
    // Seconds until the key may try again, or 0 if it isn't blocked.
    blockedFor(key: string): number {
      const entry = live(key);
      return entry && entry.count >= opts.max ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 0;
    },
    // Records a failure and returns how many there have been in this window.
    fail(key: string): number {
      let entry = live(key);
      if (!entry) {
        entry = { count: 0, resetAt: Date.now() + opts.windowMs };
        fails.set(key, entry);
      }
      return ++entry.count;
    },
    reset(key: string): void {
      fails.delete(key);
    }
  };
};

export const minutesLabel = (seconds: number): string => {
  const m = Math.max(1, Math.ceil(seconds / 60));
  return `${m} minute${m === 1 ? '' : 's'}`;
};

// Small in-memory fixed-window limiter, keyed per request (IP, user, ...).
// Good enough for a single server process; counts reset on restart.
export const rateLimit = (opts: {
  windowMs: number;
  max: number;
  key: (req: Request) => string;
  message: string;
}) => {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Drop expired windows now and then so the map can't grow forever.
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, opts.windowMs).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const k = opts.key(req);
    let entry = hits.get(k);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(k, entry);
    }
    entry.count++;
    if (entry.count > opts.max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      res.status(429).json({ success: false, message: opts.message });
      return;
    }
    next();
  };
};
