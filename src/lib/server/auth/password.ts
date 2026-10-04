import { hash, verify } from '@node-rs/argon2';

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

