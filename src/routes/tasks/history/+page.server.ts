import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireRole(locals.user, 'CEO');

	const memberId = url.searchParams.get('memberId') || undefined;
	const departmentId = url.searchParams.get('departmentId') || undefined;
	const eventType = url.searchParams.get('eventType') || undefined;
	const source = url.searchParams.get('source') || undefined;
	const priority = url.searchParams.get('priority') || undefined;
	const status = url.searchParams.get('status') || undefined;
	const sort = (url.searchParams.get('sort') as 'newest' | 'oldest') || 'newest';

	const startDateStr = url.searchParams.get('startDate');
	const endDateStr = url.searchParams.get('endDate');

	const startDate = startDateStr ? new Date(startDateStr) : undefined;
	const endDate = endDateStr ? new Date(endDateStr) : undefined;

	const events = await db.getAllTaskEvents({
		memberId,
		departmentId,
		eventType,
		source,
		priority,
		status,
		startDate,
		endDate,
		sort
	});

	const departments = await db.getDepartments();
	const users = await db.getAllUsers();

	return {
		events,
		departments,
		users: users.filter((u) => u.role !== 'CEO'),
		filters: {
			memberId: memberId || '',
			departmentId: departmentId || '',
			eventType: eventType || '',
			source: source || '',
			priority: priority || '',
			status: status || '',
			sort,
			startDate: startDateStr || '',
			endDate: endDateStr || ''
		}
	};
};

