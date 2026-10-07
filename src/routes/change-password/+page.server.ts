import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { verifyPassword, hashPassword, validatePasswordStrength } from '$lib/server/auth/password';
import { logAudit, AuditActions } from '$lib/server/services/auditService';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	if (!locals.user.mustChangePassword) {
		throw redirect(303, '/');
	}

	return {
		username: locals.user.username,
		email: locals.user.email
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const data = await request.formData();
		const currentPassword = data.get('currentPassword') as string;
		const newPassword = data.get('newPassword') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { error: 'All fields are required.' });
		}

		const isCurrentValid = await verifyPassword(currentPassword, locals.user.passwordHash);
		if (!isCurrentValid) {
			return fail(400, { error: 'Current temporary password is incorrect.' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New password and confirmation do not match.' });
		}

		if (newPassword === currentPassword) {
			return fail(400, { error: 'New password must be different from your temporary password.' });
		}

		const strength = validatePasswordStrength(newPassword);
		if (!strength.valid) {
			return fail(400, {
				error: strength.message || 'Password does not meet complexity requirements.'
			});
		}

		const newHash = await hashPassword(newPassword);
		await db.updateUser(locals.user.id, {
			passwordHash: newHash,
			mustChangePassword: false
		});

		await logAudit({
			actorId: locals.user.id,
			action: AuditActions.USER_PASSWORD_CHANGE,
			targetType: 'USER',
			targetId: locals.user.id
		});

		throw redirect(303, '/');
	}
};
