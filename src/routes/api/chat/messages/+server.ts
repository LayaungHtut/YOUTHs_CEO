import { json, type RequestHandler } from '@sveltejs/kit';
import { getConversationMessagesPaginated } from '$lib/server/services/chatService';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const convId = url.searchParams.get('convId');
	if (!convId) {
		return json({ error: 'convId is required' }, { status: 400 });
	}

	const cursor = url.searchParams.get('cursor') || undefined;
	const limitParam = url.searchParams.get('limit');
	const limit = limitParam ? parseInt(limitParam, 10) : 30;

	try {
		const result = await getConversationMessagesPaginated(convId, locals.user.id, limit, cursor);
		return json({ success: true, ...result });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to fetch messages' }, { status: 403 });
	}
};

