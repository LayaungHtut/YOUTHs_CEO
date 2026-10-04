import { db } from '../db';
import type { PointsTransaction, PointsTransactionType } from '../db/types';
import { logAudit, AuditActions } from './auditService';

export async function grantInitialPoints(userId: string, creatorId?: string): Promise<PointsTransaction> {
	const setting = await db.getOrgSetting<{ value: number }>('points.starting_balance');
	const startingPoints = setting?.value ?? 100;
	const idempotencyKey = `initial_grant_${userId}`;

	const tx = await db.addPointsTransaction({
		userId,
		taskId: null,
		amount: startingPoints,
		transactionType: 'INITIAL_GRANT',
		description: `Initial organizational points grant (${startingPoints} points)`,
		idempotencyKey,
		createdBy: creatorId || null
	});

	await logAudit({
		actorId: creatorId,
		action: AuditActions.POINTS_AWARD,
		targetType: 'POINTS',
		targetId: userId,
		metadata: { amount: startingPoints, reason: 'INITIAL_GRANT' }
	});

	return tx;
}

export async function awardTaskCompletion(
	taskId: string,
	userId: string,
	completedAt: Date,
	deadline: Date,
	pointsReward = 10
): Promise<PointsTransaction | null> {
	const idempotencyKey = `task_complete_${taskId}`;

	// Check if already awarded
	const existing = await db.getPointsTransactionByIdempotencyKey(idempotencyKey);
	if (existing) {
		return existing; // idempotent no-op
	}

	const isOnTime = completedAt.getTime() <= deadline.getTime();
	let finalPoints = pointsReward;

	if (!isOnTime) {
		// If completed after deadline, standard policy grants 0 additional points
		finalPoints = 0;
	}

	if (finalPoints === 0) {
		return null;
	}

	const tx = await db.addPointsTransaction({
		userId,
		taskId,
		amount: finalPoints,
		transactionType: 'TASK_COMPLETION',
		description: `Completed task on-time (+${finalPoints} points)`,
		idempotencyKey,
		createdBy: null
	});

	await logAudit({
		actorId: null,
		action: AuditActions.POINTS_AWARD,
		targetType: 'TASK',
		targetId: taskId,
		metadata: { userId, amount: finalPoints, onTime: isOnTime }
	});

	return tx;
}

export async function penalizeOverdueTask(
	taskId: string,
	userId: string
): Promise<PointsTransaction | null> {
	const idempotencyKey = `task_overdue_${taskId}`;

	// Check if penalty already applied
	const existing = await db.getPointsTransactionByIdempotencyKey(idempotencyKey);
	if (existing) {
		return existing;
	}

	const penaltySetting = await db.getOrgSetting<{ value: number }>('points.overdue_penalty');
	const penalty = penaltySetting?.value ?? 10;
	const deduction = -Math.abs(penalty);

	// Check negative balance policy
	const currentBalance = await db.getUserPointsBalance(userId);
	const allowNegative = (await db.getOrgSetting<{ value: boolean }>('points.allow_negative'))?.value ?? false;

	let finalDeduction = deduction;
	if (!allowNegative && currentBalance + deduction < 0) {
		finalDeduction = -currentBalance; // floor at 0
	}

	if (finalDeduction === 0) {
		return null;
	}

	const tx = await db.addPointsTransaction({
		userId,
		taskId,
		amount: finalDeduction,
		transactionType: 'OVERDUE_PENALTY',
		description: `Missed weekly deadline (${finalDeduction} points)`,
		idempotencyKey,
		createdBy: null
	});

	await logAudit({
		actorId: null,
		action: AuditActions.POINTS_PENALTY,
		targetType: 'TASK',
		targetId: taskId,
		metadata: { userId, amount: finalDeduction }
	});

	return tx;
}

export async function adjustPointsManually(params: {
	userId: string;
	amount: number;
	reason: string;
	creatorId: string;
}): Promise<PointsTransaction> {
	const idempotencyKey = `manual_adj_${params.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

	const tx = await db.addPointsTransaction({
		userId: params.userId,
		taskId: null,
		amount: params.amount,
		transactionType: 'MANUAL_ADJUSTMENT',
		description: `Administrative adjustment by CEO: ${params.reason}`,
		idempotencyKey,
		createdBy: params.creatorId
	});

	await logAudit({
		actorId: params.creatorId,
		action: AuditActions.POINTS_ADJUST,
		targetType: 'POINTS',
		targetId: params.userId,
		metadata: { amount: params.amount, reason: params.reason }
	});

	return tx;
}

export async function getUserPointsSummary(userId: string) {
	const transactions = await db.getLedgerByUserId(userId);
	const balance = transactions.reduce((acc, curr) => acc + curr.amount, 0);
	const earned = transactions.filter((t) => t.amount > 0).reduce((acc, curr) => acc + curr.amount, 0);
	const deducted = transactions.filter((t) => t.amount < 0).reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

	return {
		balance,
		earned,
		deducted,
		transactions
	};
}
