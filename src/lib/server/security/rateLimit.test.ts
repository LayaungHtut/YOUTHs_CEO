import { describe, it, expect, beforeEach } from 'vitest';
import { consumeRateLimit, peekRateLimit, resetRateLimit, clearAllRateLimits } from './rateLimit';

describe('Authentication rate limiting (SAST-05)', () => {
	beforeEach(() => {
		clearAllRateLimits();
	});

	it('allows attempts up to the limit and blocks the next one', () => {
		for (let i = 0; i < 5; i++) {
			expect(consumeRateLimit('ip:1.2.3.4', 5, 60_000).allowed).toBe(true);
		}
		expect(consumeRateLimit('ip:1.2.3.4', 5, 60_000).allowed).toBe(false);
		expect(peekRateLimit('ip:1.2.3.4', 5).allowed).toBe(false);
	});

	it('keeps separate counters per key', () => {
		for (let i = 0; i < 5; i++) consumeRateLimit('ip:1.1.1.1', 5, 60_000);
		expect(peekRateLimit('ip:1.1.1.1', 5).allowed).toBe(false);
		expect(peekRateLimit('ip:2.2.2.2', 5).allowed).toBe(true);
	});

	it('clears the counter after a successful authentication', () => {
		for (let i = 0; i < 5; i++) consumeRateLimit('id:ceo', 5, 60_000);
		expect(peekRateLimit('id:ceo', 5).allowed).toBe(false);
		resetRateLimit('id:ceo');
		expect(peekRateLimit('id:ceo', 5).allowed).toBe(true);
	});

	it('releases the block once the window expires', async () => {
		consumeRateLimit('ip:3.3.3.3', 1, 20);
		expect(peekRateLimit('ip:3.3.3.3', 1).allowed).toBe(false);
		await new Promise((resolve) => setTimeout(resolve, 40));
		expect(peekRateLimit('ip:3.3.3.3', 1).allowed).toBe(true);
	});

	it('reports a positive retry-after while blocked', () => {
		consumeRateLimit('ip:4.4.4.4', 1, 60_000);
		const blocked = consumeRateLimit('ip:4.4.4.4', 1, 60_000);
		expect(blocked.allowed).toBe(false);
		expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
	});
});
