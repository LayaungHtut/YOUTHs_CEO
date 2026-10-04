<script lang="ts">
	import {
		Database,
		ShieldCheck,
		KeyRound,
		RefreshCw,
		UploadCloud,
		FileText,
		CheckCircle2,
		AlertCircle,
		Copy,
		Check,
		X,
		ArrowUpRight
	} from '@lucide/svelte';

	let { data, form } = $props();

	let showGenerateModal = $state(false);
	let showImportModal = $state(false);
	let showSuccessTokenModal = $state(false);

	let copiedToken = $state(false);

	$effect(() => {
		if (form?.success && form?.token) {
			showGenerateModal = false;
			showSuccessTokenModal = true;
		}
	});

	function copyToken(token: string) {
		navigator.clipboard.writeText(token);
		copiedToken = true;
		setTimeout(() => (copiedToken = false), 2000);
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
				Member Database Synchronization
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
					Decentralized Neon Sync
				</span>
			</h1>
			<p class="text-sm text-slate-400 mt-1">
				Secure, zero-credential-exposure progress synchronization with member-owned Neon PostgreSQL databases.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={() => (showImportModal = true)}
				class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold hover:bg-slate-700/70 transition"
			>
				<UploadCloud class="w-4 h-4 text-indigo-400" />
				<span>Import CSV / JSON</span>
			</button>

			<button
				type="button"
				onclick={() => (showGenerateModal = true)}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition"
			>
				<KeyRound class="w-4 h-4" />
				<span>Generate Integration Token</span>
			</button>
		</div>
	</div>

	<!-- Security Architecture Notice -->
	<div class="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-4">
		<div class="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
			<ShieldCheck class="w-5 h-5" />
		</div>
		<div class="text-xs space-y-1">
			<div class="font-bold text-white text-sm">Privacy & Security Synchronization Architecture</div>
			<p class="text-blue-200/80 leading-relaxed">
				Each member maintains their own Neon database under the free plan. The CEO app never collects, stores, or handles raw Neon database passwords or unrestricted connection strings. Synchronization transmits only approved read-only task status fields via cryptographically hashed Bearer tokens. Members may revoke synchronization access at any time.
			</p>
		</div>
	</div>

	<!-- Integration Status Table -->
	<div class="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead>
					<tr class="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
						<th class="py-3 px-4">Member</th>
						<th class="py-3 px-4">Status</th>
						<th class="py-3 px-4">Integration Token Prefix</th>
						<th class="py-3 px-4">Last Sync</th>
						<th class="py-3 px-4 text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800/60">
					{#if data.connections.length === 0}
						<tr>
							<td colspan="5" class="py-12 text-center text-slate-500">
								No active members found.
							</td>
						</tr>
					{:else}
						{#each data.connections as conn}
							<tr class="hover:bg-slate-800/30 transition">
								<td class="py-3 px-4">
									<a href={`/members/${conn.userId}`} class="font-bold text-white hover:text-indigo-400">
										{conn.fullName}
									</a>
									<div class="text-[11px] text-slate-400">@{conn.username}</div>
								</td>

								<td class="py-3 px-4">
									<span
										class={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
											conn.status === 'CONNECTED'
												? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
												: conn.status === 'CONFIGURED'
													? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
													: conn.status === 'REVOKED'
														? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
														: 'bg-slate-800 text-slate-400 border border-slate-700'
										}`}
									>
										<span class="w-1.5 h-1.5 rounded-full bg-current"></span>
										<span>{conn.status}</span>
									</span>
								</td>

								<td class="py-3 px-4 font-mono text-slate-300">
									{conn.tokenPrefix}
								</td>

								<td class="py-3 px-4 text-slate-400">
									{conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString() : 'Never'}
								</td>

								<td class="py-3 px-4 text-right">
									<div class="flex items-center justify-end gap-2">
										<form method="POST" action="?/generateToken" class="inline">
											<input type="hidden" name="userId" value={conn.userId} />
											<button
												type="submit"
												class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-semibold"
											>
												Rotate Key
											</button>
										</form>

										{#if conn.status !== 'REVOKED' && conn.status !== 'UNCONFIGURED'}
											<form method="POST" action="?/revokeToken" class="inline">
												<input type="hidden" name="userId" value={conn.userId} />
												<button
													type="submit"
													class="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition font-semibold"
												>
													Revoke
												</button>
											</form>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- REST API Contract Guide -->
	<div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3">
		<h3 class="text-sm font-bold text-white flex items-center gap-2">
			<FileText class="w-4 h-4 text-indigo-400" />
			<span>YOUTHs Synchronization Contract v1</span>
		</h3>
		<p class="text-xs text-slate-400 leading-relaxed">
			Member applications make an HTTP POST request to sync completed task progress snapshots. The CEO server validates task IDs and assignee integrity before accepting updates.
		</p>
		<pre class="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
POST /api/sync/progress
Authorization: Bearer yt_sync_&lt;token&gt;
Content-Type: application/json

&#123;
  "schemaVersion": 1,
  "memberId": "uuid",
  "tasks": [
    &#123;
      "taskId": "uuid",
      "status": "COMPLETED",
      "progressPercentage": 100,
      "completedAt": "2026-10-02T08:00:00Z"
    &#125;
  ],
  "lastUpdatedAt": "2026-10-02T08:30:00Z"
&#125;
		</pre>
	</div>
</div>

<!-- Generate Token Modal -->
{#if showGenerateModal}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white">Generate Member Integration Token</h3>
				<button
					type="button"
					aria-label="Close Token Modal"
					onclick={() => (showGenerateModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form method="POST" action="?/generateToken" class="space-y-4">
				<div>
					<label for="integrationUserId" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
						Select Member
					</label>
					<select
						id="integrationUserId"
						name="userId"
						required
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
					>
						{#each data.eligibleMembers as member}
							<option value={member.id}>{member.fullName} (@{member.username})</option>
						{/each}
					</select>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (showGenerateModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
					>
						Issue Token
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Success Token Modal -->
{#if showSuccessTokenModal && form?.token}
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white flex items-center gap-2">
					<CheckCircle2 class="w-5 h-5 text-emerald-400" />
					<span>Integration Token Generated</span>
				</h3>
				<button
					type="button"
					aria-label="Close Token Success Modal"
					onclick={() => (showSuccessTokenModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<p class="text-xs text-slate-400">
				Please copy this token now. It will not be shown in full again for security.
			</p>

			<div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
				<span class="font-mono text-xs text-indigo-400 truncate">{form.token}</span>
				<button
					type="button"
					onclick={() => copyToken(form.token)}
					class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition shrink-0 flex items-center gap-1 text-xs"
				>
					{#if copiedToken}
						<Check class="w-3.5 h-3.5 text-emerald-400" />
						<span class="text-emerald-400">Copied</span>
					{:else}
						<Copy class="w-3.5 h-3.5" />
						<span>Copy</span>
					{/if}
				</button>
			</div>

			<div class="flex justify-end">
				<button
					type="button"
					onclick={() => (showSuccessTokenModal = false)}
					class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Import Progress Modal -->
{#if showImportModal}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white">Manual Progress Import Fallback</h3>
				<button
					type="button"
					aria-label="Close Import Modal"
					onclick={() => (showImportModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<p class="text-xs text-slate-400">
				If member database automated sync is not enabled, upload a validated CSV or JSON progress report file.
			</p>

			<form method="POST" action="?/importFallbackFile" enctype="multipart/form-data" class="space-y-4">
				<div>
					<label for="importFileType" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">File Format</label>
					<select
						id="importFileType"
						name="fileType"
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
					>
						<option value="csv">CSV (memberId,taskId,status,progressPercentage)</option>
						<option value="json">JSON (Sync Contract v1 Array)</option>
					</select>
				</div>

				<div>
					<label for="importFile" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Upload File</label>
					<input
						type="file"
						id="importFile"
						name="file"
						accept=".csv,.json"
						required
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
					/>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (showImportModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
					>
						Validate & Import
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
