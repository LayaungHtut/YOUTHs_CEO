import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import {
	createManualTask,
	updateTaskStatus,
	updateTaskDetails,
	cancelTask
} from '$lib/server/services/taskService';
import type { TaskPriority, TaskSource, TaskStatus } from '$lib/server/db/types';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireRole(locals.user, 'CEO');

	const search = url.searchParams.get('search') || undefined;
	const departmentId = url.searchParams.get('dept') || undefined;
	const assignedTo = url.searchParams.get('assignee') || undefined;
	const priority = (url.searchParams.get('priority') as TaskPriority) || undefined;
	const source = (url.searchParams.get('source') as TaskSource) || undefined;
	const status = (url.searchParams.get('status') as TaskStatus) || undefined;

	const tasks = await db.getTasks({
		search,
		departmentId,
		assignedTo,
		priority,
		source,
		status
	});

	const departments = await db.getDepartments();
	const users = await db.getAllUsers({ accountStatus: 'ACTIVE' });

	// Enrich tasks with assignee and department names
	const enrichedTasks = tasks.map((t) => {
		const assignee = users.find((u) => u.id === t.assignedTo) || null;
		const dept = departments.find((d) => d.id === t.departmentId) || null;
		return {
			...t,
			assigneeName: assignee ? assignee.fullName : 'Unassigned',
			assigneeRole: assignee ? assignee.role : '',
			departmentName: dept ? dept.name : 'Unknown'
		};
	});

	return {
		tasks: enrichedTasks,
		departments,
		users: users.filter((u) => u.role !== 'CEO'),
		filters: { search, departmentId, assignedTo, priority, source, status }
	};
};

export const actions: Actions = {
	createTask: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		const departmentId = data.get('departmentId') as string;
		const assignedToIds = data.getAll('assignedToIds') as string[];
		const priority = (data.get('priority') as TaskPriority) || 'MEDIUM';
		const deadlineDays = parseInt(data.get('deadlineDays') as string, 10) || 5;
		const pointsReward = parseInt(data.get('pointsReward') as string, 10) || 10;
		const estimatedEffort = (data.get('estimatedEffort') as string)?.trim() || '4-6 hours';

		if (!title || !description || !departmentId || assignedToIds.length === 0) {
			return fail(400, { error: 'Please provide task title, description, department, and at least one assignee.' });
		}

		try {
			const startDate = new Date();
			const deadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000);

			const created = await createManualTask({
				title,
				description,
				createdBy: locals.user!.id,
				assignedToIds,
				departmentId,
				priority,
				startDate,
				deadline,
				estimatedEffort,
				pointsReward
			});

			return { success: true, count: created.length };
		} catch (err: any) {
			return fail(500, { error: err.message || 'Failed to create tasks.' });
		}
	},

	updateStatus: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const taskId = data.get('taskId') as string;
		const newStatus = data.get('status') as TaskStatus;

		if (!taskId || !newStatus) {
			return fail(400, { error: 'Task ID and status are required' });
		}

		await updateTaskStatus({
			taskId,
			newStatus,
			actorId: locals.user!.id
		});

		return { success: true };
	},

	cancelTask: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const taskId = data.get('taskId') as string;
		const reason = (data.get('reason') as string)?.trim();

		await cancelTask({
			taskId,
			actorId: locals.user!.id,
			reason
		});

		return { success: true };
	}
};
