import { fail, redirect, isRedirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { timingSafeEqual } from 'node:crypto';
import { db } from '$lib/server/db';
import { hashPassword, validatePasswordStrength } from '$lib/server/auth/password';
import { createSession, setSessionCookie } from '$lib/server/auth/session';
import { logAudit, AuditActions } from '$lib/server/services/auditService';
import { grantInitialPoints } from '$lib/server/services/pointsService';
import { consumeRateLimit, peekRateLimit } from '$lib/server/security/rateLimit';

// Fails closed: anything other than an explicit development run is treated as deployed,
// so a missing NODE_ENV still requires the bootstrap secret.
const isDevelopment = process.env.NODE_ENV === 'development';

// SAST-05: the setup key is a credential, so guessing it is throttled per client IP.
const SETUP_WINDOW_MS = 15 * 60 * 1000;
const MAX_SETUP_ATTEMPTS_PER_IP = 5;

/** Constant-time comparison so the setup key can't be recovered by timing the response. */
function timingSafeEquals(a: string | undefined, b: string): boolean {
	const aBuf = Buffer.from(a ?? '', 'utf8');
	const bBuf = Buffer.from(b, 'utf8');
	if (aBuf.length !== bBuf.length) return false;
	return timingSafeEqual(aBuf, bBuf);
}

export const load: PageServerLoad = async () => {
	const ceoCount = await db.countCeoUsers();
	if (ceoCount > 0) {
		throw redirect(303, '/login');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const rateKey = `setup:ip:${getClientAddress()}`;
		if (!peekRateLimit(rateKey, MAX_SETUP_ATTEMPTS_PER_IP).allowed) {
			return fail(429, {
				error: 'Too many setup attempts. Please wait a few minutes and try again.'
			});
		}

		const ceoCount = await db.countCeoUsers();
		if (ceoCount > 0) {
			return fail(400, {
				error: 'CEO account has already been initialized. Setup is permanently locked.'
			});
		}

		const data = await request.formData();
		const fullName = (data.get('fullName') as string)?.trim();
		const username = (data.get('username') as string)?.trim().toLowerCase();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const password = data.get('password') as string;
		const confirmPassword = data.get('confirmPassword') as string;
		const setupSecret = (data.get('setupSecret') as string)?.trim();

		// SAST-02: the bootstrap secret is mandatory outside local development, so a
		// publicly reachable /setup route can never be claimed by an anonymous visitor.
		const envSecret = process.env.CEO_SETUP_SECRET;
		if (!isDevelopment && !envSecret) {
			console.error(
				'[setup] CEO_SETUP_SECRET is not configured; refusing first-run CEO bootstrap.'
			);
			return fail(503, {
				error: 'Initial setup is disabled: CEO_SETUP_SECRET is not configured on this server.'
			});
		}
		if (envSecret && !timingSafeEquals(setupSecret, envSecret)) {
			consumeRateLimit(rateKey, MAX_SETUP_ATTEMPTS_PER_IP, SETUP_WINDOW_MS);
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
			return fail(400, {
				error: strength.message || 'Password does not meet complexity requirements.'
			});
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
		} catch (err) {
			if (isRedirect(err)) throw err;
			return fail(500, {
				error: (err instanceof Error && err.message) || 'Failed to initialize CEO account.'
			});
		}
	}
};
