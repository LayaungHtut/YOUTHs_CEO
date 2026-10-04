import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { db } from '$lib/server/db';
import { SESSION_COOKIE_NAME, validateSessionToken } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);
	if (token) {
		const auth = await validateSessionToken(token);
		if (auth) {
			event.locals.session = auth.session;
			event.locals.user = auth.user;
		} else {
			event.locals.session = null;
			event.locals.user = null;
		}
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}

	const path = event.url.pathname;
	const ceoCount = await db.countCeoUsers();

	// First-run: If no CEO exists yet, allow /setup and redirect other routes to /setup
	if (ceoCount === 0) {
		if (path !== '/setup' && !path.startsWith('/api/')) {
			throw redirect(303, '/setup');
		}
		return resolve(event);
	}

	// If CEO already exists, lock /setup and redirect to /login
	if (path === '/setup') {
		throw redirect(303, '/login');
	}

	// Allow public auth endpoints and sync webhook
	if (path === '/login' || path.startsWith('/api/sync/')) {
		if (path === '/login' && event.locals.user) {
			throw redirect(303, '/');
		}
		return resolve(event);
	}

	// For all other routes, require authenticated session
	if (!event.locals.user) {
		throw redirect(303, `/login?redirect=${encodeURIComponent(path)}`);
	}

	return resolve(event);
};
