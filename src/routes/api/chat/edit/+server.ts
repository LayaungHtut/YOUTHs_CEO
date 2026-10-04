import { json, type RequestHandler } from '@sveltejs/kit';
import { editChatMessage } from '$lib/server/services/chatService';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: { messageId?: string; content?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	if (!body.messageId || !body.content?.trim()) {
		return json({ error: 'messageId and content are required' }, { status: 400 });
	}

	try {
		const updated = await editChatMessage(body.messageId, locals.user.id, body.content.trim());
		if (!updated) {
			return json({ error: 'Message not found' }, { status: 404 });
		}
		return json({ success: true, message: updated });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to edit message' }, { status: 403 });
	}
};

