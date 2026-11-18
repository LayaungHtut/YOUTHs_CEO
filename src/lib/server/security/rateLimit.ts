/**
 * SAST-05: in-process rate limiting for authentication endpoints.
 *
 * Keeps a fixed-window counter per key (client IP, and separately the submitted
 * account identifier) so repeated failed logins are throttled even when an edge
 * WAF or reverse proxy is absent. This is a per-instance control: behind several
 * app instances it limits each one, so keep an edge control as well.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Sweep expired buckets so the map cannot grow without bound. */
function sweep(now: number) {
	if (buckets.size < 1000) return;
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
}

export type RateLimitResult = {
	/** True when the caller is within the allowance. */
	allowed: boolean;
	/** Attempts left in the current window. */
	remaining: number;
	/** Seconds until the window resets. */
	retryAfterSeconds: number;
};

/**
 * Consumes one slot for `key`. Call only on attempts that should count
 * (e.g. failed logins) or on every attempt, depending on the endpoint.
 */
export function consumeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
	const now = Date.now();
	sweep(now);

	const existing = buckets.get(key);
	if (!existing || existing.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
	}

	existing.count += 1;
	const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
	return {
		allowed: existing.count <= limit,
		remaining: Math.max(0, limit - existing.count),
		retryAfterSeconds
	};
}

/** Reads the current state of `key` without consuming a slot. */
export function peekRateLimit(key: string, limit: number): RateLimitResult {
	const now = Date.now();
	const existing = buckets.get(key);
	if (!existing || existing.resetAt <= now) {
		return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
	}
	return {
		allowed: existing.count < limit,
		remaining: Math.max(0, limit - existing.count),
		retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
	};
}

/** Clears a key after a successful authentication. */
export function resetRateLimit(key: string) {
	buckets.delete(key);
}

/** Test helper: drop all state. */
export function clearAllRateLimits() {
	buckets.clear();
}
