import EventEmitter from 'node:events';
import { db } from '../db';
import type { Conversation, Message, User } from '../db/types';
import { createNotification } from './notificationService';

// Real-time chat event emitter for SSE
class ChatPubSub extends EventEmitter {}
export const chatEmitter = new ChatPubSub();
chatEmitter.setMaxListeners(200);

export async function getOrCreateDirectConversation(userAId: string, userBId: string): Promise<Conversation> {
	const existing = await db.getDirectConversation(userAId, userBId);
	if (existing) return existing;

	return await db.createConversation('DIRECT', [userAId, userBId]);
}

export interface UserConversationSummary {
	id: string;
	conversationType: 'DIRECT' | 'DEPARTMENT';
	otherUser: User | null;
	lastMessage: Message | null;
	unreadCount: number;
	updatedAt: Date;
}

export async function getUserConversations(userId: string): Promise<UserConversationSummary[]> {
	const rawConvs = await db.getConversationsForUser(userId);
	const results: UserConversationSummary[] = [];

	for (const conv of rawConvs) {
		const participantIds = await db.getConversationParticipants(conv.id);
		const otherUserId = participantIds.find((id) => id !== userId);
		let otherUser: User | null = null;
		if (otherUserId) {
			otherUser = await db.getUserById(otherUserId);
		}

		const messages = await db.getMessages(conv.id, 1);
		const lastMessage = messages[messages.length - 1] || null;
		const unreadCount = await db.getUnreadCountForConversation(conv.id, userId);

		results.push({
			id: conv.id,
			conversationType: conv.conversationType,
			otherUser,
			lastMessage,
			unreadCount,
			updatedAt: conv.updatedAt
		});
	}

	return results;
}

export async function getConversationMessages(conversationId: string, userId: string, limit = 50) {
	// Verify participation
	const participants = await db.getConversationParticipants(conversationId);
	if (!participants.includes(userId)) {
		throw new Error('Forbidden: You are not a participant in this conversation');
	}

	const msgs = await db.getMessages(conversationId, limit);
	return msgs;
}

export async function getConversationMessagesPaginated(
	conversationId: string,
	userId: string,
	limit = 30,
	cursor?: string
) {
	const participants = await db.getConversationParticipants(conversationId);
	if (!participants.includes(userId)) {
		throw new Error('Forbidden: You are not a participant in this conversation');
	}

	return await db.getMessagesPaginated(conversationId, limit, cursor, 'before');
}

export async function sendChatMessage(params: {
	conversationId: string;
	senderId: string;
	content: string;
	messageType?: 'TEXT' | 'SYSTEM' | 'FILE';
}): Promise<Message> {
	const trimmed = params.content.trim();
	if (!trimmed) throw new Error('Message content cannot be empty');

	const participants = await db.getConversationParticipants(params.conversationId);
	if (!participants.includes(params.senderId)) {
		throw new Error('Forbidden: You are not a participant in this conversation');
	}

	const message = await db.createMessage({
		conversationId: params.conversationId,
		senderId: params.senderId,
		content: trimmed,
		messageType: params.messageType || 'TEXT'
	});

	// Emit real-time event
	chatEmitter.emit(`conversation:${params.conversationId}`, message);

	// Dispatch notification to other participants
	const sender = await db.getUserById(params.senderId);
	for (const pId of participants) {
		if (pId !== params.senderId) {
			chatEmitter.emit(`user:${pId}`, message);
			await createNotification({
				userId: pId,
				type: 'MESSAGE',
				title: `New message from ${sender?.fullName || 'User'}`,
				message: trimmed.length > 60 ? trimmed.slice(0, 57) + '...' : trimmed,
				referenceId: params.conversationId
			});
		}
	}

	return message;
}

export async function editChatMessage(messageId: string, userId: string, newContent: string): Promise<Message | null> {
	const msg = await db.getMessageById(messageId);
	if (!msg) return null;
	if (msg.senderId !== userId) {
		throw new Error('Forbidden: Only the sender can edit this message');
	}

	const updated = await db.updateMessage(messageId, newContent);
	if (updated) {
		chatEmitter.emit(`conversation:${updated.conversationId}`, {
			...updated,
			action: 'EDIT'
		});
	}
	return updated;
}

export async function deleteChatMessage(messageId: string, userId: string): Promise<boolean> {
	const msg = await db.getMessageById(messageId);
	if (!msg) return false;
	if (msg.senderId !== userId) {
		throw new Error('Forbidden: Only the sender can delete this message');
	}

	const success = await db.deleteMessage(messageId);
	if (success) {
		chatEmitter.emit(`conversation:${msg.conversationId}`, {
			id: messageId,
			conversationId: msg.conversationId,
			deletedAt: new Date(),
			action: 'DELETE'
		});
	}
	return success;
}

export async function markChatRead(messageId: string, userId: string) {
	return await db.markMessageRead(messageId, userId);
}

export async function markConversationMessagesRead(conversationId: string, userId: string) {
	const count = await db.markConversationRead(conversationId, userId);
	if (count > 0) {
		chatEmitter.emit(`conversation:${conversationId}:read`, { userId });
	}
	return count;
}

export async function searchUserMessages(params: {
	currentUserId: string;
	query?: string;
	participantId?: string;
	senderId?: string;
	startDate?: Date;
	endDate?: Date;
}) {
	return await db.searchMessages(params);
}
