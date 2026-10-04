import crypto from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { db } from '../db';
import type { User, Session } from '../db/types';

export const SESSION_COOKIE_NAME = 'youths_ceo_session';
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function generateSessionToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<Session> {
	const token = generateSessionToken();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
	return await db.createSession({
		id: token,
		userId,
		expiresAt,
		createdAt: new Date()
	});
}

export async function validateSessionToken(token: string): Promise<{ session: Session; user: User } | null> {
	if (!token) return null;
	const session = await db.getSession(token);
	if (!session) return null;

	const user = await db.getUserById(session.userId);
	if (!user || user.accountStatus !== 'ACTIVE') {
		await db.deleteSession(token);
		return null;
	}

	return { session, user };
}

export async function invalidateSession(token: string): Promise<void> {
	if (token) {
		await db.deleteSession(token);
	}
}

export function setSessionCookie(cookies: Cookies, token: string): void {
	cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_DURATION_MS / 1000
	});
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, {
		path: '/'
	});
}
