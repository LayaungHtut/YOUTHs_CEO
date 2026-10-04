import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'CEO') {
		return json({ error: 'Unauthorized: CEO access required' }, { status: 403 });
	}

	let body: { apiKey?: string; model?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const apiKey = body.apiKey || process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		return json({ error: 'API key not provided' }, { status: 400 });
	}

	const model = body.model || 'anthropic/claude-3.5-sonnet';

	try {
		const start = Date.now();
		const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
				'HTTP-Referer': 'https://youths-org.com',
				'X-Title': 'YOUTHs CEO Command Center'
			},
			body: JSON.stringify({
				model,
				messages: [
					{
						role: 'user',
						content: 'Respond with exactly: {"status":"healthy","provider":"OpenRouter"}'
					}
				],
				max_tokens: 50
			})
		});

		const latency = Date.now() - start;

		if (!res.ok) {
			const errorText = await res.text();
			return json(
				{
					success: false,
					status: res.status,
					error: `OpenRouter returned status ${res.status}: ${errorText}`
				},
				{ status: 400 }
			);
		}

		const data = await res.json();
		return json({
			success: true,
			model,
			latencyMs: latency,
			response: data.choices?.[0]?.message?.content
		});
	} catch (err: any) {
		return json(
			{
				success: false,
				error: err.message || 'Connection failed'
			},
			{ status: 500 }
		);
	}
};
