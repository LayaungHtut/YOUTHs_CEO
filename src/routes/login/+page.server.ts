import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession, setSessionCookie } from '$lib/server/auth/session';
import { logAudit, AuditActions } from '$lib/server/services/auditService';
import { consumeRateLimit, peekRateLimit, resetRateLimit } from '$lib/server/security/rateLimit';

// SAST-05: throttle failed logins per client IP and per submitted identifier.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IP = 10;
const MAX_FAILURES_PER_IDENTIFIER = 5;
// Deliberately identical to the invalid-credentials message so throttling does
// not reveal whether an account exists.
const THROTTLED_MESSAGE =
	'Too many failed sign-in attempts. Please wait a few minutes and try again.';

// Only same-site paths: "//evil.com" and "https://evil.com" would send the user off-site.
function safeRedirect(url: URL): string {
	const target = url.searchParams.get('redirect') || '/';
	return target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/\\')
		? target
		: '/';
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
	default: async ({ request, cookies, url, getClientAddress }) => {
		const data = await request.formData();
		const identifier = (data.get('identifier') as string)?.trim().toLowerCase();
		const password = data.get('password') as string;
		const redirectTo = safeRedirect(url);

		if (!identifier || !password) {
			return fail(400, { error: 'Username/Email and Password are required.' });
		}

		const ipKey = `login:ip:${getClientAddress()}`;
		const idKey = `login:id:${identifier}`;

		// Check before doing any password work, so a locked-out caller costs nothing.
		const ipState = peekRateLimit(ipKey, MAX_FAILURES_PER_IP);
		const idState = peekRateLimit(idKey, MAX_FAILURES_PER_IDENTIFIER);
		if (!ipState.allowed || !idState.allowed) {
			return fail(429, {
				error: THROTTLED_MESSAGE,
				retryAfterSeconds: Math.max(ipState.retryAfterSeconds, idState.retryAfterSeconds)
			});
		}

		/** Counts this attempt as a failure and returns the response to send. */
		const rejectAttempt = (status: number, error: string) => {
			consumeRateLimit(ipKey, MAX_FAILURES_PER_IP, LOGIN_WINDOW_MS);
			consumeRateLimit(idKey, MAX_FAILURES_PER_IDENTIFIER, LOGIN_WINDOW_MS);
			return fail(status, { error });
		};

		// Lookup by email or username
		let user = await db.getUserByEmail(identifier);
		if (!user) {
			user = await db.getUserByUsername(identifier);
		}

		if (!user) {
			return rejectAttempt(401, 'Invalid credentials. Please verify your login details.');
		}

		if (user.accountStatus === 'SUSPENDED') {
			return rejectAttempt(403, 'Account suspended. Contact system administration.');
		}

		const isValid = await verifyPassword(password, user.passwordHash);
		if (!isValid) {
			return rejectAttempt(401, 'Invalid credentials. Please verify your login details.');
		}

		// Checked after the password, so this message doesn't reveal which accounts exist.
		if (user.role !== 'CEO') {
			return rejectAttempt(
				403,
				'This portal is for the CEO only. Please use the Head or Member app.'
			);
		}

		// Successful login: clear the throttling counters for this caller.
		resetRateLimit(ipKey);
		resetRateLimit(idKey);

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
