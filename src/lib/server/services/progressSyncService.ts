import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '../db';
import type { MemberProgressSnapshot, TaskStatus } from '../db/types';
import { logAudit, AuditActions } from './auditService';
import { updateTaskStatus } from './taskService';

// Schema for Progress Synchronization Contract v1
export const ProgressTaskItemSchema = z.object({
	taskId: z.string().min(1),
	status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']),
	progressPercentage: z.number().min(0).max(100),
	completedAt: z.string().nullable().optional(),
	updatedAt: z.string().optional()
});

export const SyncPayloadSchema = z.object({
	schemaVersion: z.literal(1),
	memberId: z.string().min(1),
	weekId: z.string().nullable().optional(),
	tasks: z.array(ProgressTaskItemSchema),
	lastUpdatedAt: z.string()
});

export type SyncPayload = z.infer<typeof SyncPayloadSchema>;

/**
 * Generates an integration token for a member and saves its SHA-256 hash
 */
export async function generateIntegrationToken(userId: string, actorId?: string): Promise<{ token: string; prefix: string }> {
	const rawRandom = crypto.randomBytes(24).toString('hex');
	const token = `yt_sync_${rawRandom}`;
	const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
	const prefix = `yt_sync_${rawRandom.slice(0, 6)}...`;

	await db.upsertConnection({
		userId,
		connectionType: 'REST_SYNC',
		integrationStatus: 'CONFIGURED',
		integrationToken: prefix,
		tokenHash,
		permissions: JSON.stringify(['read:progress']),
		lastSyncAt: null,
		lastSyncError: null
	});

	await logAudit({
		actorId: actorId || userId,
		action: AuditActions.INTEGRATION_TOKEN_CREATE,
		targetType: 'INTEGRATION',
		targetId: userId,
		metadata: { prefix }
	});

	return { token, prefix };
}

/**
 * Revokes an integration token for a member
 */
export async function revokeIntegrationToken(userId: string, actorId?: string): Promise<boolean> {
	const success = await db.revokeConnection(userId);
	if (success) {
		await logAudit({
			actorId: actorId || userId,
			action: AuditActions.INTEGRATION_TOKEN_REVOKE,
			targetType: 'INTEGRATION',
			targetId: userId
		});
	}
	return success;
}

/**
 * Verifies a Bearer token from a sync request
 */
export async function authenticateSyncToken(token: string): Promise<string | null> {
	if (!token || !token.startsWith('yt_sync_')) return null;
	const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
	const conn = await db.getConnectionByTokenHash(tokenHash);
	if (!conn || conn.integrationStatus === 'REVOKED') return null;
	return conn.userId;
}

/**
 * Ingests a validated progress synchronization payload
 */
export async function ingestProgressSync(
	authenticatedMemberId: string,
	payload: SyncPayload
): Promise<{ success: boolean; snapshot: MemberProgressSnapshot; tasksUpdated: number }> {
	// Security check: authenticated member must match payload memberId
	if (authenticatedMemberId !== payload.memberId) {
		throw new Error('Unauthorized: Bearer token does not match payload member ID');
	}

	const user = await db.getUserById(payload.memberId);
	if (!user) throw new Error('Member not found');

	let tasksUpdated = 0;
	let completedCount = 0;
	let overdueCount = 0;

	// Ingest each reported task progress with strict ownership validation
	for (const taskUpdate of payload.tasks) {
		const existingTask = await db.getTaskById(taskUpdate.taskId);
		if (!existingTask) {
			console.warn(`Sync warning: Task ${taskUpdate.taskId} does not exist in CEO database. Skipping.`);
			continue;
		}

		// Security constraint: Member can only report progress on tasks assigned to them
		if (existingTask.assignedTo !== authenticatedMemberId) {
			console.warn(`Security violation: Member ${authenticatedMemberId} attempted to sync task assigned to ${existingTask.assignedTo}`);
			continue;
		}

		// Update status if transitioned
		if (existingTask.status !== taskUpdate.status) {
			await updateTaskStatus({
				taskId: existingTask.id,
				newStatus: taskUpdate.status as TaskStatus,
				actorId: authenticatedMemberId,
				notes: `Synchronized via member Neon database (${taskUpdate.progressPercentage}%)`
			});
			tasksUpdated++;
		}

		if (taskUpdate.status === 'COMPLETED') completedCount++;
		if (taskUpdate.status === 'OVERDUE') overdueCount++;
	}

	const totalReported = payload.tasks.length;
	const completionRate = totalReported > 0 ? Math.round((completedCount / totalReported) * 100) : 0;
	const pointsBalance = await db.getUserPointsBalance(authenticatedMemberId);

	// Record progress snapshot
	const snapshot = await db.upsertSnapshot({
		userId: authenticatedMemberId,
		weekId: payload.weekId || null,
		tasksAssigned: totalReported,
		tasksCompleted: completedCount,
		tasksOverdue: overdueCount,
		completionPercentage: completionRate,
		pointsBalance,
		source: 'API_SYNC',
		lastSyncedAt: new Date()
	});

	// Update connection record
	const conn = await db.getConnectionByUserId(authenticatedMemberId);
	if (conn) {
		conn.lastSyncAt = new Date();
		conn.lastSyncError = null;
		conn.integrationStatus = 'CONNECTED';
		await db.upsertConnection(conn);
	}

	await logAudit({
		actorId: authenticatedMemberId,
		action: AuditActions.INTEGRATION_SYNC,
		targetType: 'INTEGRATION',
		targetId: authenticatedMemberId,
		metadata: { tasksUpdated, completionRate, source: 'API_SYNC' }
	});

	return { success: true, snapshot, tasksUpdated };
}

/**
 * Fallback CSV / JSON progress parser for manual upload
 */
export async function importProgressFallback(
	fileContent: string,
	fileType: 'csv' | 'json',
	actorId: string
): Promise<{ success: boolean; totalProcessed: number; errors: string[] }> {
	const errors: string[] = [];
	let count = 0;

	if (fileType === 'json') {
		try {
			const parsed = JSON.parse(fileContent);
			const items = Array.isArray(parsed) ? parsed : [parsed];
			for (const item of items) {
				const validated = SyncPayloadSchema.safeParse(item);
				if (!validated.success) {
					errors.push(`Invalid JSON payload: ${validated.error.message}`);
					continue;
				}
				await ingestProgressSync(validated.data.memberId, validated.data);
				count++;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			errors.push(`JSON parsing error: ${message}`);
		}
	} else {
		// CSV format: memberId,taskId,status,progressPercentage
		const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
		if (lines.length <= 1) {
			errors.push('Empty or header-only CSV file');
			return { success: false, totalProcessed: 0, errors };
		}

		// Skip header line
		for (let i = 1; i < lines.length; i++) {
			const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
			if (cols.length < 4) {
				errors.push(`Line ${i + 1}: insufficient columns (expected memberId,taskId,status,progressPercentage)`);
				continue;
			}

			const [memberId, taskId, status, progressStr] = cols;
			const progressPercentage = parseInt(progressStr, 10) || 0;

			const existingTask = await db.getTaskById(taskId);
			if (!existingTask) {
				errors.push(`Line ${i + 1}: Task ID "${taskId}" not found in CEO database`);
				continue;
			}

			if (existingTask.assignedTo !== memberId) {
				errors.push(`Line ${i + 1}: Task "${taskId}" is not assigned to member "${memberId}"`);
				continue;
			}

			if (['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].includes(status)) {
				await updateTaskStatus({
					taskId,
					newStatus: status as TaskStatus,
					actorId,
					notes: `Manual CSV import (${progressPercentage}%)`
				});
				count++;
			} else {
				errors.push(`Line ${i + 1}: Invalid status "${status}"`);
			}
		}
	}

	return { success: errors.length === 0, totalProcessed: count, errors };
}
