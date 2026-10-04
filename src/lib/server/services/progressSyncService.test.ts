import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import {
	generateIntegrationToken,
	authenticateSyncToken,
	revokeIntegrationToken,
	ingestProgressSync,
	importProgressFallback
} from './progressSyncService';

describe('Progress Synchronization Service', () => {
	beforeEach(() => {
		db.resetForTesting();
	});

	it('generates, validates, and revokes member integration tokens', async () => {
		const user = await db.createUser({
			fullName: 'Sync Member',
			username: 'syncmember',
			email: 'sync@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			accountStatus: 'ACTIVE'
		});

		const { token, prefix } = await generateIntegrationToken(user.id);
		expect(token.startsWith('yt_sync_')).toBe(true);
		expect(prefix.startsWith('yt_sync_')).toBe(true);

		// Token verification
		const authenticatedUserId = await authenticateSyncToken(token);
		expect(authenticatedUserId).toBe(user.id);

		// Token revocation
		await revokeIntegrationToken(user.id);
		const postRevokeAuth = await authenticateSyncToken(token);
		expect(postRevokeAuth).toBeNull();
	});

	it('ingests valid progress sync payloads and updates task status', async () => {
		const user = await db.createUser({
			fullName: 'Sync Tester',
			username: 'synctest',
			email: 'test@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			departmentId: 'dept-software-dev',
			accountStatus: 'ACTIVE'
		});

		const task = await db.createTask({
			title: 'API Module Test',
			description: 'Build test',
			createdBy: 'ceo-1',
			assignedTo: user.id,
			departmentId: 'dept-software-dev',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000),
			status: 'PENDING',
			source: 'MANUAL'
		});

		const payload = {
			schemaVersion: 1 as const,
			memberId: user.id,
			weekId: null,
			tasks: [
				{
					taskId: task.id,
					status: 'IN_PROGRESS' as const,
					progressPercentage: 60,
					completedAt: null
				}
			],
			lastUpdatedAt: new Date().toISOString()
		};

		const result = await ingestProgressSync(user.id, payload);
		expect(result.success).toBe(true);
		expect(result.tasksUpdated).toBe(1);

		const updatedTask = await db.getTaskById(task.id);
		expect(updatedTask?.status).toBe('IN_PROGRESS');

		const snapshot = await db.getLatestSnapshot(user.id);
		expect(snapshot).not.toBeNull();
		expect(snapshot?.tasksAssigned).toBe(1);
	});

	it('rejects tampered payloads attempting to modify other members tasks', async () => {
		const userA = await db.createUser({
			fullName: 'User A',
			username: 'userA',
			email: 'a@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			accountStatus: 'ACTIVE'
		});

		const userB = await db.createUser({
			fullName: 'User B',
			username: 'userB',
			email: 'b@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			accountStatus: 'ACTIVE'
		});

		const taskB = await db.createTask({
			title: 'Task for B',
			description: 'Only B can update',
			createdBy: 'ceo-1',
			assignedTo: userB.id,
			departmentId: 'dept-software-dev',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000),
			status: 'PENDING'
		});

		// User A tries to modify User B's task
		const maliciousPayload = {
			schemaVersion: 1 as const,
			memberId: userA.id,
			tasks: [
				{
					taskId: taskB.id,
					status: 'COMPLETED' as const,
					progressPercentage: 100
				}
			],
			lastUpdatedAt: new Date().toISOString()
		};

		const result = await ingestProgressSync(userA.id, maliciousPayload);
		expect(result.tasksUpdated).toBe(0); // Ignored due to ownership mismatch

		const untouchedTask = await db.getTaskById(taskB.id);
		expect(untouchedTask?.status).toBe('PENDING'); // Not changed
	});

	it('supports fallback CSV progress import', async () => {
		const user = await db.createUser({
			fullName: 'CSV User',
			username: 'csvuser',
			email: 'csv@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			accountStatus: 'ACTIVE'
		});

		const task = await db.createTask({
			title: 'CSV Task',
			description: 'Test CSV update',
			createdBy: 'ceo-1',
			assignedTo: user.id,
			departmentId: 'dept-software-dev',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000),
			status: 'PENDING'
		});

		const csvContent = `memberId,taskId,status,progressPercentage\n${user.id},${task.id},IN_PROGRESS,50`;
		const result = await importProgressFallback(csvContent, 'csv', 'ceo-1');

		expect(result.success).toBe(true);
		expect(result.totalProcessed).toBe(1);

		const updatedTask = await db.getTaskById(task.id);
		expect(updatedTask?.status).toBe('IN_PROGRESS');
	});
});
