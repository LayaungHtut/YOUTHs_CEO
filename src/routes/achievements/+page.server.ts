import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import { logAudit, AuditActions } from '$lib/server/services/auditService';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals.user, 'CEO');

	const achievements = await db.getAchievements(false); // get all including inactive
	const allUsers = await db.getAllUsers();

	// Enrich achievements with unlock count
	const enrichedAchievements = await Promise.all(
		achievements.map(async (ach) => {
			let unlockCount = 0;
			for (const u of allUsers) {
				const uAch = await db.getMemberAchievements(u.id);
				if (uAch.some((a) => a.achievementId === ach.id)) {
					unlockCount++;
				}
			}
			return {
				...ach,
				unlockCount
			};
		})
	);

	return {
		achievements: enrichedAchievements
	};
};

export const actions: Actions = {
	createAchievement: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		const icon = (data.get('icon') as string)?.trim() || 'award';
		const category = (data.get('category') as any) || 'TASKS';
		const threshold = parseInt(data.get('threshold') as string, 10) || 5;

		if (!name || !description) {
			return fail(400, { error: 'Name and description are required.' });
		}

		const criteria = JSON.stringify({
			type: 'COMPLETED_TASKS_COUNT',
			threshold
		});

		const created = await db.createAchievement({
			name,
			description,
			icon,
			category,
			criteria,
			active: true
		});

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.ACHIEVEMENT_CREATE,
			targetType: 'ACHIEVEMENT',
			targetId: created.id,
			metadata: { name, category, threshold }
		});

		return { success: true };
	},

	toggleActive: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const id = data.get('id') as string;
		const active = data.get('active') === 'true';

		await db.updateAchievement(id, { active: !active });
		return { success: true };
	}
};
