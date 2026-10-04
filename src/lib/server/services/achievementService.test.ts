import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { checkAndUnlockAchievements } from './achievementService';

describe('Achievement Service', () => {
	beforeEach(() => {
		db.resetForTesting();
	});

	it('unlocks "First Task" achievement upon completing first task', async () => {
		const user = await db.createUser({
			fullName: 'Acheiver One',
			username: 'achiever1',
			email: 'achiever@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			accountStatus: 'ACTIVE'
		});

		// Before completion
		const before = await db.getMemberAchievements(user.id);
		expect(before.length).toBe(0);

		// Create and complete task
		await db.createTask({
			title: 'First Assignment',
			description: 'Description',
			createdBy: 'ceo-1',
			assignedTo: user.id,
			departmentId: 'dept-software-dev',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000),
			status: 'COMPLETED',
			completedAt: new Date()
		});

		const unlocked = await checkAndUnlockAchievements(user.id);
		expect(unlocked).toContain('First Task');

		const after = await db.getMemberAchievements(user.id);
		expect(after.length).toBe(1);
		expect(after[0].achievementId).toBe('ach-first-task');

		// Idempotency check: running again shouldn't duplicate
		const reCheck = await checkAndUnlockAchievements(user.id);
		expect(reCheck.length).toBe(0);
	});
});
