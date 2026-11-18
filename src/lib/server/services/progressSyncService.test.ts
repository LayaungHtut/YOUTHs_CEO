import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import {
	generateIntegrationToken,
	authenticateSyncToken,
	revokeIntegrationToken,
	ingestProgressSync,
	importProgressFallback,
	SyncPayloadSchema,
	MAX_SYNC_TASKS,
	MAX_IMPORT_FILE_BYTES,
	MAX_IMPORT_CSV_ROWS,
	MAX_IMPORT_JSON_PAYLOADS
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

	describe('payload limits (SAST-03)', () => {
		const taskItem = {
			taskId: 'task-1',
			status: 'COMPLETED' as const,
			progressPercentage: 100
		};

		it('accepts a payload at the task-count limit', () => {
			const parsed = SyncPayloadSchema.safeParse({
				schemaVersion: 1,
				memberId: 'member-1',
				tasks: Array.from({ length: MAX_SYNC_TASKS }, () => taskItem),
				lastUpdatedAt: new Date().toISOString()
			});
			expect(parsed.success).toBe(true);
		});

		it('rejects a payload above the task-count limit', () => {
			const parsed = SyncPayloadSchema.safeParse({
				schemaVersion: 1,
				memberId: 'member-1',
				tasks: Array.from({ length: MAX_SYNC_TASKS + 1 }, () => taskItem),
				lastUpdatedAt: new Date().toISOString()
			});
			expect(parsed.success).toBe(false);
		});

		it('rejects over-long identifiers', () => {
			const parsed = SyncPayloadSchema.safeParse({
				schemaVersion: 1,
				memberId: 'm'.repeat(5000),
				tasks: [taskItem],
				lastUpdatedAt: new Date().toISOString()
			});
			expect(parsed.success).toBe(false);
		});

		it('rejects an import file above the size limit', async () => {
			const oversized = 'x'.repeat(MAX_IMPORT_FILE_BYTES + 1);
			const result = await importProgressFallback(oversized, 'csv', 'actor-1');
			expect(result.success).toBe(false);
			expect(result.totalProcessed).toBe(0);
			expect(result.errors[0]).toMatch(/import limit/i);
		});

		it('rejects a CSV with more rows than the limit', async () => {
			const rows = ['memberId,taskId,status,progressPercentage'];
			for (let i = 0; i < MAX_IMPORT_CSV_ROWS + 1; i++) {
				rows.push(`m-${i},t-${i},COMPLETED,100`);
			}
			const result = await importProgressFallback(rows.join('\n'), 'csv', 'actor-1');
			expect(result.success).toBe(false);
			expect(result.totalProcessed).toBe(0);
			expect(result.errors[0]).toMatch(/limit is/i);
		});

		it('rejects a JSON file with more payloads than the limit', async () => {
			const payloads = Array.from({ length: MAX_IMPORT_JSON_PAYLOADS + 1 }, () => ({
				schemaVersion: 1,
				memberId: 'member-1',
				tasks: [taskItem],
				lastUpdatedAt: new Date().toISOString()
			}));
			const result = await importProgressFallback(JSON.stringify(payloads), 'json', 'actor-1');
			expect(result.success).toBe(false);
			expect(result.totalProcessed).toBe(0);
			expect(result.errors[0]).toMatch(/limit is/i);
		});
	});
});
