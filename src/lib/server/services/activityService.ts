import { db } from '../db';
import type { User, Department } from '../db/types';

export type ActivityType =
	| 'TASK'
	| 'MEMBER'
	| 'DEPARTMENT'
	| 'ACHIEVEMENT'
	| 'DISTRIBUTION'
	| 'INTEGRATION'
	| 'CHAT_ACTIVITY';

export interface ActivityFeedItem {
	id: string;
	activityType: ActivityType;
	title: string;
	description: string;
	actorName: string;
	actorRole: string;
	departmentId: string | null;
	departmentName: string | null;
	targetUserId: string | null;
	targetUserName: string | null;
	targetTaskId: string | null;
	timestamp: Date;
	badgeVariant: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan' | 'slate';
	metadata?: any;
}

export async function getOrganizationActivityFeed(filters?: {
	departmentId?: string;
	activityType?: ActivityType;
	memberId?: string;
	startDate?: Date;
	endDate?: Date;
	limit?: number;
	offset?: number;
}): Promise<{ items: ActivityFeedItem[]; totalCount: number }> {
	const allUsers = await db.getAllUsers();
	const userMap = new Map<string, User>(allUsers.map((u) => [u.id, u]));

	const allDepts = await db.getDepartments();
	const deptMap = new Map<string, Department>(allDepts.map((d) => [d.id, d]));

	const auditLogsResult = await db.getAuditLogs({ limit: 150 });
	const rawAuditLogs = Array.isArray(auditLogsResult) ? auditLogsResult : (auditLogsResult?.logs || []);

	const rawTaskEvents = await db.getAllTaskEvents({
		departmentId: filters?.departmentId,
		memberId: filters?.memberId,
		startDate: filters?.startDate,
		endDate: filters?.endDate
	});

	const notifications = await db.getAllNotifications();

	const items: ActivityFeedItem[] = [];

	// 1. Ingest Task Events
	for (const te of rawTaskEvents) {
		const task = te.task;
		const actor = te.actor;
		const assignee = task?.assignedTo ? userMap.get(task.assignedTo) : null;
		const dept = task?.departmentId ? deptMap.get(task.departmentId) : null;

		let title = `Task: ${task?.title || 'Unknown Task'}`;
		let desc = `Status changed to ${te.eventType}`;
		let badge: ActivityFeedItem['badgeVariant'] = 'indigo';

		if (te.eventType === 'CREATED') {
			title = `New Task Assigned: ${task?.title}`;
			desc = `Assigned to ${assignee?.fullName || 'member'} (Priority: ${task?.priority || 'MEDIUM'})`;
			badge = 'indigo';
		} else if (te.eventType === 'COMPLETED') {
			title = `Task Completed: ${task?.title}`;
			desc = `Completed by ${assignee?.fullName || 'member'}`;
			badge = 'emerald';
		} else if (te.eventType === 'OVERDUE') {
			title = `Task Overdue: ${task?.title}`;
			desc = `Task missed its deadline (${task?.deadline.toLocaleDateString()})`;
			badge = 'rose';
		} else if (te.eventType === 'REASSIGNED') {
			title = `Task Reassigned: ${task?.title}`;
			desc = te.reason || `Reassigned to ${assignee?.fullName || 'new member'}`;
			badge = 'amber';
		} else if (te.eventType === 'DEADLINE_CHANGED') {
			title = `Deadline Adjusted: ${task?.title}`;
			desc = te.reason || `Deadline updated to ${task?.deadline.toLocaleDateString()}`;
			badge = 'purple';
		} else if (te.eventType === 'CANCELLED') {
			title = `Task Cancelled: ${task?.title}`;
			desc = te.reason || 'Task was cancelled';
			badge = 'slate';
		} else if (te.eventType === 'REOPENED') {
			title = `Task Reopened: ${task?.title}`;
			desc = te.reason || 'Task was reopened by management';
			badge = 'amber';
		} else if (te.eventType === 'RESTORED') {
			title = `Task Restored: ${task?.title}`;
			desc = te.reason || 'Task was restored to pending';
			badge = 'cyan';
		}

		items.push({
			id: `te_${te.id}`,
			activityType: 'TASK',
			title,
			description: desc,
			actorName: actor?.fullName || (te.actorId === 'ai' ? 'AI Distribution' : 'System'),
			actorRole: te.actorRole || actor?.role || 'SYSTEM',
			departmentId: task?.departmentId || null,
			departmentName: dept?.name || null,
			targetUserId: task?.assignedTo || null,
			targetUserName: assignee?.fullName || null,
			targetTaskId: te.taskId,
			timestamp: te.createdAt,
			badgeVariant: badge,
			metadata: { eventType: te.eventType, oldValue: te.oldValue, newValue: te.newValue }
		});
	}

	// 2. Ingest Audit Logs for Member & Department Lifecycle
	for (const log of rawAuditLogs) {
		const actor = log.actorId ? userMap.get(log.actorId) : null;
		let meta: any = {};
		try {
			if (log.metadata) meta = JSON.parse(log.metadata);
		} catch {}

		if (log.action === 'USER_CREATE') {
			const targetUser = log.targetId ? userMap.get(log.targetId) : null;
			const dept = targetUser?.departmentId ? deptMap.get(targetUser.departmentId) : null;
			items.push({
				id: `audit_${log.id}`,
				activityType: 'MEMBER',
				title: 'New Member Account Created',
				description: `Account registered for ${targetUser?.fullName || meta.username || 'member'} (${targetUser?.role || 'MEMBER'})`,
				actorName: actor?.fullName || 'CEO',
				actorRole: actor?.role || 'CEO',
				departmentId: targetUser?.departmentId || null,
				departmentName: dept?.name || null,
				targetUserId: log.targetId || null,
				targetUserName: targetUser?.fullName || null,
				targetTaskId: null,
				timestamp: log.createdAt,
				badgeVariant: 'cyan'
			});
		} else if (log.action === 'ROLE_CHANGE' || log.action === 'ROLE_PROMOTED') {
			const targetUser = log.targetId ? userMap.get(log.targetId) : null;
			const dept = targetUser?.departmentId ? deptMap.get(targetUser.departmentId) : null;
			items.push({
				id: `audit_${log.id}`,
				activityType: 'MEMBER',
				title: 'Member Role Updated',
				description: `${targetUser?.fullName || 'User'} role updated: ${meta.newRole || 'Promoted'}`,
				actorName: actor?.fullName || 'CEO',
				actorRole: actor?.role || 'CEO',
				departmentId: targetUser?.departmentId || null,
				departmentName: dept?.name || null,
				targetUserId: log.targetId || null,
				targetUserName: targetUser?.fullName || null,
				targetTaskId: null,
				timestamp: log.createdAt,
				badgeVariant: 'purple'
			});
		} else if (log.action === 'DEPARTMENT_HEAD_CHANGE') {
			const dept = log.targetId ? deptMap.get(log.targetId) : null;
			const targetUser = meta.newHeadUserId ? userMap.get(meta.newHeadUserId) : null;
			items.push({
				id: `audit_${log.id}`,
				activityType: 'DEPARTMENT',
				title: `Department Head Assigned: ${dept?.name || 'Department'}`,
				description: `${targetUser?.fullName || 'Member'} designated as Department Head`,
				actorName: actor?.fullName || 'CEO',
				actorRole: actor?.role || 'CEO',
				departmentId: dept?.id || null,
				departmentName: dept?.name || null,
				targetUserId: meta.newHeadUserId || null,
				targetUserName: targetUser?.fullName || null,
				targetTaskId: null,
				timestamp: log.createdAt,
				badgeVariant: 'amber'
			});
		} else if (log.action === 'DISTRIBUTION_PUBLISH') {
			items.push({
				id: `audit_${log.id}`,
				activityType: 'DISTRIBUTION',
				title: 'Weekly Task Distribution Cycle Published',
				description: `${meta.tasksPublished || 'All'} assignments officially published to organizational tasks table.`,
				actorName: actor?.fullName || 'CEO',
				actorRole: actor?.role || 'CEO',
				departmentId: null,
				departmentName: null,
				targetUserId: null,
				targetUserName: null,
				targetTaskId: null,
				timestamp: log.createdAt,
				badgeVariant: 'emerald'
			});
		} else if (log.action === 'PROGRESS_SYNC') {
			const targetUser = log.targetId ? userMap.get(log.targetId) : null;
			items.push({
				id: `audit_${log.id}`,
				activityType: 'INTEGRATION',
				title: 'Member Neon Database Synchronized',
				description: `Verified progress snapshot received from ${targetUser?.fullName || 'member'}'s personal Neon DB.`,
				actorName: targetUser?.fullName || 'Member DB Agent',
				actorRole: 'INTEGRATION',
				departmentId: targetUser?.departmentId || null,
				departmentName: null,
				targetUserId: log.targetId || null,
				targetUserName: targetUser?.fullName || null,
				targetTaskId: null,
				timestamp: log.createdAt,
				badgeVariant: 'cyan'
			});
		}
	}

	// 3. Ingest Achievements
	const allUserAchievements = await db.getAllMemberAchievements();
	const allAchievements = await db.getAchievements();
	const achievementMap = new Map(allAchievements.map((a) => [a.id, a]));

	for (const ua of allUserAchievements) {
		const targetUser = userMap.get(ua.userId);
		const ach = achievementMap.get(ua.achievementId);
		const dept = targetUser?.departmentId ? deptMap.get(targetUser.departmentId) : null;

		items.push({
			id: `ach_${ua.id}`,
			activityType: 'ACHIEVEMENT',
			title: `Achievement Unlocked: ${ach?.name || 'Honor Award'}`,
			description: `${targetUser?.fullName || 'Member'} unlocked badge: "${ach?.description || ''}"`,
			actorName: 'Achievement System',
			actorRole: 'SYSTEM',
			departmentId: targetUser?.departmentId || null,
			departmentName: dept?.name || null,
			targetUserId: ua.userId,
			targetUserName: targetUser?.fullName || null,
			targetTaskId: null,
			timestamp: ua.unlockedAt,
			badgeVariant: 'amber'
		});
	}

	// 4. Ingest Private Chat Indicators (STRICT PRIVACY: NEVER EXPOSE MESSAGE CONTENT)
	for (const notif of notifications) {
		if (notif.type === 'MESSAGE') {
			const targetUser = userMap.get(notif.userId);
			items.push({
				id: `chat_act_${notif.id}`,
				activityType: 'CHAT_ACTIVITY',
				title: 'Direct Message Activity',
				description: `Private message exchanged with ${targetUser?.fullName || 'a member'}. (Content hidden for privacy)`,
				actorName: 'Chat System',
				actorRole: 'COMMUNICATIONS',
				departmentId: targetUser?.departmentId || null,
				departmentName: null,
				targetUserId: notif.userId,
				targetUserName: targetUser?.fullName || null,
				targetTaskId: null,
				timestamp: notif.createdAt,
				badgeVariant: 'slate'
			});
		}
	}

	// Filter
	let filtered = items;
	if (filters?.departmentId) {
		filtered = filtered.filter((i) => i.departmentId === filters.departmentId);
	}
	if (filters?.activityType) {
		filtered = filtered.filter((i) => i.activityType === filters.activityType);
	}
	if (filters?.memberId) {
		filtered = filtered.filter(
			(i) => i.targetUserId === filters.memberId || i.actorName === filters.memberId
		);
	}
	if (filters?.startDate) {
		filtered = filtered.filter((i) => i.timestamp >= filters.startDate!);
	}
	if (filters?.endDate) {
		filtered = filtered.filter((i) => i.timestamp <= filters.endDate!);
	}

	// Sort newest first
	filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

	const totalCount = filtered.length;
	const offset = filters?.offset || 0;
	const limit = filters?.limit || 50;
	const paginated = filtered.slice(offset, offset + limit);

	return { items: paginated, totalCount };
}
