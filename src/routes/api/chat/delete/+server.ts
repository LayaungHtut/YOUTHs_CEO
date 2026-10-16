import { json, type RequestHandler } from '@sveltejs/kit';
import { deleteChatMessage } from '$lib/server/services/chatService';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: { messageId?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	if (!body.messageId) {
		return json({ error: 'messageId is required' }, { status: 400 });
	}

	try {
		const success = await deleteChatMessage(body.messageId, locals.user.id);
		return json({ success });
	} catch (err) {
		return json({ error: (err instanceof Error && err.message) || 'Failed to delete message' }, { status: 403 });
	}
};

