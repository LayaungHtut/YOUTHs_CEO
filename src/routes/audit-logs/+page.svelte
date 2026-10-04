<script lang="ts">
	import { ShieldCheck, Search, Filter, FileText, Clock, User, Info, X } from '@lucide/svelte';

	let { data } = $props();

	let selectedLog = $state<any>(null);
	let showDetailModal = $state(false);

	function openDetail(log: any) {
		selectedLog = log;
		showDetailModal = true;
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
		<div>
			<h1 class="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white">
				Immutable Audit Log Registry
				<span
					class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400"
				>
					{data.total} Total Records
				</span>
			</h1>
			<p class="mt-1 text-sm text-slate-400">
				Cryptographically tamper-evident event stream recording all administrative, task, points,
				and membership operations.
			</p>
		</div>
	</div>

	<!-- Filter Bar -->
	<div class="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4">
		<form method="GET" class="flex flex-col gap-3 sm:flex-row">
			<input
				type="text"
				name="action"
				placeholder="Filter by action (e.g. TASK_CREATE, USER_CREATE)..."
				value={data.filters.action || ''}
				class="flex-1 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
			/>

			<select
				name="targetType"
				value={data.filters.targetType || ''}
				class="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
			>
				<option value="">All Targets</option>
				<option value="USER">User</option>
				<option value="DEPARTMENT">Department</option>
				<option value="TASK">Task</option>
				<option value="DISTRIBUTION">Distribution</option>
				<option value="POINTS">Points</option>
				<option value="ACHIEVEMENT">Achievement</option>
				<option value="INTEGRATION">Integration</option>
				<option value="SETTINGS">Settings</option>
			</select>

			<button
				type="submit"
				class="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
			>
				Apply Filter
			</button>
		</form>
	</div>

	<!-- Audit Log Table -->
	<div class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead>
					<tr
						class="border-b border-slate-800 bg-slate-950/60 font-semibold tracking-wider text-slate-400 uppercase"
					>
						<th class="px-4 py-3">Timestamp</th>
						<th class="px-4 py-3">Action</th>
						<th class="px-4 py-3">Actor</th>
						<th class="px-4 py-3">Target Type</th>
						<th class="px-4 py-3">Target ID</th>
						<th class="px-4 py-3 text-right">Metadata</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800/60 font-mono">
					{#if data.logs.length === 0}
						<tr>
							<td colspan="6" class="py-12 text-center font-sans text-slate-500">
								No audit records match the selected filters.
							</td>
						</tr>
					{:else}
						{#each data.logs as log}
							<tr class="transition hover:bg-slate-800/30">
								<td class="px-4 py-3 text-slate-400">
									{new Date(log.createdAt).toLocaleString()}
								</td>

								<td class="px-4 py-3 font-bold text-white">
									<span
										class="rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300"
									>
										{log.action}
									</span>
								</td>

								<td class="px-4 py-3 font-sans text-slate-300">
									{log.actorName}
								</td>

								<td class="px-4 py-3">
									<span class="font-semibold text-slate-400">{log.targetType}</span>
								</td>

								<td class="max-w-xs truncate px-4 py-3 text-[11px] text-slate-500">
									{log.targetId || '-'}
								</td>

								<td class="px-4 py-3 text-right font-sans">
									{#if log.metadata}
										<button
											type="button"
											onclick={() => openDetail(log)}
											class="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 transition hover:bg-slate-700 hover:text-white"
										>
											<Info class="h-3 w-3 text-indigo-400" />
											<span>Inspect</span>
										</button>
									{:else}
										<span class="text-[11px] text-slate-600">-</span>
									{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Metadata Inspector Modal -->
{#if showDetailModal && selectedLog}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<div>
					<h3 class="flex items-center gap-2 text-sm font-bold text-white">
						<ShieldCheck class="h-4 w-4 text-emerald-400" />
						<span>Audit Record: {selectedLog.action}</span>
					</h3>
					<span class="text-[10px] text-slate-400">{selectedLog.id}</span>
				</div>
				<button
					type="button"
					aria-label="Close Inspector Modal"
					onclick={() => (showDetailModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="space-y-2 text-xs">
				<div class="flex justify-between text-slate-400">
					<span>Actor:</span>
					<span class="font-semibold text-white">{selectedLog.actorName}</span>
				</div>
				<div class="flex justify-between text-slate-400">
					<span>Timestamp:</span>
					<span class="text-slate-200">{new Date(selectedLog.createdAt).toISOString()}</span>
				</div>
				<div class="flex justify-between text-slate-400">
					<span>Target:</span>
					<span class="text-slate-200"
						>{selectedLog.targetType} ({selectedLog.targetId || 'N/A'})</span
					>
				</div>
			</div>

			<div>
				<span class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
					Payload Snapshot (JSON)
				</span>
				<pre
					class="max-h-60 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-emerald-400">
{JSON.stringify(JSON.parse(selectedLog.metadata || '{}'), null, 2)}
				</pre>
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="button"
					onclick={() => (showDetailModal = false)}
					class="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
