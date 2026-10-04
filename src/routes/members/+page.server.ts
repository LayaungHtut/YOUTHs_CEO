import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import { hashPassword } from '$lib/server/auth/password';
import { grantInitialPoints } from '$lib/server/services/pointsService';
import { generateIntegrationToken } from '$lib/server/services/progressSyncService';
import { logAudit, AuditActions } from '$lib/server/services/auditService';
import crypto from 'node:crypto';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireRole(locals.user, 'CEO');

	const search = url.searchParams.get('search') || undefined;
	const departmentId = url.searchParams.get('dept') || undefined;
	const role = (url.searchParams.get('role') as any) || undefined;
	const accountStatus = (url.searchParams.get('status') as any) || undefined;

	const allUsers = await db.getAllUsers({ search, departmentId, role, accountStatus });
	const departments = await db.getDepartments();

	// Enrich users with points balance and active task counts
	const enrichedUsers = await Promise.all(
		allUsers.map(async (u) => {
			const points = await db.getUserPointsBalance(u.id);
			const userTasks = await db.getTasks({ assignedTo: u.id });
			const completedCount = userTasks.filter((t) => t.status === 'COMPLETED').length;
			const overdueCount = userTasks.filter((t) => t.status === 'OVERDUE').length;
			const connection = await db.getConnectionByUserId(u.id);

			return {
				id: u.id,
				fullName: u.fullName,
				username: u.username,
				email: u.email,
				role: u.role,
				departmentId: u.departmentId,
				accountStatus: u.accountStatus,
				createdAt: u.createdAt,
				lastLoginAt: u.lastLoginAt,
				points,
				tasksCount: userTasks.length,
				completedCount,
				overdueCount,
				integrationStatus: connection?.integrationStatus || 'UNCONFIGURED'
			};
		})
	);

	return {
		members: enrichedUsers,
		departments,
		filters: { search, departmentId, role, accountStatus }
	};
};

export const actions: Actions = {
	createMember: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const fullName = (data.get('fullName') as string)?.trim();
		const username = (data.get('username') as string)?.trim().toLowerCase();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const departmentId = data.get('departmentId') as string;
		const role = (data.get('role') as any) || 'MEMBER';
		const customPassword = (data.get('customPassword') as string)?.trim();

		if (!fullName || !username || !email) {
			return fail(400, { error: 'Full name, username, and email are required.' });
		}

		// Check duplicates
		const existingEmail = await db.getUserByEmail(email);
		if (existingEmail) return fail(400, { error: 'A member with this email already exists.' });

		const existingUsername = await db.getUserByUsername(username);
		if (existingUsername) return fail(400, { error: 'Username already taken.' });

		// Generate secure temporary password if not provided
		const tempPassword = customPassword || `YOUTHs!${crypto.randomBytes(4).toString('hex')}2026`;
		const passwordHash = await hashPassword(tempPassword);

		const created = await db.createUser({
			fullName,
			username,
			email,
			passwordHash,
			role,
			departmentId: departmentId || null,
			accountStatus: 'ACTIVE'
		});

		// Grant initial starting points (100)
		await grantInitialPoints(created.id, locals.user!.id);

		// Generate integration token for synchronization
		const { token: syncToken } = await generateIntegrationToken(created.id, locals.user!.id);

		// If created as HEAD, assign department head
		if (role === 'HEAD' && departmentId) {
			await db.updateDepartment(departmentId, { headUserId: created.id });
		}

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.USER_CREATE,
			targetType: 'USER',
			targetId: created.id,
			metadata: { fullName, username, email, role, departmentId }
		});

		return {
			success: true,
			createdMember: {
				id: created.id,
				fullName: created.fullName,
				username: created.username,
				email: created.email,
				tempPassword,
				syncToken
			}
		};
	},

	updateRole: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const newRole = data.get('newRole') as 'HEAD' | 'MEMBER';
		const departmentId = data.get('departmentId') as string;

		const target = await db.getUserById(userId);
		if (!target) return fail(404, { error: 'User not found' });
		if (target.role === 'CEO') return fail(400, { error: 'Cannot modify CEO role' });

		await db.updateUser(userId, {
			role: newRole,
			departmentId: departmentId || target.departmentId
		});

		if (newRole === 'HEAD' && departmentId) {
			await db.updateDepartment(departmentId, { headUserId: userId });
		}

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.USER_ROLE_CHANGE,
			targetType: 'USER',
			targetId: userId,
			metadata: { oldRole: target.role, newRole, departmentId }
		});

		return { success: true };
	},

	updateStatus: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const status = data.get('status') as 'ACTIVE' | 'SUSPENDED';

		const target = await db.getUserById(userId);
		if (!target) return fail(404, { error: 'User not found' });
		if (target.role === 'CEO') return fail(400, { error: 'Cannot suspend CEO account' });

		await db.updateUser(userId, { accountStatus: status });

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.USER_STATUS_CHANGE,
			targetType: 'USER',
			targetId: userId,
			metadata: { oldStatus: target.accountStatus, newStatus: status }
		});

		return { success: true };
	},

	resetPassword: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const userId = data.get('userId') as string;

		const target = await db.getUserById(userId);
		if (!target) return fail(404, { error: 'User not found' });

		const newTempPassword = `Reset!${crypto.randomBytes(4).toString('hex')}2026`;
		const passwordHash = await hashPassword(newTempPassword);

		await db.updateUser(userId, { passwordHash });

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.USER_PASSWORD_RESET,
			targetType: 'USER',
			targetId: userId
		});

		return {
			success: true,
			resetInfo: {
				userId,
				username: target.username,
				newPassword: newTempPassword
			}
		};
	}
};
