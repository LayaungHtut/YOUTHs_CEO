import { describe, it, expect } from 'vitest';
import {
	hashPassword,
	verifyPassword,
	validatePasswordStrength,
	generateTemporaryPassword
} from './password';
import { hasRole } from './permissions';
import type { User } from '../db/types';

describe('Auth & Cryptography', () => {
	it('hashes and verifies passwords using Argon2id', async () => {
		const password = 'StrongPassword123!';
		const hash = await hashPassword(password);

		expect(hash).toContain('$argon2id$');

		const isValid = await verifyPassword(password, hash);
		expect(isValid).toBe(true);

		const isWrong = await verifyPassword('WrongPassword123!', hash);
		expect(isWrong).toBe(false);
	});

	it('validates password strength rules', () => {
		expect(validatePasswordStrength('short').valid).toBe(false);
		expect(validatePasswordStrength('alllowercase1').valid).toBe(false);
		expect(validatePasswordStrength('ALLUPPERCASE1').valid).toBe(false);
		expect(validatePasswordStrength('NoNumbersHere').valid).toBe(false);
		expect(validatePasswordStrength('ValidP@ssw0rd').valid).toBe(true);
	});

	it('generates secure temporary passwords satisfying strength criteria', () => {
		for (let i = 0; i < 20; i++) {
			const tempPassword = generateTemporaryPassword();
			expect(tempPassword.length).toBeGreaterThanOrEqual(14);
			const strength = validatePasswordStrength(tempPassword);
			expect(strength.valid).toBe(true);
		}
	});

	it('enforces RBAC permissions', () => {
		const ceoUser: User = {
			id: '1',
			fullName: 'CEO User',
			username: 'ceo',
			email: 'ceo@youths.org',
			passwordHash: 'hash',
			role: 'CEO',
			departmentId: null,
			avatarUrl: null,
			accountStatus: 'ACTIVE',
			createdAt: new Date(),
			updatedAt: new Date(),
			lastLoginAt: null,
			mustChangePassword: false
		};

		const memberUser: User = {
			...ceoUser,
			id: '2',
			role: 'MEMBER'
		};

		expect(hasRole(ceoUser, 'CEO')).toBe(true);
		expect(hasRole(ceoUser, ['CEO', 'HEAD'])).toBe(true);
		expect(hasRole(memberUser, 'CEO')).toBe(false);
		expect(hasRole(memberUser, ['HEAD', 'MEMBER'])).toBe(true);
	});
});
