import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import {
	createManualTask,
	updateTaskStatus,
	reassignTask,
	changeTaskDeadline,
	changeTaskPriority,
	cancelTask,
	getTaskTimeline,
	getMemberTaskHistory,
	checkAndMarkOverdueTasks
} from './taskService';

describe('Task History & Lifecycle Service', () => {
	let ceoUser: any;
	let memberUser: any;
	let alternateUser: any;

	beforeEach(async () => {
		db.resetForTesting();

		ceoUser = await db.createUser({
			fullName: 'CEO Admin',
			username: 'ceo',
			email: 'ceo@youths.org',
			passwordHash: 'hash',
			role: 'CEO',
			accountStatus: 'ACTIVE'
		});

		memberUser = await db.createUser({
			fullName: 'Dev Member',
			username: 'devmember',
			email: 'dev@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			departmentId: 'dept-software-dev',
			accountStatus: 'ACTIVE'
		});

		alternateUser = await db.createUser({
			fullName: 'Design Member',
			username: 'designmember',
			email: 'design@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			departmentId: 'dept-graphic-design',
			accountStatus: 'ACTIVE'
		});
	});

	it('creates task and records CREATED lifecycle event in timeline', async () => {
		const [task] = await createManualTask({
			title: 'Setup Core API',
			description: 'Setup REST and WebSocket endpoints',
			createdBy: ceoUser.id,
			assignedToIds: [memberUser.id],
			departmentId: 'dept-software-dev',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000)
		});

		const timeline = await getTaskTimeline(task.id);
		expect(timeline.length).toBeGreaterThanOrEqual(1);
		expect(timeline[0].eventType).toBe('CREATED');
		expect(timeline[0].taskId).toBe(task.id);
	});

	it('records STATUS_CHANGED lifecycle events on status update', async () => {
		const [task] = await createManualTask({
			title: 'Frontend Component',
			description: 'Build dashboard widgets',
			createdBy: ceoUser.id,
			assignedToIds: [memberUser.id],
			departmentId: 'dept-software-dev',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000)
		});

		await updateTaskStatus({
			taskId: task.id,
			newStatus: 'IN_PROGRESS',
			actorId: memberUser.id,
			notes: 'Started implementation'
		});

		await updateTaskStatus({
			taskId: task.id,
			newStatus: 'COMPLETED',
			actorId: memberUser.id,
			notes: 'Completed and verified'
		});

		const timeline = await getTaskTimeline(task.id);
		const startedEvent = timeline.find((e) => e.eventType === 'STARTED');
		const completedEvent = timeline.find((e) => e.eventType === 'COMPLETED');
		expect(startedEvent).toBeDefined();
		expect(completedEvent).toBeDefined();
		expect(startedEvent?.newValue).toContain('IN_PROGRESS');
		expect(completedEvent?.newValue).toContain('COMPLETED');
	});

	it('records REASSIGNED lifecycle event when task is reassigned', async () => {
		const [task] = await createManualTask({
			title: 'Cross-Department Task',
			description: 'Needs graphic design instead',
			createdBy: ceoUser.id,
			assignedToIds: [memberUser.id],
			departmentId: 'dept-software-dev',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000)
		});

		await reassignTask({
			taskId: task.id,
			newAssigneeId: alternateUser.id,
			actorId: ceoUser.id,
			reason: 'Shifted ownership to designer'
		});

		const updated = await db.getTaskById(task.id);
		expect(updated?.assignedTo).toBe(alternateUser.id);

		const timeline = await getTaskTimeline(task.id);
		const reassignEvent = timeline.find((e) => e.eventType === 'REASSIGNED');
		expect(reassignEvent).toBeDefined();
		expect(reassignEvent?.reason).toBe('Shifted ownership to designer');
	});

	it('records DEADLINE_CHANGED event when task deadline is extended', async () => {
		const [task] = await createManualTask({
			title: 'Complex Architecture',
			description: 'Deep architectural changes',
			createdBy: ceoUser.id,
			assignedToIds: [memberUser.id],
			departmentId: 'dept-software-dev',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000)
		});

		const newDeadline = new Date(Date.now() + 86400000 * 3);
		await changeTaskDeadline({
			taskId: task.id,
			newDeadline,
			actorId: ceoUser.id,
			reason: 'Scope extension granted'
		});

		const timeline = await getTaskTimeline(task.id);
		const deadlineEvent = timeline.find((e) => e.eventType === 'DEADLINE_CHANGED');
		expect(deadlineEvent).toBeDefined();
		expect(deadlineEvent?.reason).toBe('Scope extension granted');
	});

	it('records PRIORITY_CHANGED event when task priority shifts', async () => {
		const [task] = await createManualTask({
			title: 'Bug Fix',
			description: 'Critical bug in auth',
			createdBy: ceoUser.id,
			assignedToIds: [memberUser.id],
			departmentId: 'dept-software-dev',
			priority: 'LOW',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000)
		});

		await changeTaskPriority({
			taskId: task.id,
			newPriority: 'URGENT',
			actorId: ceoUser.id,
			reason: 'Security vulnerability escalated'
		});

		const timeline = await getTaskTimeline(task.id);
		const priorityEvent = timeline.find((e) => e.eventType === 'PRIORITY_CHANGED');
		expect(priorityEvent).toBeDefined();
		expect(priorityEvent?.newValue).toContain('URGENT');
	});

	it('records CANCELLED event and sets status when task is cancelled', async () => {
		const [task] = await createManualTask({
			title: 'Deprecated Spec',
			description: 'No longer needed',
			createdBy: ceoUser.id,
			assignedToIds: [memberUser.id],
			departmentId: 'dept-software-dev',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000)
		});

		await cancelTask({
			taskId: task.id,
			actorId: ceoUser.id,
			reason: 'Spec deprecated by leadership'
		});

		const cancelled = await db.getTaskById(task.id);
		expect(cancelled?.status).toBe('CANCELLED');

		const timeline = await getTaskTimeline(task.id);
		const cancelEvent = timeline.find((e) => e.eventType === 'CANCELLED');
		expect(cancelEvent).toBeDefined();
	});

	it('retrieves member task history with granular filtering and stats', async () => {
		const [task1] = await createManualTask({
			title: 'Member Task One',
			description: 'First task',
			createdBy: ceoUser.id,
			assignedToIds: [memberUser.id],
			departmentId: 'dept-software-dev',
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000)
		});

		await updateTaskStatus({
			taskId: task1.id,
			newStatus: 'COMPLETED',
			actorId: memberUser.id
		});

		const history = await getMemberTaskHistory({
			userId: memberUser.id,
			status: 'COMPLETED'
		});

		expect(history.length).toBe(1);
		expect(history[0].id).toBe(task1.id);
		expect(history[0].status).toBe('COMPLETED');
	});
});
