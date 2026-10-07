import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import {
	hashPassword,
	generateTemporaryPassword,
	validatePasswordStrength
} from '$lib/server/auth/password';
import { grantInitialPoints } from '$lib/server/services/pointsService';
import { generateIntegrationToken } from '$lib/server/services/progressSyncService';
import { logAudit, AuditActions } from '$lib/server/services/auditService';
import { sendAccountCredentialsEmail } from '$lib/server/services/emailService';
import { getSetting } from '$lib/server/services/settingsService';

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
		const deliveryEmail = (data.get('deliveryEmail') as string)?.trim().toLowerCase();

		if (!fullName || !username || !email) {
			return fail(400, { error: 'Full name, username, and email are required.' });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Please enter a valid email address.' });
		}
		if (deliveryEmail && !emailRegex.test(deliveryEmail)) {
			return fail(400, { error: 'Please enter a valid delivery email address.' });
		}

		if (customPassword) {
			const strength = validatePasswordStrength(customPassword);
			if (!strength.valid) {
				return fail(400, {
					error: strength.message || 'Password does not meet security requirements.'
				});
			}
		}

		// Check duplicates
		const existingEmail = await db.getUserByEmail(email);
		if (existingEmail) return fail(400, { error: 'A member with this email already exists.' });

		const existingUsername = await db.getUserByUsername(username);
		if (existingUsername) return fail(400, { error: 'Username already taken.' });

		// Generate secure temporary password if not provided
		const tempPassword = customPassword || generateTemporaryPassword();
		const passwordHash = await hashPassword(tempPassword);

		const created = await db.createUser({
			fullName,
			username,
			email,
			passwordHash,
			role,
			departmentId: departmentId || null,
			accountStatus: 'ACTIVE',
			mustChangePassword: true
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

		// Retrieve org name for the email template
		const orgSetting = await getSetting<{ value: string }>('org.name');
		const rawOrgName = orgSetting?.value || '';
		const orgName = rawOrgName.split('(')[0]?.trim() || undefined;

		// Dispatch credentials email via Resend to the user's Gmail/delivery address
		const recipientEmail = deliveryEmail || email;
		const emailResult = await sendAccountCredentialsEmail({
			to: recipientEmail,
			fullName,
			username,
			email: recipientEmail,
			password: tempPassword,
			role,
			orgName
		});

		return {
			success: true,
			createdMember: {
				id: created.id,
				fullName: created.fullName,
				username: created.username,
				email: created.email,
				tempPassword,
				syncToken,
				recipientEmail,
				emailSent: emailResult.sent,
				emailError: emailResult.error
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

		const newTempPassword = generateTemporaryPassword();
		const passwordHash = await hashPassword(newTempPassword);

		await db.updateUser(userId, { passwordHash, mustChangePassword: true });

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.USER_PASSWORD_RESET,
			targetType: 'USER',
			targetId: userId
		});

		const orgSetting = await getSetting<{ value: string }>('org.name');
		const rawOrgName = orgSetting?.value || '';
		const orgName = rawOrgName.split('(')[0]?.trim() || undefined;

		const emailResult = await sendAccountCredentialsEmail({
			to: target.email,
			fullName: target.fullName,
			username: target.username,
			email: target.email,
			password: newTempPassword,
			role: target.role,
			orgName
		});

		return {
			success: true,
			resetInfo: {
				userId,
				username: target.username,
				newPassword: newTempPassword,
				emailSent: emailResult.sent,
				emailError: emailResult.error
			}
		};
	},

	deleteMember: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const userId = data.get('userId') as string;

		if (!userId) {
			return fail(400, { error: 'Member ID is required.' });
		}

		if (userId === locals.user!.id) {
			return fail(400, { error: 'You cannot delete your own CEO account.' });
		}

		const target = await db.getUserById(userId);
		if (!target) {
			return fail(404, { error: 'Member not found.' });
		}

		if (target.role === 'CEO') {
			return fail(400, { error: 'Cannot delete CEO accounts.' });
		}

		try {
			await db.deleteUser(userId, locals.user!.id);

			await logAudit({
				actorId: locals.user!.id,
				action: AuditActions.USER_DELETE,
				targetType: 'USER',
				targetId: userId,
				metadata: {
					deletedFullName: target.fullName,
					deletedUsername: target.username,
					deletedEmail: target.email,
					role: target.role,
					departmentId: target.departmentId
				}
			});

			return {
				success: true,
				deletedMember: {
					id: userId,
					username: target.username,
					fullName: target.fullName
				}
			};
		} catch (err: any) {
			console.error('[deleteMember] Error deleting member:', err);
			return fail(500, {
				error: err?.message || 'Failed to remove member account.'
			});
		}
	}
};
