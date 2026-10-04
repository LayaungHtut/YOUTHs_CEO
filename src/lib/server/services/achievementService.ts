import { db } from '../db';
import type { Achievement } from '../db/types';
import { logAudit, AuditActions } from './auditService';
import { createNotification } from './notificationService';

export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
	const user = await db.getUserById(userId);
	if (!user) return [];

	const allAchievements = await db.getAchievements(true);
	const userAchievements = await db.getMemberAchievements(userId);
	const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

	const userTasks = await db.getTasks({ assignedTo: userId });
	const completedTasks = userTasks.filter((t) => t.status === 'COMPLETED');
	const overdueTasks = userTasks.filter((t) => t.status === 'OVERDUE');

	const newlyUnlocked: string[] = [];

	for (const ach of allAchievements) {
		if (unlockedIds.has(ach.id)) continue;

		let criteria: Record<string, unknown> = {};
		try {
			criteria = JSON.parse(ach.criteria);
		} catch {
			continue;
		}

		let eligible = false;
		let metadata = '';

		switch (criteria.type) {
			case 'COMPLETED_TASKS_COUNT': {
				const threshold = (criteria.threshold as number) || 1;
				if (completedTasks.length >= threshold) {
					eligible = true;
					metadata = JSON.stringify({ completedCount: completedTasks.length, threshold });
				}
				break;
			}
			case 'DEPARTMENT_TASKS_COUNT': {
				const threshold = (criteria.threshold as number) || 5;
				const deptTasks = completedTasks.filter((t) => t.departmentId === user.departmentId);
				if (deptTasks.length >= threshold) {
					eligible = true;
					metadata = JSON.stringify({ deptCount: deptTasks.length, threshold });
				}
				break;
			}
			case 'ON_TIME_RATE': {
				const threshold = (criteria.threshold as number) || 90;
				const minTasks = (criteria.minTasks as number) || 5;
				if (completedTasks.length >= minTasks) {
					const onTimeCount = completedTasks.filter(
						(t) => t.completedAt && t.completedAt.getTime() <= t.deadline.getTime()
					).length;
					const rate = (onTimeCount / completedTasks.length) * 100;
					if (rate >= threshold) {
						eligible = true;
						metadata = JSON.stringify({ rate: Math.round(rate), threshold, totalTasks: completedTasks.length });
					}
				}
				break;
			}
			case 'COMEBACK_AFTER_OVERDUE': {
				if (overdueTasks.length > 0 && completedTasks.length > 0) {
					// Check if any completed task has a deadline after an overdue task
					const latestOverdue = Math.max(...overdueTasks.map((t) => t.deadline.getTime()));
					const completedAfter = completedTasks.some(
						(t) => t.completedAt && t.completedAt.getTime() > latestOverdue
					);
					if (completedAfter) {
						eligible = true;
						metadata = JSON.stringify({ reason: 'Completed task following an overdue deadline' });
					}
				}
				break;
			}
			case 'CONSECUTIVE_ON_TIME_WEEKS': {
				const threshold = (criteria.threshold as number) || 4;
				// If member has at least threshold on-time completed tasks across distinct weeks
				const weekIds = new Set(
					completedTasks
						.filter((t) => t.completedAt && t.completedAt.getTime() <= t.deadline.getTime())
						.map((t) => t.weekId || t.deadline.toISOString().slice(0, 10))
				);
				if (weekIds.size >= threshold) {
					eligible = true;
					metadata = JSON.stringify({ consecutiveWeeks: weekIds.size, threshold });
				}
				break;
			}
		}

		if (eligible) {
			const unlocked = await db.unlockAchievement(userId, ach.id, metadata);
			if (unlocked) {
				newlyUnlocked.push(ach.name);

				await logAudit({
					actorId: null,
					action: AuditActions.ACHIEVEMENT_UNLOCK,
					targetType: 'ACHIEVEMENT',
					targetId: ach.id,
					metadata: { userId, achievementName: ach.name }
				});

				await createNotification({
					userId,
					type: 'ACHIEVEMENT_UNLOCKED',
					title: 'Achievement Unlocked!',
					message: `Congratulations! You have unlocked the "${ach.name}" achievement.`,
					referenceId: ach.id
				});
			}
		}
	}

	return newlyUnlocked;
}
