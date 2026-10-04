import { json, type RequestHandler } from '@sveltejs/kit';
import { searchUserMessages } from '$lib/server/services/chatService';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const query = url.searchParams.get('query') || undefined;
	const participantId = url.searchParams.get('participantId') || undefined;
	const senderId = url.searchParams.get('senderId') || undefined;
	const startDateStr = url.searchParams.get('startDate');
	const endDateStr = url.searchParams.get('endDate');

	const startDate = startDateStr ? new Date(startDateStr) : undefined;
	const endDate = endDateStr ? new Date(endDateStr) : undefined;

	try {
		const results = await searchUserMessages({
			currentUserId: locals.user.id,
			query,
			participantId,
			senderId,
			startDate,
			endDate
		});

		// Map results with safe user presentation
		const formatted = results.map((r: any) => ({
			message: {
				id: r.message.id,
				conversationId: r.message.conversationId,
				content: r.message.content,
				messageType: r.message.messageType,
				createdAt: r.message.createdAt,
				editedAt: r.message.editedAt,
				deletedAt: r.message.deletedAt
			},
			conversation: {
				id: r.conversation.id,
				conversationType: r.conversation.conversationType
			},
			sender: r.sender
				? {
						id: r.sender.id,
						fullName: r.sender.fullName,
						username: r.sender.username,
						role: r.sender.role
				  }
				: null,
			otherParticipant: r.otherParticipant
				? {
						id: r.otherParticipant.id,
						fullName: r.otherParticipant.fullName,
						username: r.otherParticipant.username,
						role: r.otherParticipant.role
				  }
				: null
		}));

		return json({ success: true, results: formatted });
	} catch (err: any) {
		return json({ error: err.message || 'Search failed' }, { status: 500 });
	}
};

