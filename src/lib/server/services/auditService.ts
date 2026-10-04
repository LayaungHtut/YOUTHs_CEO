import { db } from '../db';
import type { AuditLog } from '../db/types';

export const AuditActions = {
	AUTH_CEO_SETUP: 'AUTH_CEO_SETUP',
	AUTH_LOGIN: 'AUTH_LOGIN',
	AUTH_LOGOUT: 'AUTH_LOGOUT',
	USER_CREATE: 'USER_CREATE',
	USER_UPDATE: 'USER_UPDATE',
	USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
	USER_DEPARTMENT_CHANGE: 'USER_DEPARTMENT_CHANGE',
	USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
	USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',
	TASK_CREATE: 'TASK_CREATE',
	TASK_UPDATE: 'TASK_UPDATE',
	TASK_STATUS_CHANGE: 'TASK_STATUS_CHANGE',
	TASK_DELETE: 'TASK_DELETE',
	DISTRIBUTION_GENERATE: 'DISTRIBUTION_GENERATE',
	DISTRIBUTION_OVERRIDE: 'DISTRIBUTION_OVERRIDE',
	DISTRIBUTION_PUBLISH: 'DISTRIBUTION_PUBLISH',
	POINTS_AWARD: 'POINTS_AWARD',
	POINTS_PENALTY: 'POINTS_PENALTY',
	POINTS_ADJUST: 'POINTS_ADJUST',
	ACHIEVEMENT_UNLOCK: 'ACHIEVEMENT_UNLOCK',
	ACHIEVEMENT_CREATE: 'ACHIEVEMENT_CREATE',
	INTEGRATION_TOKEN_CREATE: 'INTEGRATION_TOKEN_CREATE',
	INTEGRATION_TOKEN_REVOKE: 'INTEGRATION_TOKEN_REVOKE',
	INTEGRATION_SYNC: 'INTEGRATION_SYNC',
	SETTINGS_UPDATE: 'SETTINGS_UPDATE'
} as const;

export type AuditActionType = (typeof AuditActions)[keyof typeof AuditActions];

export async function logAudit(params: {
	actorId?: string | null;
	action: AuditActionType | string;
	targetType: 'USER' | 'DEPARTMENT' | 'TASK' | 'DISTRIBUTION' | 'POINTS' | 'ACHIEVEMENT' | 'INTEGRATION' | 'SETTINGS';
	targetId?: string | null;
	metadata?: Record<string, unknown> | null;
	ipHash?: string | null;
}): Promise<AuditLog> {
	return await db.createAuditLog({
		actorId: params.actorId || null,
		action: params.action,
		targetType: params.targetType,
		targetId: params.targetId || null,
		metadata: params.metadata ? JSON.stringify(params.metadata) : null,
		ipHash: params.ipHash || null
	});
}

export async function getAuditTrail(filters?: {
	actorId?: string;
	action?: string;
	targetType?: string;
	limit?: number;
	offset?: number;
}) {
	return await db.getAuditLogs(filters);
}
