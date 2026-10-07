import '../env';
import { DatabaseStore, dbStore } from './store';
import { PostgresStore } from './postgres';

export * from './schema';
export * from './types';
export * from './seed-data';
export { DatabaseStore, dbStore } from './store';
export { PostgresStore } from './postgres';

const databaseUrl = process.env.DATABASE_URL;
const isTest = Boolean(process.env.VITEST);

// In Vitest tests, use in-memory DatabaseStore for isolated, fast unit tests.
// In runtime / production / dev with DATABASE_URL provided, use PostgresStore connected to Neon DB.
export const db: DatabaseStore | PostgresStore =
	databaseUrl && !isTest ? new PostgresStore(databaseUrl) : dbStore;

if (!isTest) {
	console.log(
		databaseUrl
			? '[YOUTHs_CEO db] Connected to Neon PostgreSQL (DATABASE_URL detected)'
			: '[YOUTHs_CEO db] WARNING: DATABASE_URL not set — using in-memory store'
	);
}
