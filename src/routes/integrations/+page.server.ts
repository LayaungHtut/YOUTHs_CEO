import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import {
	generateIntegrationToken,
	revokeIntegrationToken,
	importProgressFallback
} from '$lib/server/services/progressSyncService';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals.user, 'CEO');

	const connections = await db.getAllConnections();
	const users = await db.getAllUsers({ accountStatus: 'ACTIVE' });
	const eligibleMembers = users.filter((u) => u.role !== 'CEO');

	const enrichedConnections = eligibleMembers.map((m) => {
		const conn = connections.find((c) => c.userId === m.id);
		return {
			userId: m.id,
			fullName: m.fullName,
			username: m.username,
			departmentId: m.departmentId,
			status: conn?.integrationStatus || 'UNCONFIGURED',
			tokenPrefix: conn?.integrationToken || 'None',
			lastSyncAt: conn?.lastSyncAt || null,
			lastSyncError: conn?.lastSyncError || null
		};
	});

	return {
		connections: enrichedConnections,
		eligibleMembers
	};
};

export const actions: Actions = {
	generateToken: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const userId = data.get('userId') as string;

		if (!userId) return fail(400, { error: 'User is required' });

		const { token, prefix } = await generateIntegrationToken(userId, locals.user!.id);
		return { success: true, token, prefix, userId };
	},

	revokeToken: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const userId = data.get('userId') as string;

		await revokeIntegrationToken(userId, locals.user!.id);
		return { success: true, revoked: true };
	},

	importFallbackFile: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const file = data.get('file') as File;
		const fileType = (data.get('fileType') as 'csv' | 'json') || 'csv';

		if (!file || file.size === 0) {
			return fail(400, { error: 'Please choose a CSV or JSON progress file.' });
		}

		try {
			const text = await file.text();
			const result = await importProgressFallback(text, fileType, locals.user!.id);

			if (!result.success) {
				return fail(400, {
					error: 'Import encountered issues',
					details: result.errors,
					totalProcessed: result.totalProcessed
				});
			}

			return {
				success: true,
				totalProcessed: result.totalProcessed
			};
		} catch (err: any) {
			return fail(500, { error: err.message || 'Failed to process file' });
		}
	}
};
