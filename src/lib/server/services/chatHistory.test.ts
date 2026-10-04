import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import {
	getOrCreateDirectConversation,
	getUserConversations,
	getConversationMessages,
	getConversationMessagesPaginated,
	sendChatMessage,
	editChatMessage,
	deleteChatMessage,
	searchUserMessages,
	markConversationMessagesRead
} from './chatService';

describe('Persistent Chat History Service', () => {
	let ceoUser: any;
	let memberUserA: any;
	let memberUserB: any;

	beforeEach(async () => {
		db.resetForTesting();

		ceoUser = await db.createUser({
			fullName: 'CEO Administrator',
			username: 'ceo',
			email: 'ceo@youths.org',
			passwordHash: 'hash',
			role: 'CEO',
			accountStatus: 'ACTIVE'
		});

		memberUserA = await db.createUser({
			fullName: 'Alice Developer',
			username: 'alice',
			email: 'alice@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			accountStatus: 'ACTIVE'
		});

		memberUserB = await db.createUser({
			fullName: 'Bob Designer',
			username: 'bob',
			email: 'bob@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			accountStatus: 'ACTIVE'
		});
	});

	it('preserves conversation and messages across sessions and user returns', async () => {
		const conv = await getOrCreateDirectConversation(ceoUser.id, memberUserA.id);

		// Send messages
		await sendChatMessage({
			conversationId: conv.id,
			senderId: ceoUser.id,
			content: 'Hello Alice, welcome to YOUTHs!'
		});
		await sendChatMessage({
			conversationId: conv.id,
			senderId: memberUserA.id,
			content: 'Thank you CEO!'
		});

		// Simulate CEO returning / logging in later: fetch conversations
		const convs = await getUserConversations(ceoUser.id);
		expect(convs.length).toBe(1);
		expect(convs[0].id).toBe(conv.id);
		expect(convs[0].lastMessage?.content).toBe('Thank you CEO!');

		// Verify chronological messages
		const msgs = await getConversationMessages(conv.id, ceoUser.id);
		expect(msgs.length).toBe(2);
		expect(msgs[0].content).toBe('Hello Alice, welcome to YOUTHs!');
		expect(msgs[1].content).toBe('Thank you CEO!');
	});

	it('loads older messages via cursor-based pagination', async () => {
		const conv = await getOrCreateDirectConversation(ceoUser.id, memberUserA.id);

		// Seed 10 sequential messages
		const createdIds: string[] = [];
		for (let i = 1; i <= 10; i++) {
			const m = await sendChatMessage({
				conversationId: conv.id,
				senderId: i % 2 === 0 ? memberUserA.id : ceoUser.id,
				content: `Message ${i}`
			});
			createdIds.push(m.id);
		}

		// Initial page (most recent 4 messages)
		const page1 = await getConversationMessagesPaginated(conv.id, ceoUser.id, 4);
		expect(page1.messages.length).toBe(4);
		expect(page1.messages[3].content).toBe('Message 10');
		expect(page1.hasMore).toBe(true);
		expect(page1.nextCursor).toBe(page1.messages[0].id);

		// Cursor fetch older messages
		const page2 = await getConversationMessagesPaginated(conv.id, ceoUser.id, 4, page1.nextCursor!);
		expect(page2.messages.length).toBe(4);
		expect(page2.messages[3].content).toBe('Message 6');
		expect(page2.hasMore).toBe(true);

		// Fetch oldest page
		const page3 = await getConversationMessagesPaginated(conv.id, ceoUser.id, 4, page2.nextCursor!);
		expect(page3.messages.length).toBe(2);
		expect(page3.messages[0].content).toBe('Message 1');
		expect(page3.hasMore).toBe(false);
	});

	it('records message edit history and updates content', async () => {
		const conv = await getOrCreateDirectConversation(ceoUser.id, memberUserA.id);
		const msg = await sendChatMessage({
			conversationId: conv.id,
			senderId: ceoUser.id,
			content: 'Initial proposal draft'
		});

		const updated = await editChatMessage(msg.id, ceoUser.id, 'Revised proposal v2');
		expect(updated).not.null;
		expect(updated?.content).toBe('Revised proposal v2');
		expect(updated?.editedAt).not.null;

		// Check edit history
		const history = JSON.parse(updated?.editHistory || '[]');
		expect(history.length).toBe(1);
		expect(history[0].content).toBe('Initial proposal draft');
	});

	it('soft-deletes message and retains placeholder without destruction', async () => {
		const conv = await getOrCreateDirectConversation(ceoUser.id, memberUserA.id);
		const msg = await sendChatMessage({
			conversationId: conv.id,
			senderId: ceoUser.id,
			content: 'Confidential draft note'
		});

		const deleted = await deleteChatMessage(msg.id, ceoUser.id);
		expect(deleted).toBe(true);

		// Verify message record in DB has deletedAt set
		const inDb = await db.getMessageById(msg.id);
		expect(inDb?.deletedAt).not.null;

		// When querying conversation, soft-deleted message is preserved with timestamp
		const allInConv = await db.getMessages(conv.id);
		const target = allInConv.find((m) => m.id === msg.id);
		expect(target).toBeDefined();
		expect(target?.deletedAt).not.null;
	});

	it('searches message history by query, sender, and respects permissions', async () => {
		const conv1 = await getOrCreateDirectConversation(ceoUser.id, memberUserA.id);
		const conv2 = await getOrCreateDirectConversation(memberUserA.id, memberUserB.id);

		// Message in CEO's conversation
		await sendChatMessage({
			conversationId: conv1.id,
			senderId: memberUserA.id,
			content: 'Quarterly financial budget forecast report'
		});

		// Message in a conversation CEO is NOT in
		await sendChatMessage({
			conversationId: conv2.id,
			senderId: memberUserB.id,
			content: 'Private budget chat between Alice and Bob'
		});

		// CEO searches for "budget"
		const ceoResults = await searchUserMessages({
			currentUserId: ceoUser.id,
			query: 'budget'
		});

		expect(ceoResults.length).toBe(1);
		expect(ceoResults[0].message.content).toBe('Quarterly financial budget forecast report');
		expect(ceoResults[0].conversation.id).toBe(conv1.id);

		// Unauthorized access prevention: CEO search does not expose conv2 messages
		const hasConv2 = ceoResults.some((r) => r.conversation.id === conv2.id);
		expect(hasConv2).toBe(false);
	});

	it('tracks unread counts and read receipts accurately', async () => {
		const conv = await getOrCreateDirectConversation(ceoUser.id, memberUserA.id);

		// Alice sends 3 messages to CEO
		await sendChatMessage({ conversationId: conv.id, senderId: memberUserA.id, content: 'Update 1' });
		await sendChatMessage({ conversationId: conv.id, senderId: memberUserA.id, content: 'Update 2' });
		await sendChatMessage({ conversationId: conv.id, senderId: memberUserA.id, content: 'Update 3' });

		// CEO's unread count should be 3
		let convs = await getUserConversations(ceoUser.id);
		expect(convs[0].unreadCount).toBe(3);

		// CEO reads conversation
		const marked = await markConversationMessagesRead(conv.id, ceoUser.id);
		expect(marked).toBe(3);

		convs = await getUserConversations(ceoUser.id);
		expect(convs[0].unreadCount).toBe(0);
	});

	it('prevents unauthorized users from retrieving other private conversations', async () => {
		const privateConv = await getOrCreateDirectConversation(ceoUser.id, memberUserA.id);
		await sendChatMessage({
			conversationId: privateConv.id,
			senderId: ceoUser.id,
			content: 'Executive secret strategy'
		});

		// Bob (not in conversation) attempts to read messages
		await expect(getConversationMessages(privateConv.id, memberUserB.id)).rejects.toThrow(
			'Forbidden: You are not a participant in this conversation'
		);
	});
});
