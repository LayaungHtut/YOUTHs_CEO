import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth/permissions';
import { db } from '$lib/server/db';
import { getOrganizationActivityFeed, type ActivityType } from '$lib/server/services/activityService';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireRole(locals.user, 'CEO');

	const departmentId = url.searchParams.get('departmentId') || undefined;
	const activityType = (url.searchParams.get('activityType') as ActivityType) || undefined;
	const memberId = url.searchParams.get('memberId') || undefined;
	const startDateStr = url.searchParams.get('startDate');
	const endDateStr = url.searchParams.get('endDate');

	const startDate = startDateStr ? new Date(startDateStr) : undefined;
	const endDate = endDateStr ? new Date(endDateStr) : undefined;

	const { items, totalCount } = await getOrganizationActivityFeed({
		departmentId,
		activityType,
		memberId,
		startDate,
		endDate,
		limit: 100
	});

	const departments = await db.getDepartments();
	const users = await db.getAllUsers({ accountStatus: 'ACTIVE' });

	return {
		items,
		totalCount,
		departments,
		users,
		filters: {
			departmentId: departmentId || '',
			activityType: activityType || '',
			memberId: memberId || '',
			startDate: startDateStr || '',
			endDate: endDateStr || ''
		}
	};
};
