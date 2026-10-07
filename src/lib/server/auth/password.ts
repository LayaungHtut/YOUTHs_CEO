import { hash, verify } from '@node-rs/argon2';
import crypto from 'node:crypto';

// Argon2id options conforming to OWASP recommendations
const ARGON2_OPTIONS = {
	memoryCost: 19456, // 19 MiB
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
};

/**
 * Hashes a plaintext password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
	if (!password || password.length < 8) {
		throw new Error('Password must be at least 8 characters long');
	}
	return await hash(password, ARGON2_OPTIONS);
}

/**
 * Verifies a plaintext password against an Argon2id hash
 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
	if (!password || !passwordHash) return false;
	try {
		return await verify(passwordHash, password);
	} catch {
		return false;
	}
}

/**
 * Validates password strength: at least 8 characters, containing uppercase, lowercase, and a number.
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
	if (password.length < 8) {
		return { valid: false, message: 'Password must be at least 8 characters long.' };
	}
	if (!/[A-Z]/.test(password)) {
		return { valid: false, message: 'Password must contain at least one uppercase letter.' };
	}
	if (!/[a-z]/.test(password)) {
		return { valid: false, message: 'Password must contain at least one lowercase letter.' };
	}
	if (!/[0-9]/.test(password)) {
		return { valid: false, message: 'Password must contain at least one number.' };
	}
	return { valid: true };
}

/**
 * Generates a cryptographically secure temporary password conforming to password strength rules:
 * at least 14 characters, containing uppercase, lowercase, numbers, and symbols.
 */
export function generateTemporaryPassword(): string {
	const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
	const lower = 'abcdefghijkmnopqrstuvwxyz';
	const digits = '23456789';
	const special = '!@#$%&*';

	const getRandom = (chars: string) => chars[crypto.randomInt(chars.length)];

	const parts = [
		getRandom(upper),
		getRandom(upper),
		getRandom(lower),
		getRandom(lower),
		getRandom(digits),
		getRandom(digits),
		getRandom(special),
		getRandom(special)
	];

	const all = upper + lower + digits + special;
	for (let i = 0; i < 6; i++) {
		parts.push(getRandom(all));
	}

	// Shuffle with Fisher-Yates using cryptographically secure random integers
	for (let i = parts.length - 1; i > 0; i--) {
		const j = crypto.randomInt(i + 1);
		[parts[i], parts[j]] = [parts[j], parts[i]];
	}

	return parts.join('');
}
