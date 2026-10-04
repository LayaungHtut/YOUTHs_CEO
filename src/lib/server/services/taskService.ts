import { db } from '../db';
import type { Task, NewTask, TaskStatus, TaskPriority, TaskSource } from '../db/types';
import { logAudit, AuditActions } from './auditService';
import { awardTaskCompletion, penalizeOverdueTask } from './pointsService';
import { checkAndUnlockAchievements } from './achievementService';
import { createNotification } from './notificationService';

async function resolveActor(actorId: string): Promise<{
	actorId: string;
	actorRole: string;
	source: 'CEO' | 'HEAD' | 'MEMBER' | 'AI' | 'SYSTEM';
}> {
	if (actorId === 'system' || actorId === 'SYSTEM') {
		return { actorId: 'system', actorRole: 'SYSTEM', source: 'SYSTEM' };
	}
	if (actorId === 'ai' || actorId === 'AI') {
		return { actorId: 'ai', actorRole: 'AI', source: 'AI' };
	}
	const user = await db.getUserById(actorId);
	if (!user) {
		return { actorId, actorRole: 'SYSTEM', source: 'SYSTEM' };
	}
	return {
		actorId: user.id,
		actorRole: user.role,
		source: (user.role as any) || 'MEMBER'
	};
}

export async function createManualTask(params: {
	title: string;
	description: string;
	createdBy: string;
	assignedToIds: string[]; // Supports single or multiple assignees via duplication
	departmentId: string;
	priority?: TaskPriority;
	startDate: Date;
	deadline: Date;
	estimatedEffort?: string;
	pointsReward?: number;
	weekId?: string | null;
	source?: TaskSource;
}): Promise<Task[]> {
	const createdTasks: Task[] = [];
	const actorInfo = await resolveActor(params.createdBy);

	for (const assignedTo of params.assignedToIds) {
		const task = await db.createTask({
			title: params.title,
			description: params.description,
			createdBy: params.createdBy,
			assignedTo,
			departmentId: params.departmentId,
			priority: params.priority || 'MEDIUM',
			status: 'PENDING',
			source: params.source || 'MANUAL',
			startDate: params.startDate,
			deadline: params.deadline,
			originalDeadline: params.deadline,
			originalAssigneeId: assignedTo,
			estimatedEffort: params.estimatedEffort || '4-6 hours',
			pointsReward: params.pointsReward ?? 10,
			weekId: params.weekId || null
		});

		// Record task event
		await db.createTaskEvent({
			taskId: task.id,
			actorId: actorInfo.actorId,
			actorRole: actorInfo.actorRole,
			eventType: 'CREATED',
			source: actorInfo.source,
			reason: 'Task created and assigned',
			newValue: JSON.stringify({
				title: task.title,
				assignedTo: task.assignedTo,
				priority: task.priority,
				deadline: task.deadline
			})
		});

		// Record audit log
		await logAudit({
			actorId: params.createdBy,
			action: AuditActions.TASK_CREATE,
			targetType: 'TASK',
			targetId: task.id,
			metadata: { title: task.title, assignedTo: task.assignedTo, source: task.source }
		});

		// Notify member
		await createNotification({
			userId: assignedTo,
			type: 'TASK_ASSIGNED',
			title: 'New Task Assigned',
			message: `You have been assigned: "${task.title}". Deadline: ${task.deadline.toLocaleDateString()}`,
			referenceId: task.id
		});

		createdTasks.push(task);
	}

	return createdTasks;
}

export async function updateTaskStatus(params: {
	taskId: string;
	newStatus: TaskStatus;
	actorId: string;
	notes?: string;
}): Promise<Task | null> {
	const existing = await db.getTaskById(params.taskId);
	if (!existing) return null;

	const oldStatus = existing.status;
	if (oldStatus === params.newStatus) return existing;

	const updates: Partial<Task> = { status: params.newStatus };
	const now = new Date();

	if (params.newStatus === 'COMPLETED' && !existing.completedAt) {
		updates.completedAt = now;
	} else if (params.newStatus !== 'COMPLETED' && existing.completedAt) {
		// If reopened, keep or nullify completedAt
		updates.completedAt = null;
	}

	const updated = await db.updateTask(params.taskId, updates);
	if (!updated) return null;

	const actorInfo = await resolveActor(params.actorId);

	let eventType = 'STATUS_CHANGED';
	if (oldStatus === 'COMPLETED' && (params.newStatus === 'IN_PROGRESS' || params.newStatus === 'PENDING')) {
		eventType = 'REOPENED';
	} else if (oldStatus === 'CANCELLED' && params.newStatus !== 'CANCELLED') {
		eventType = 'RESTORED';
	} else if (params.newStatus === 'COMPLETED') {
		eventType = 'COMPLETED';
	} else if (params.newStatus === 'OVERDUE') {
		eventType = 'OVERDUE';
	} else if (params.newStatus === 'CANCELLED') {
		eventType = 'CANCELLED';
	} else if (params.newStatus === 'IN_PROGRESS') {
		eventType = 'STARTED';
	}

	// Record task event
	await db.createTaskEvent({
		taskId: updated.id,
		actorId: actorInfo.actorId,
		actorRole: actorInfo.actorRole,
		eventType,
		source: actorInfo.source,
		reason: params.notes || null,
		oldValue: JSON.stringify({ status: oldStatus }),
		newValue: JSON.stringify({ status: params.newStatus, notes: params.notes })
	});

	// Record audit log
	await logAudit({
		actorId: params.actorId,
		action: AuditActions.TASK_STATUS_CHANGE,
		targetType: 'TASK',
		targetId: updated.id,
		metadata: { oldStatus, newStatus: params.newStatus }
	});

	// Automatic points awarding on completion
	if (params.newStatus === 'COMPLETED') {
		await awardTaskCompletion(
			updated.id,
			updated.assignedTo,
			now,
			updated.deadline,
			updated.pointsReward
		);
		// Check achievements
		await checkAndUnlockAchievements(updated.assignedTo);
	} else if (params.newStatus === 'OVERDUE') {
		await penalizeOverdueTask(updated.id, updated.assignedTo);
	}

	return updated;
}

export async function updateTaskDetails(params: {
	taskId: string;
	actorId: string;
	title?: string;
	description?: string;
	assignedTo?: string;
	departmentId?: string;
	priority?: TaskPriority;
	deadline?: Date;
	estimatedEffort?: string;
	pointsReward?: number;
}): Promise<Task | null> {
	const existing = await db.getTaskById(params.taskId);
	if (!existing) return null;

	const deadlineChanged = params.deadline && params.deadline.getTime() !== existing.deadline.getTime();
	const assigneeChanged = params.assignedTo && params.assignedTo !== existing.assignedTo;

	const updated = await db.updateTask(params.taskId, {
		title: params.title ?? existing.title,
		description: params.description ?? existing.description,
		assignedTo: params.assignedTo ?? existing.assignedTo,
		departmentId: params.departmentId ?? existing.departmentId,
		priority: params.priority ?? existing.priority,
		deadline: params.deadline ?? existing.deadline,
		estimatedEffort: params.estimatedEffort ?? existing.estimatedEffort,
		pointsReward: params.pointsReward ?? existing.pointsReward
	});

	if (!updated) return null;

	await db.createTaskEvent({
		taskId: updated.id,
		actorId: params.actorId,
		eventType: deadlineChanged ? 'DEADLINE_CHANGED' : assigneeChanged ? 'REASSIGNED' : 'UPDATED',
		oldValue: JSON.stringify({
			deadline: existing.deadline,
			assignedTo: existing.assignedTo,
			priority: existing.priority
		}),
		newValue: JSON.stringify({
			deadline: updated.deadline,
			assignedTo: updated.assignedTo,
			priority: updated.priority
		})
	});

	await logAudit({
		actorId: params.actorId,
		action: AuditActions.TASK_UPDATE,
		targetType: 'TASK',
		targetId: updated.id,
		metadata: { deadlineChanged, assigneeChanged }
	});

	if (deadlineChanged) {
		await createNotification({
			userId: updated.assignedTo,
			type: 'DEADLINE_CHANGED',
			title: 'Task Deadline Updated',
			message: `The deadline for "${updated.title}" was changed to ${updated.deadline.toLocaleDateString()}`,
			referenceId: updated.id
		});
	}

	if (assigneeChanged) {
		await createNotification({
			userId: updated.assignedTo,
			type: 'TASK_ASSIGNED',
			title: 'Task Reassigned to You',
			message: `You are now assigned to: "${updated.title}"`,
			referenceId: updated.id
		});
	}

	return updated;
}

export async function cancelTask(params: {
	taskId: string;
	actorId: string;
	reason?: string;
}): Promise<Task | null> {
	return await updateTaskStatus({
		taskId: params.taskId,
		newStatus: 'CANCELLED',
		actorId: params.actorId,
		notes: params.reason || 'Cancelled by administrator'
	});
}

export async function checkAndMarkOverdueTasks(): Promise<number> {
	const allTasks = await db.getTasks();
	const now = new Date();
	let markedCount = 0;

	for (const t of allTasks) {
		if (
			(t.status === 'PENDING' || t.status === 'IN_PROGRESS') &&
			t.deadline.getTime() < now.getTime()
		) {
			await updateTaskStatus({
				taskId: t.id,
				newStatus: 'OVERDUE',
				actorId: 'system',
				notes: 'Automatically flagged overdue past deadline'
			});
			markedCount++;
		}
	}

	return markedCount;
}

export async function reassignTask(params: {
	taskId: string;
	newAssigneeId: string;
	actorId: string;
	reason?: string;
}): Promise<Task | null> {
	const task = await db.getTaskById(params.taskId);
	if (!task) return null;
	if (task.assignedTo === params.newAssigneeId) return task;

	const oldAssignee = await db.getUserById(task.assignedTo);
	const newAssignee = await db.getUserById(params.newAssigneeId);
	if (!newAssignee) throw new Error('Assignee not found');

	const actorInfo = await resolveActor(params.actorId);

	const updated = await db.updateTask(task.id, {
		assignedTo: newAssignee.id,
		departmentId: newAssignee.departmentId || task.departmentId
	});
	if (!updated) return null;

	await db.createTaskEvent({
		taskId: task.id,
		actorId: actorInfo.actorId,
		actorRole: actorInfo.actorRole,
		eventType: 'REASSIGNED',
		source: actorInfo.source,
		reason: params.reason || null,
		oldValue: JSON.stringify({
			assignedTo: task.assignedTo,
			assigneeName: oldAssignee?.fullName || 'Unknown'
		}),
		newValue: JSON.stringify({
			assignedTo: newAssignee.id,
			assigneeName: newAssignee.fullName
		})
	});

	await logAudit({
		actorId: params.actorId,
		action: AuditActions.TASK_UPDATE,
		targetType: 'TASK',
		targetId: task.id,
		metadata: {
			action: 'REASSIGNED',
			oldAssignee: task.assignedTo,
			newAssignee: newAssignee.id,
			reason: params.reason
		}
	});

	await createNotification({
		userId: newAssignee.id,
		type: 'TASK_ASSIGNED',
		title: 'Task Reassigned to You',
		message: `You are now assigned to: "${task.title}". Reason: ${params.reason || 'Reassigned by management'}`,
		referenceId: task.id
	});

	return updated;
}

export async function changeTaskDeadline(params: {
	taskId: string;
	newDeadline: Date;
	actorId: string;
	reason?: string;
}): Promise<Task | null> {
	const task = await db.getTaskById(params.taskId);
	if (!task) return null;

	const oldDeadline = task.deadline;
	const actorInfo = await resolveActor(params.actorId);

	const updated = await db.updateTask(task.id, {
		deadline: params.newDeadline,
		originalDeadline: task.originalDeadline || oldDeadline
	});
	if (!updated) return null;

	await db.createTaskEvent({
		taskId: task.id,
		actorId: actorInfo.actorId,
		actorRole: actorInfo.actorRole,
		eventType: 'DEADLINE_CHANGED',
		source: actorInfo.source,
		reason: params.reason || null,
		oldValue: JSON.stringify({ deadline: oldDeadline }),
		newValue: JSON.stringify({ deadline: params.newDeadline })
	});

	await logAudit({
		actorId: params.actorId,
		action: AuditActions.TASK_UPDATE,
		targetType: 'TASK',
		targetId: task.id,
		metadata: { action: 'DEADLINE_CHANGED', oldDeadline, newDeadline: params.newDeadline, reason: params.reason }
	});

	await createNotification({
		userId: task.assignedTo,
		type: 'DEADLINE_CHANGED',
		title: 'Task Deadline Updated',
		message: `The deadline for "${task.title}" has been updated to ${params.newDeadline.toLocaleDateString()}`,
		referenceId: task.id
	});

	return updated;
}

export async function changeTaskPriority(params: {
	taskId: string;
	newPriority: TaskPriority;
	actorId: string;
	reason?: string;
}): Promise<Task | null> {
	const task = await db.getTaskById(params.taskId);
	if (!task) return null;

	const oldPriority = task.priority;
	if (oldPriority === params.newPriority) return task;

	const actorInfo = await resolveActor(params.actorId);

	const updated = await db.updateTask(task.id, { priority: params.newPriority });
	if (!updated) return null;

	await db.createTaskEvent({
		taskId: task.id,
		actorId: actorInfo.actorId,
		actorRole: actorInfo.actorRole,
		eventType: 'PRIORITY_CHANGED',
		source: actorInfo.source,
		reason: params.reason || null,
		oldValue: JSON.stringify({ priority: oldPriority }),
		newValue: JSON.stringify({ priority: params.newPriority })
	});

	return updated;
}

export async function reopenTask(params: {
	taskId: string;
	actorId: string;
	reason?: string;
}): Promise<Task | null> {
	return await updateTaskStatus({
		taskId: params.taskId,
		newStatus: 'IN_PROGRESS',
		actorId: params.actorId,
		notes: params.reason || 'Task reopened by management'
	});
}

export async function restoreTask(params: {
	taskId: string;
	actorId: string;
	reason?: string;
}): Promise<Task | null> {
	return await updateTaskStatus({
		taskId: params.taskId,
		newStatus: 'PENDING',
		actorId: params.actorId,
		notes: params.reason || 'Cancelled task restored'
	});
}

export async function getTaskTimeline(taskId: string) {
	const events = await db.getTaskEvents(taskId, 'asc');
	const enriched: any[] = [];

	for (const ev of events) {
		let actorName = 'System';
		let actorRole = ev.actorRole || 'SYSTEM';

		if (ev.actorId !== 'system' && ev.actorId !== 'ai') {
			const u = await db.getUserById(ev.actorId);
			if (u) {
				actorName = u.fullName;
				actorRole = u.role;
			}
		} else if (ev.actorId === 'ai') {
			actorName = 'YOUTHs AI Engine';
			actorRole = 'AI';
		}

		let oldValParsed = null;
		let newValParsed = null;
		try {
			if (ev.oldValue) oldValParsed = JSON.parse(ev.oldValue);
		} catch {}
		try {
			if (ev.newValue) newValParsed = JSON.parse(ev.newValue);
		} catch {}

		enriched.push({
			...ev,
			actorName,
			actorRole,
			parsedOldValue: oldValParsed,
			parsedNewValue: newValParsed
		});
	}

	return enriched;
}

export async function getMemberTaskHistory(params: {
	userId: string;
	status?: TaskStatus;
	year?: number;
	month?: number;
	weekId?: string;
}) {
	let memberTasks = await db.getTasks({ assignedTo: params.userId });

	if (params.status) {
		memberTasks = memberTasks.filter((t) => t.status === params.status);
	}
	if (params.weekId) {
		memberTasks = memberTasks.filter((t) => t.weekId === params.weekId);
	}
	if (params.year) {
		memberTasks = memberTasks.filter(
			(t) => t.createdAt.getFullYear() === params.year || t.deadline.getFullYear() === params.year
		);
	}
	if (params.month !== undefined) {
		memberTasks = memberTasks.filter(
			(t) => t.createdAt.getMonth() === params.month || t.deadline.getMonth() === params.month
		);
	}

	const ledger = await db.getLedgerByUserId(params.userId);

	const enriched: any[] = [];
	for (const t of memberTasks) {
		const events = await db.getTaskEvents(t.id, 'asc');
		const pointsForTask = ledger
			.filter((l) => l.taskId === t.id)
			.reduce((acc, curr) => acc + curr.amount, 0);

		enriched.push({
			...t,
			originalDeadline: t.originalDeadline || t.deadline,
			pointsImpact: pointsForTask,
			eventsCount: events.length,
			recentEvents: events.slice(-3)
		});
	}

	return enriched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
