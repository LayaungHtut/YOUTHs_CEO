import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession, setSessionCookie } from '$lib/server/auth/session';
import { logAudit, AuditActions } from '$lib/server/services/auditService';

// Only same-site paths: "//evil.com" and "https://evil.com" would send the user off-site.
function safeRedirect(url: URL): string {
	const target = url.searchParams.get('redirect') || '/';
	return target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/\\') ? target : '/';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		if (locals.user.mustChangePassword) {
			throw redirect(303, '/change-password');
		}
		throw redirect(303, safeRedirect(url));
	}
	return {
		redirect: safeRedirect(url)
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const identifier = (data.get('identifier') as string)?.trim().toLowerCase();
		const password = data.get('password') as string;
		const redirectTo = safeRedirect(url);

		if (!identifier || !password) {
			return fail(400, { error: 'Username/Email and Password are required.' });
		}

		// Lookup by email or username
		let user = await db.getUserByEmail(identifier);
		if (!user) {
			user = await db.getUserByUsername(identifier);
		}

		if (!user) {
			return fail(401, { error: 'Invalid credentials. Please verify your login details.' });
		}

		if (user.accountStatus === 'SUSPENDED') {
			return fail(403, { error: 'Account suspended. Contact system administration.' });
		}

		const isValid = await verifyPassword(password, user.passwordHash);
		if (!isValid) {
			return fail(401, { error: 'Invalid credentials. Please verify your login details.' });
		}

		// Checked after the password, so this message doesn't reveal which accounts exist.
		if (user.role !== 'CEO') {
			return fail(403, { error: 'This portal is for the CEO only. Please use the Head or Member app.' });
		}

		// Update last login timestamp
		await db.updateUser(user.id, { lastLoginAt: new Date() });

		// Audit log
		await logAudit({
			actorId: user.id,
			action: AuditActions.AUTH_LOGIN,
			targetType: 'USER',
			targetId: user.id,
			metadata: { role: user.role }
		});

		// Create session
		const session = await createSession(user.id);
		setSessionCookie(cookies, session.id);

		if (user.mustChangePassword) {
			throw redirect(303, '/change-password');
		}

		throw redirect(303, redirectTo);
	}
};
