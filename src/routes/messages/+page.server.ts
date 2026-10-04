import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import type { Message } from '$lib/server/db/types';
import { requireRole } from '$lib/server/auth/permissions';
import {
	getUserConversations,
	getConversationMessages,
	getOrCreateDirectConversation,
	sendChatMessage,
	editChatMessage,
	deleteChatMessage,
	markConversationMessagesRead,
	type UserConversationSummary
} from '$lib/server/services/chatService';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireRole(locals.user, ['CEO', 'HEAD', 'MEMBER']);

	const userId = locals.user!.id;
	const requestedUserId = url.searchParams.get('userId');
	let activeConversationId = url.searchParams.get('convId');

	// If userId is passed in URL query, ensure direct conversation exists
	if (requestedUserId && requestedUserId !== userId) {
		const conv = await getOrCreateDirectConversation(userId, requestedUserId);
		activeConversationId = conv.id;
	}

	const conversations = await getUserConversations(userId);

	// Select first conversation if none specified
	if (!activeConversationId && conversations.length > 0) {
		activeConversationId = conversations[0].id;
	}

	let activeMessages: Message[] = [];
	let activeConversation: UserConversationSummary | null = null;

	if (activeConversationId) {
		activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
		try {
			activeMessages = await getConversationMessages(activeConversationId, userId, 60);
			await markConversationMessagesRead(activeConversationId, userId);
		} catch {
			activeMessages = [];
		}
	}

	const allUsers = await db.getAllUsers({ accountStatus: 'ACTIVE' });
	const eligiblePartners = allUsers.filter((u) => u.id !== userId);

	return {
		conversations,
		activeConversationId,
		activeConversation,
		activeMessages,
		eligiblePartners
	};
};

export const actions: Actions = {
	sendMessage: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const conversationId = data.get('conversationId') as string;
		const content = (data.get('content') as string)?.trim();

		if (!conversationId || !content) {
			return fail(400, { error: 'Message content cannot be empty' });
		}

		try {
			const message = await sendChatMessage({
				conversationId,
				senderId: user.id,
				content
			});
			return { success: true, messageId: message.id };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed to send message';
			return fail(500, { error: msg });
		}
	},

	startConversation: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const targetUserId = data.get('targetUserId') as string;

		if (!targetUserId) return fail(400, { error: 'Target user is required' });

		const conv = await getOrCreateDirectConversation(user.id, targetUserId);
		throw redirect(303, `/messages?convId=${conv.id}`);
	},

	editMessage: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const messageId = data.get('messageId') as string;
		const content = (data.get('content') as string)?.trim();

		if (!messageId || !content) return fail(400, { error: 'Content required' });

		await editChatMessage(messageId, user.id, content);
		return { success: true };
	},

	deleteMessage: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const messageId = data.get('messageId') as string;

		await deleteChatMessage(messageId, user.id);
		return { success: true };
	}
};
