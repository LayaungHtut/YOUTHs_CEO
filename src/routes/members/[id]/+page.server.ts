import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import type { TaskStatus } from '$lib/server/db/types';
import { requireRole } from '$lib/server/auth/permissions';
import { adjustPointsManually, getUserPointsSummary } from '$lib/server/services/pointsService';
import { generateIntegrationToken, revokeIntegrationToken } from '$lib/server/services/progressSyncService';
import { getMemberTaskHistory } from '$lib/server/services/taskService';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	requireRole(locals.user, 'CEO');

	const targetUser = await db.getUserById(params.id);
	if (!targetUser) {
		throw error(404, 'Member not found');
	}

	const department = targetUser.departmentId ? await db.getDepartmentById(targetUser.departmentId) : null;
	const tasks = await db.getTasks({ assignedTo: targetUser.id });
	const pointsSummary = await getUserPointsSummary(targetUser.id);
	const userAchievements = await db.getMemberAchievements(targetUser.id);
	const allAchievements = await db.getAchievements();

	const enrichedAchievements = userAchievements.map((ua) => {
		const ach = allAchievements.find((a) => a.id === ua.achievementId);
		return {
			...ua,
			name: ach?.name || 'Unknown',
			description: ach?.description || '',
			icon: ach?.icon || 'award',
			category: ach?.category || 'TASKS'
		};
	});

	const connection = await db.getConnectionByUserId(targetUser.id);
	const latestSnapshot = await db.getLatestSnapshot(targetUser.id);

	const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
	const overdueCount = tasks.filter((t) => t.status === 'OVERDUE').length;
	const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

	const taskStatus = (url.searchParams.get('taskStatus') as TaskStatus) || undefined;
	const taskYear = url.searchParams.get('taskYear') ? parseInt(url.searchParams.get('taskYear')!, 10) : undefined;
	const taskMonth = url.searchParams.get('taskMonth') ? parseInt(url.searchParams.get('taskMonth')!, 10) : undefined;
	const taskWeek = url.searchParams.get('taskWeek') || undefined;

	const taskHistory = await getMemberTaskHistory({
		userId: targetUser.id,
		status: taskStatus || undefined,
		year: taskYear,
		month: taskMonth,
		weekId: taskWeek
	});

	const taskWeeks = await db.getTaskWeeks();

	return {
		member: targetUser,
		department,
		tasks,
		taskHistory,
		taskWeeks,
		pointsSummary,
		achievements: enrichedAchievements,
		connection,
		latestSnapshot,
		taskFilters: {
			status: taskStatus || '',
			year: taskYear ? String(taskYear) : '',
			month: taskMonth !== undefined ? String(taskMonth) : '',
			weekId: taskWeek || ''
		},
		stats: {
			totalAssigned: tasks.length,
			completedCount,
			overdueCount,
			completionRate
		}
	};
};

export const actions: Actions = {
	adjustPoints: async ({ request, params, locals }) => {
		requireRole(locals.user, 'CEO');
		if (!params.id) throw error(400, 'Member ID is required');

		const data = await request.formData();
		const amount = parseInt(data.get('amount') as string, 10);
		const reason = (data.get('reason') as string)?.trim();

		if (isNaN(amount) || !reason) {
			return fail(400, { error: 'Valid amount and reason are required.' });
		}

		await adjustPointsManually({
			userId: params.id,
			amount,
			reason,
			creatorId: locals.user!.id
		});

		return { success: true };
	},

	regenerateSyncToken: async ({ params, locals }) => {
		requireRole(locals.user, 'CEO');
		if (!params.id) throw error(400, 'Member ID is required');

		const { token, prefix } = await generateIntegrationToken(params.id, locals.user!.id);
		return { success: true, newSyncToken: token, tokenPrefix: prefix };
	},

	revokeSyncToken: async ({ params, locals }) => {
		requireRole(locals.user, 'CEO');
		if (!params.id) throw error(400, 'Member ID is required');

		await revokeIntegrationToken(params.id, locals.user!.id);
		return { success: true, revoked: true };
	}
};
