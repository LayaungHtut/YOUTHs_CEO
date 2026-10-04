import type { RequestHandler } from '@sveltejs/kit';
import { chatEmitter } from '$lib/server/services/chatService';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const userId = locals.user.id;

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			function sendEvent(type: string, data: any) {
				const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
				controller.enqueue(encoder.encode(payload));
			}

			// Send connected acknowledgment
			sendEvent('connected', { userId, timestamp: new Date().toISOString() });

			// Listener for user-specific direct events (e.g. notifications, incoming DMs)
			const userListener = (msg: any) => {
				sendEvent('message', msg);
			};
			chatEmitter.on(`user:${userId}`, userListener);

			// Periodic heartbeat to prevent timeout
			const heartbeatInterval = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': heartbeat\n\n'));
				} catch {
					clearInterval(heartbeatInterval);
				}
			}, 25000);

			return () => {
				clearInterval(heartbeatInterval);
				chatEmitter.off(`user:${userId}`, userListener);
			};
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive'
		}
	});
};
