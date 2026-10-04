import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	authenticateSyncToken,
	ingestProgressSync,
	SyncPayloadSchema
} from '$lib/server/services/progressSyncService';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
	}

	const token = authHeader.slice(7).trim();
	const memberId = await authenticateSyncToken(token);
	if (!memberId) {
		return json({ error: 'Invalid or revoked token' }, { status: 403 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const parseResult = SyncPayloadSchema.safeParse(body);
	if (!parseResult.success) {
		return json({ error: 'Validation failed', details: parseResult.error.format() }, { status: 400 });
	}

	try {
		const result = await ingestProgressSync(memberId, parseResult.data);
		return json(result);
	} catch (err: any) {
		return json({ error: err.message || 'Failed to ingest progress sync' }, { status: 400 });
	}
};

