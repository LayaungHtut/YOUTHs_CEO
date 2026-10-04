import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import { createManualTask, checkAndMarkOverdueTasks } from '$lib/server/services/taskService';
import type { TaskPriority } from '$lib/server/db/types';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals.user, 'CEO');

	await checkAndMarkOverdueTasks();

	const [departments, allUsers, allTasks] = await Promise.all([
		db.getDepartments(),
		db.getAllUsers({ accountStatus: 'ACTIVE' }),
		db.getTasks()
	]);

	const totalMembers = allUsers.length;
	const totalHeads = allUsers.filter((u) => u.role === 'HEAD').length;
	const totalDepartments = departments.length;
	const totalTasks = allTasks.length;
	const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED').length;
	const inProgressTasks = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
	const pendingTasks = allTasks.filter((t) => t.status === 'PENDING').length;
	const overdueTasks = allTasks.filter((t) => t.status === 'OVERDUE').length;
	const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

	const userMap = new Map(allUsers.map((u) => [u.id, u]));

	const departmentStats = departments.map((d) => {
		const deptTasks = allTasks.filter((t) => t.departmentId === d.id);
		const deptCompleted = deptTasks.filter((t) => t.status === 'COMPLETED').length;
		const deptOverdue = deptTasks.filter((t) => t.status === 'OVERDUE').length;
		const deptMembers = allUsers.filter((u) => u.departmentId === d.id).length;
		const headUser = d.headUserId ? userMap.get(d.headUserId) : null;

		return {
			id: d.id,
			name: d.name,
			headName: headUser ? headUser.fullName : 'Unassigned',
			memberCount: deptMembers,
			taskCount: deptTasks.length,
			completedCount: deptCompleted,
			overdueCount: deptOverdue,
			completionRate: deptTasks.length > 0 ? Math.round((deptCompleted / deptTasks.length) * 100) : 0
		};
	});

	const memberOverdueMap = new Map<string, number>();
	for (const t of allTasks) {
		if (t.status === 'OVERDUE' && t.assignedTo) {
			memberOverdueMap.set(t.assignedTo, (memberOverdueMap.get(t.assignedTo) || 0) + 1);
		}
	}

	const membersNeedingAttention = Array.from(memberOverdueMap.entries())
		.map(([userId, overdueCount]) => {
			const member = userMap.get(userId);
			if (!member) return null;
			return {
				id: member.id,
				fullName: member.fullName,
				username: member.username,
				overdueCount
			};
		})
		.filter((m): m is NonNullable<typeof m> => m !== null)
		.sort((a, b) => b.overdueCount - a.overdueCount);

	const recentTasks = allTasks
		.slice()
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		.slice(0, 10);

	return {
		metrics: {
			totalMembers,
			totalHeads,
			totalDepartments,
			totalTasks,
			completedTasks,
			inProgressTasks,
			pendingTasks,
			overdueTasks,
			completionRate
		},
		departmentStats,
		membersNeedingAttention,
		recentTasks,
		departments,
		activeMembers: allUsers
	};
};

export const actions: Actions = {
	quickCreateTask: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		const departmentId = (data.get('departmentId') as string)?.trim();
		const assignedTo = (data.get('assignedTo') as string)?.trim();
		const priority = ((data.get('priority') as string) || 'MEDIUM') as TaskPriority;
		const deadlineDays = parseInt((data.get('deadlineDays') as string) || '5', 10);

		if (!title || !description || !departmentId || !assignedTo) {
			return fail(400, { error: 'All fields are required.' });
		}

		const startDate = new Date();
		const deadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000);

		await createManualTask({
			title,
			description,
			createdBy: locals.user!.id,
			assignedToIds: [assignedTo],
			departmentId,
			priority,
			startDate,
			deadline
		});

		return { success: true };
	}
};

