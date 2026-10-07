/**
 * Loads variables from the project's `.env` file into `process.env`.
 *
 * Vite/SvelteKit do NOT populate `process.env` from `.env` during `vite dev`,
 * so server code reading `process.env.DATABASE_URL` (etc.) would see `undefined`.
 * Variables already set in the real environment (e.g. on a host) take precedence.
 */
if (typeof process !== 'undefined' && typeof process.loadEnvFile === 'function') {
	try {
		process.loadEnvFile();
	} catch {
		// No .env file present (e.g. production with real env vars) — ignore.
	}
}

export {};
