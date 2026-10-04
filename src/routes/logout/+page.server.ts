import { redirect, type Actions } from '@sveltejs/kit';
import { clearSessionCookie, invalidateSession, SESSION_COOKIE_NAME } from '$lib/server/auth/session';
import { logAudit, AuditActions } from '$lib/server/services/auditService';

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		const token = cookies.get(SESSION_COOKIE_NAME);
		if (token) {
			await invalidateSession(token);
		}
		if (locals.user) {
			await logAudit({
				actorId: locals.user.id,
				action: AuditActions.AUTH_LOGOUT,
				targetType: 'USER',
				targetId: locals.user.id
			});
		}
		clearSessionCookie(cookies);
		throw redirect(303, '/login');
	}
};
