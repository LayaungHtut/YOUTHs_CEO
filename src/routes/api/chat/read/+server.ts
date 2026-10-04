import { json, type RequestHandler } from '@sveltejs/kit';
import { markChatRead } from '$lib/server/services/chatService';

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

	await markChatRead(body.messageId, locals.user.id);
	return json({ success: true });
};
