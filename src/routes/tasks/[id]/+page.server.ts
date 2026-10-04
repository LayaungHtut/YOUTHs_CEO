import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import {
	updateTaskStatus,
	updateTaskDetails,
	cancelTask,
	getTaskTimeline
} from '$lib/server/services/taskService';
import type { TaskPriority, TaskStatus } from '$lib/server/db/types';

export const load: PageServerLoad = async ({ params, locals }) => {
	requireRole(locals.user, 'CEO');

	if (!params.id) throw error(400, 'Task ID required');

	const task = await db.getTaskById(params.id);
	if (!task) throw error(404, 'Task not found');

	const department = await db.getDepartmentById(task.departmentId);
	const assignee = await db.getUserById(task.assignedTo);
	const creator = await db.getUserById(task.createdBy);
	const events = await getTaskTimeline(task.id);
	const departments = await db.getDepartments();
	const users = await db.getAllUsers({ accountStatus: 'ACTIVE' });

	return {
		task,
		department,
		assignee,
		creator,
		events,
		departments,
		users: users.filter((u) => u.role !== 'CEO')
	};
};

export const actions: Actions = {
	updateDetails: async ({ request, params, locals }) => {
		requireRole(locals.user, 'CEO');
		if (!params.id) return fail(400, { error: 'Task ID required' });

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		const priority = data.get('priority') as TaskPriority;
		const deadlineStr = data.get('deadline') as string;
		const estimatedEffort = (data.get('estimatedEffort') as string)?.trim();
		const pointsReward = parseInt(data.get('pointsReward') as string, 10);

		const deadline = deadlineStr ? new Date(deadlineStr) : undefined;

		await updateTaskDetails({
			taskId: params.id,
			actorId: locals.user!.id,
			title,
			description,
			priority,
			deadline,
			estimatedEffort,
			pointsReward
		});

		return { success: true };
	},

	changeStatus: async ({ request, params, locals }) => {
		requireRole(locals.user, 'CEO');
		if (!params.id) return fail(400, { error: 'Task ID required' });

		const data = await request.formData();
		const newStatus = data.get('status') as TaskStatus;
		const notes = (data.get('notes') as string)?.trim();

		await updateTaskStatus({
			taskId: params.id,
			newStatus,
			actorId: locals.user!.id,
			notes
		});

		return { success: true };
	},

	cancelTask: async ({ request, params, locals }) => {
		requireRole(locals.user, 'CEO');
		if (!params.id) return fail(400, { error: 'Task ID required' });

		const data = await request.formData();
		const reason = (data.get('reason') as string)?.trim();

		await cancelTask({
			taskId: params.id,
			actorId: locals.user!.id,
			reason
		});

		return { success: true };
	}
};
