import { json, type RequestHandler } from '@sveltejs/kit';
import { sendChatMessage } from '$lib/server/services/chatService';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: { conversationId?: string; content?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	if (!body.conversationId || !body.content) {
		return json({ error: 'conversationId and content are required' }, { status: 400 });
	}

	try {
		const message = await sendChatMessage({
			conversationId: body.conversationId,
			senderId: locals.user.id,
			content: body.content
		});
		return json({ success: true, message });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to send message' }, { status: 400 });
	}
};
