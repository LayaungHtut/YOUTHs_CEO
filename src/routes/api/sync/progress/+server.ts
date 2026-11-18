import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	authenticateSyncToken,
	ingestProgressSync,
	SyncPayloadSchema,
	MAX_SYNC_BODY_BYTES
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

	// SAST-03: refuse oversized bodies, by declared length and by what actually arrives.
	const declaredLength = Number(request.headers.get('content-length') ?? '0');
	if (Number.isFinite(declaredLength) && declaredLength > MAX_SYNC_BODY_BYTES) {
		return json({ error: 'Request body too large' }, { status: 413 });
	}

	let body: unknown;
	try {
		const raw = await request.text();
		if (Buffer.byteLength(raw, 'utf8') > MAX_SYNC_BODY_BYTES) {
			return json({ error: 'Request body too large' }, { status: 413 });
		}
		body = JSON.parse(raw);
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const parseResult = SyncPayloadSchema.safeParse(body);
	if (!parseResult.success) {
		return json(
			{ error: 'Validation failed', details: parseResult.error.format() },
			{ status: 400 }
		);
	}

	try {
		const result = await ingestProgressSync(memberId, parseResult.data);
		return json(result);
	} catch (err) {
		return json(
			{ error: (err instanceof Error && err.message) || 'Failed to ingest progress sync' },
			{ status: 400 }
		);
	}
};
