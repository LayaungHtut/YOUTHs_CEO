import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import { logAudit, AuditActions } from '$lib/server/services/auditService';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals.user, 'CEO');

	const departments = await db.getDepartments();
	const allUsers = await db.getAllUsers({ accountStatus: 'ACTIVE' });
	const allTasks = await db.getTasks();

	const enrichedDepartments = departments.map((d) => {
		const headUser = allUsers.find((u) => u.id === d.headUserId) || null;
		const deptMembers = allUsers.filter((u) => u.departmentId === d.id);
		const deptTasks = allTasks.filter((t) => t.departmentId === d.id);
		const completedTasks = deptTasks.filter((t) => t.status === 'COMPLETED');
		const overdueTasks = deptTasks.filter((t) => t.status === 'OVERDUE');
		const inProgressTasks = deptTasks.filter((t) => t.status === 'IN_PROGRESS');

		const completionRate =
			deptTasks.length > 0 ? Math.round((completedTasks.length / deptTasks.length) * 100) : 0;

		return {
			...d,
			headUser,
			membersCount: deptMembers.length,
			tasksCount: deptTasks.length,
			completedCount: completedTasks.length,
			overdueCount: overdueTasks.length,
			inProgressCount: inProgressTasks.length,
			completionRate,
			members: deptMembers
		};
	});

	return {
		departments: enrichedDepartments,
		allUsers
	};
};

export const actions: Actions = {
	assignHead: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const departmentId = data.get('departmentId') as string;
		const headUserId = data.get('headUserId') as string;

		const dept = await db.getDepartmentById(departmentId);
		if (!dept) return fail(404, { error: 'Department not found' });

		const user = await db.getUserById(headUserId);
		if (!user) return fail(404, { error: 'User not found' });

		// Promote user to HEAD and attach to this department
		await db.updateUser(user.id, {
			role: 'HEAD',
			departmentId: dept.id
		});

		// Update department's headUserId
		await db.updateDepartment(dept.id, {
			headUserId: user.id
		});

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.USER_ROLE_CHANGE,
			targetType: 'DEPARTMENT',
			targetId: dept.id,
			metadata: { departmentName: dept.name, newHeadId: user.id, newHeadName: user.fullName }
		});

		return { success: true };
	},

	updateDescription: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const departmentId = data.get('departmentId') as string;
		const description = (data.get('description') as string)?.trim();

		if (!description) return fail(400, { error: 'Description cannot be empty' });

		await db.updateDepartment(departmentId, { description });

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.USER_UPDATE,
			targetType: 'DEPARTMENT',
			targetId: departmentId,
			metadata: { description }
		});

		return { success: true };
	}
};
