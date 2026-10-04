import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireRole(locals.user, 'CEO');

	const action = url.searchParams.get('action') || undefined;
	const targetType = url.searchParams.get('targetType') || undefined;

	const [auditResult, users] = await Promise.all([
		db.getAuditLogs({ action, targetType, limit: 100 }),
		db.getAllUsers()
	]);

	const userMap = new Map(users.map((u) => [u.id, u.fullName]));

	const logs = auditResult.logs.map((log) => ({
		...log,
		actorName: log.actorId ? userMap.get(log.actorId) || `User (${log.actorId.slice(0, 8)})` : 'System'
	}));

	return {
		total: auditResult.total,
		filters: { action, targetType },
		logs
	};
};

