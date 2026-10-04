import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { hashPassword, validatePasswordStrength } from '$lib/server/auth/password';
import { createSession, setSessionCookie } from '$lib/server/auth/session';
import { logAudit, AuditActions } from '$lib/server/services/auditService';
import { grantInitialPoints } from '$lib/server/services/pointsService';

export const load: PageServerLoad = async () => {
	const ceoCount = await db.countCeoUsers();
	if (ceoCount > 0) {
		throw redirect(303, '/login');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const ceoCount = await db.countCeoUsers();
		if (ceoCount > 0) {
			return fail(400, { error: 'CEO account has already been initialized. Setup is permanently locked.' });
		}

		const data = await request.formData();
		const fullName = (data.get('fullName') as string)?.trim();
		const username = (data.get('username') as string)?.trim().toLowerCase();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const password = data.get('password') as string;
		const confirmPassword = data.get('confirmPassword') as string;
		const setupSecret = (data.get('setupSecret') as string)?.trim();

		// Environment setup secret protection check (if configured in env)
		const envSecret = process.env.CEO_SETUP_SECRET;
		if (envSecret && setupSecret !== envSecret) {
			return fail(403, { error: 'Invalid CEO Setup Authorization Key' });
		}

		if (!fullName || !username || !email || !password) {
			return fail(400, { error: 'All fields are required.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const strength = validatePasswordStrength(password);
		if (!strength.valid) {
			return fail(400, { error: strength.message || 'Password does not meet complexity requirements.' });
		}

		try {
			const passwordHash = await hashPassword(password);
			const ceoUser = await db.createUser({
				fullName,
				username,
				email,
				passwordHash,
				role: 'CEO',
				accountStatus: 'ACTIVE',
				departmentId: null
			});

			// Grant initial CEO points
			await grantInitialPoints(ceoUser.id);

			// Create audit log
			await logAudit({
				actorId: ceoUser.id,
				action: AuditActions.AUTH_CEO_SETUP,
				targetType: 'USER',
				targetId: ceoUser.id,
				metadata: { email, username }
			});

			// Create session and set cookie
			const session = await createSession(ceoUser.id);
			setSessionCookie(cookies, session.id);

			throw redirect(303, '/');
		} catch (err: any) {
			if (err.status === 303) throw err;
			return fail(500, { error: err.message || 'Failed to initialize CEO account.' });
		}
	}
};
