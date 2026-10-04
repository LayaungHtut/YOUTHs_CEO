import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import {
	grantInitialPoints,
	awardTaskCompletion,
	penalizeOverdueTask,
	adjustPointsManually,
	getUserPointsSummary
} from './pointsService';

describe('Points Service', () => {
	const testUserId = 'test-user-points-1';
	const testTaskId = 'test-task-points-1';

	beforeEach(() => {
		db.resetForTesting();
	});

	it('grants initial points correctly (default 100)', async () => {
		const tx = await grantInitialPoints(testUserId);
		expect(tx.amount).toBe(100);
		expect(tx.transactionType).toBe('INITIAL_GRANT');

		const summary = await getUserPointsSummary(testUserId);
		expect(summary.balance).toBe(100);
		expect(summary.earned).toBe(100);
		expect(summary.deducted).toBe(0);
	});

	it('awards task completion points idempotently', async () => {
		await grantInitialPoints(testUserId);

		const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24);
		const completedAt = new Date();

		const tx1 = await awardTaskCompletion(testTaskId, testUserId, completedAt, deadline, 10);
		expect(tx1).not.toBeNull();
		expect(tx1?.amount).toBe(10);

		const balance1 = await db.getUserPointsBalance(testUserId);
		expect(balance1).toBe(110);

		// Second call with same task ID must be idempotent (no duplicate points)
		const tx2 = await awardTaskCompletion(testTaskId, testUserId, completedAt, deadline, 10);
		expect(tx2?.id).toBe(tx1?.id);

		const balance2 = await db.getUserPointsBalance(testUserId);
		expect(balance2).toBe(110); // Still 110, not 120
	});

	it('applies overdue penalty idempotently', async () => {
		await grantInitialPoints(testUserId);

		const penalty1 = await penalizeOverdueTask(testTaskId, testUserId);
		expect(penalty1).not.toBeNull();
		expect(penalty1?.amount).toBe(-10);

		const balance1 = await db.getUserPointsBalance(testUserId);
		expect(balance1).toBe(90);

		// Duplicate penalty attempt should be ignored
		const penalty2 = await penalizeOverdueTask(testTaskId, testUserId);
		expect(penalty2?.id).toBe(penalty1?.id);

		const balance2 = await db.getUserPointsBalance(testUserId);
		expect(balance2).toBe(90);
	});

	it('supports manual points adjustment with audit trail', async () => {
		await grantInitialPoints(testUserId);

		const adj = await adjustPointsManually({
			userId: testUserId,
			amount: 25,
			reason: 'Outstanding leadership in community event',
			creatorId: 'ceo-user-1'
		});

		expect(adj.amount).toBe(25);
		const balance = await db.getUserPointsBalance(testUserId);
		expect(balance).toBe(125);
	});
});
