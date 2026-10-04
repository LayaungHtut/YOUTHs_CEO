import { error } from '@sveltejs/kit';
import type { User, UserRole } from '../db/types';

export function hasRole(user: User | null | undefined, roles: UserRole | UserRole[]): boolean {
	if (!user) return false;
	const allowed = Array.isArray(roles) ? roles : [roles];
	return allowed.includes(user.role);
}

export function requireRole(user: User | null | undefined, roles: UserRole | UserRole[]): User {
	if (!user) {
		throw error(401, { message: 'Authentication required' });
	}
	if (!hasRole(user, roles)) {
		throw error(403, { message: 'Access denied: insufficient permissions' });
	}
	return user;
}

export function canManageDepartment(
	user: User,
	departmentId: string
): boolean {
	if (user.role === 'CEO') return true;
	if (user.role === 'HEAD' && user.departmentId === departmentId) return true;
	return false;
}

export function canManageMember(
	actor: User,
	targetMember: User
): boolean {
	if (actor.role === 'CEO') return true;
	if (
		actor.role === 'HEAD' &&
		actor.departmentId &&
		actor.departmentId === targetMember.departmentId &&
		targetMember.role === 'MEMBER'
	) {
		return true;
	}
	return false;
}
