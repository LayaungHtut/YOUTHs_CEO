<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		MessageSquare,
		Send,
		UserPlus,
		Search,
		MoreHorizontal,
		Trash2,
		Edit2,
		Check,
		Clock,
		X
	} from '@lucide/svelte';

	let { data, form } = $props();

	let messages = $state<any[]>([]);
	let messageInput = $state('');
	let showNewChatModal = $state(false);
	let sseSource: EventSource | null = null;
	let chatContainer = $state<HTMLDivElement | null>(null);

	// Update local messages when active conversation changes
	$effect(() => {
		messages = data.activeMessages;
		scrollToBottom();
	});

	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 50);
	}

	onMount(() => {
		scrollToBottom();

		// Connect to real-time Server-Sent Events stream
		try {
			sseSource = new EventSource('/api/chat/stream');
			sseSource.onmessage = (event) => {
				try {
					const incoming = JSON.parse(event.data);
					if (incoming.conversationId === data.activeConversationId) {
						if (incoming.action === 'DELETE') {
							messages = messages.filter((m) => m.id !== incoming.id);
						} else if (incoming.action === 'EDIT') {
							messages = messages.map((m) => (m.id === incoming.id ? incoming : m));
						} else {
							// Append new incoming message if not already present
							if (!messages.some((m) => m.id === incoming.id)) {
								messages = [...messages, incoming];
								scrollToBottom();
							}
						}
					}
				} catch {
					// Heartbeat or unparseable event
				}
			};
		} catch (err) {
			console.warn('Real-time SSE unavailable, using standard request sync:', err);
		}
	});

	onDestroy(() => {
		if (sseSource) {
			sseSource.close();
		}
	});

	async function handleSend(e: SubmitEvent) {
		e.preventDefault();
		const text = messageInput.trim();
		if (!text || !data.activeConversationId) return;

		messageInput = '';

		try {
			const res = await fetch('/api/chat/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					conversationId: data.activeConversationId,
					content: text
				})
			});
			const resData = await res.json();
			if (resData.success && resData.message) {
				if (!messages.some((m) => m.id === resData.message.id)) {
					messages = [...messages, resData.message];
					scrollToBottom();
				}
			}
		} catch (err) {
			console.error('Failed to send chat message:', err);
		}
	}
</script>

<div class="h-[calc(100vh-8rem)] flex flex-col md:flex-row rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-2xl">
	<!-- Left: Conversation Sidebar -->
	<div class="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/60">
		<div class="p-4 border-b border-slate-800 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<MessageSquare class="w-4 h-4 text-indigo-400" />
				<h2 class="text-sm font-bold text-white tracking-tight">Direct Communications</h2>
			</div>
			<button
				type="button"
				onclick={() => (showNewChatModal = true)}
				class="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition text-xs flex items-center gap-1 font-semibold"
				title="Start new direct message"
			>
				<UserPlus class="w-3.5 h-3.5" />
				<span>New</span>
			</button>
		</div>

		<!-- Conversation List -->
		<div class="flex-1 overflow-y-auto divide-y divide-slate-800/60">
			{#if data.conversations.length === 0}
				<div class="p-8 text-center text-xs text-slate-500">
					No active conversations. Click "New" to start communicating with any member or Head.
				</div>
			{:else}
				{#each data.conversations as conv}
					{@const isSelected = conv.id === data.activeConversationId}
					<a
						href={`/messages?convId=${conv.id}`}
						class={`p-3.5 flex items-center gap-3 transition block ${
							isSelected ? 'bg-indigo-600/15 border-l-2 border-indigo-500' : 'hover:bg-slate-900/60'
						}`}
					>
						<div class="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
							{conv.otherUser?.fullName.slice(0, 2).toUpperCase() || 'Y'}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between">
								<h4 class="text-xs font-bold text-white truncate">
									{conv.otherUser?.fullName || 'Organization Chat'}
								</h4>
								<span class="text-[10px] text-slate-500">
									{new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
							<div class="text-[11px] text-slate-400 truncate mt-0.5">
								{conv.lastMessage ? conv.lastMessage.content : 'No messages yet'}
							</div>
						</div>
					</a>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Right: Active Chat Window -->
	<div class="flex-1 flex flex-col bg-slate-900/60 min-w-0">
		{#if data.activeConversation}
			<!-- Chat Header -->
			<div class="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
						{data.activeConversation.otherUser?.fullName.slice(0, 2).toUpperCase() || 'Y'}
					</div>
					<div>
						<h3 class="text-sm font-bold text-white">
							{data.activeConversation.otherUser?.fullName || 'Organization Conversation'}
						</h3>
						<div class="text-[11px] text-slate-400">
							Role: <span class="text-slate-300 font-semibold">{data.activeConversation.otherUser?.role}</span>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-2 text-xs text-emerald-400">
					<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
					<span>Direct Stream</span>
				</div>
			</div>

			<!-- Messages Bubble Stream -->
			<div bind:this={chatContainer} class="flex-1 p-6 overflow-y-auto space-y-4">
				{#if messages.length === 0}
					<div class="py-20 text-center text-xs text-slate-500 space-y-1">
						<MessageSquare class="w-8 h-8 mx-auto text-slate-600 mb-2" />
						<div class="text-slate-400 font-medium">No messages yet.</div>
						<div>Send a direct message below to begin organizational communication.</div>
					</div>
				{:else}
					{#each messages as msg}
						{@const isMe = msg.senderId !== data.activeConversation.otherUser?.id}
						<div class={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
							<div class="flex items-end gap-2 max-w-lg">
								<div
									class={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
										isMe
											? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
											: 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
									}`}
								>
									{msg.content}
								</div>

								{#if isMe}
									<form method="POST" action="?/deleteMessage" class="opacity-0 hover:opacity-100 transition">
										<input type="hidden" name="messageId" value={msg.id} />
										<button
											type="submit"
											class="text-slate-500 hover:text-rose-400 p-1"
											title="Delete Message"
										>
											<Trash2 class="w-3 h-3" />
										</button>
									</form>
								{/if}
							</div>
							<span class="text-[9px] text-slate-500 mt-1 px-1">
								{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</span>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Message Input Form -->
			<div class="p-4 border-t border-slate-800 bg-slate-950/60">
				<form onsubmit={handleSend} class="flex items-center gap-2">
					<input
						type="text"
						bind:value={messageInput}
						placeholder="Type an organizational message or directive..."
						class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
					/>
					<button
						type="submit"
						class="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center justify-center"
					>
						<Send class="w-4 h-4" />
					</button>
				</form>
			</div>
		{:else}
			<div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
				<MessageSquare class="w-12 h-12 text-slate-700" />
				<h3 class="text-sm font-semibold text-slate-400">Select or Start a Conversation</h3>
				<p class="text-xs text-slate-500 max-w-sm">
					The CEO can communicate privately with any member or department Head across YOUTHs.
				</p>
				<button
					type="button"
					onclick={() => (showNewChatModal = true)}
					class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
				>
					Start New Message
				</button>
			</div>
		{/if}
	</div>
</div>

<!-- Start New Conversation Modal -->
{#if showNewChatModal}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white">Start Direct Communication</h3>
				<button
					type="button"
					aria-label="Close Chat Modal"
					onclick={() => (showNewChatModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form method="POST" action="?/startConversation" class="space-y-4">
				<div>
					<label for="chatTargetUser" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
						Select Member or Head
					</label>
					<select
						id="chatTargetUser"
						name="targetUserId"
						required
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
					>
						<option value="">Choose a recipient</option>
						{#each data.eligiblePartners as partner}
							<option value={partner.id}>
								{partner.fullName} (@{partner.username}) - {partner.role}
							</option>
						{/each}
					</select>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (showNewChatModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
					>
						Open Conversation
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
