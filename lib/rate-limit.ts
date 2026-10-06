/**
 * Minimal in-memory token bucket rate limiter.
 *
 * NOTE: production should use Redis/Upstash (or similar) so limits are
 * shared across instances and survive restarts. This implementation keeps
 * per-process buckets and is only suitable for a single instance.
 */

type Bucket = {
  /** Tokens remaining in the current window. */
  tokens: number;
  /** Epoch ms when the current window expires. */
  resetAt: number;
};

const WINDOW_MS = 60_000; // 1 minute
const buckets = new Map<string, Bucket>();

/** Drop expired buckets once the map gets large, to bound memory growth. */
function prune(now: number): void {
  if (buckets.size < 10_000) return;
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) buckets.delete(key);
  });
}

/**
 * Returns true when the request is allowed, false when the bucket is empty.
 *
 * @param req  incoming request (used to derive the client IP)
 * @param key  route-scoped key, e.g. `billing:checkout`
 * @param limit  max requests per minute for key = ip + route
 */
export function checkRateLimit(
  req: Request,
  key: string,
  limit: number
): boolean {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const bucketKey = `${ip}:${key}`;
  const now = Date.now();

  let bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { tokens: limit, resetAt: now + WINDOW_MS };
  }

  if (bucket.tokens <= 0) {
    buckets.set(bucketKey, bucket);
    return false;
  }

  bucket.tokens -= 1;
  buckets.set(bucketKey, bucket);
  prune(now);
  return true;
}
