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

	try {
		const receipt = await markChatRead(body.messageId, locals.user.id);
		if (!receipt) {
			return json({ error: 'Message not found' }, { status: 404 });
		}
	} catch (err) {
		if (err instanceof Error && err.message.startsWith('Forbidden')) {
			return json({ error: err.message }, { status: 403 });
		}
		throw err;
	}

	return json({ success: true });
};
