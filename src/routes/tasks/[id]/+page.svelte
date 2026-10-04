<script lang="ts">
	import {
		CheckSquare,
		ArrowLeft,
		Calendar,
		Clock,
		Building2,
		Users,
		Award,
		AlertTriangle,
		CheckCircle2,
		ShieldAlert,
		Edit3,
		MessageSquare,
		History,
		X
	} from '@lucide/svelte';

	let { data, form } = $props();

	let showEditModal = $state(false);
	let showCancelConfirmModal = $state(false);

	let eventsList = $derived(((data as any).timelineEvents || (data as any).events || []) as any[]);
</script>

<div class="space-y-6">
	<!-- Back Button -->
	<div>
		<a
			href="/tasks"
			class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>Back to Task Board</span>
		</a>
	</div>

	<!-- Task Hero Card -->
	<div
		class="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 md:flex-row md:items-center"
	>
		<div class="max-w-2xl space-y-2">
			<div class="flex items-center gap-2">
				<span
					class={`rounded px-2 py-0.5 text-[10px] font-bold ${
						data.task.status === 'COMPLETED'
							? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
							: data.task.status === 'OVERDUE'
								? 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
								: data.task.status === 'IN_PROGRESS'
									? 'border border-blue-500/20 bg-blue-500/10 text-blue-400'
									: 'border border-slate-700 bg-slate-800 text-slate-400'
					}`}
				>
					{data.task.status}
				</span>
				<span
					class={`rounded px-2 py-0.5 text-[10px] font-bold ${
						data.task.source === 'AI_WEEKLY'
							? 'border border-purple-500/20 bg-purple-500/10 text-purple-400'
							: 'border border-slate-700 bg-slate-800 text-slate-300'
					}`}
				>
					{data.task.source}
				</span>
				<span
					class={`rounded px-2 py-0.5 text-[10px] font-bold ${
						data.task.priority === 'URGENT'
							? 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
							: data.task.priority === 'HIGH'
								? 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
								: 'border border-slate-700 bg-slate-800 text-slate-300'
					}`}
				>
					{data.task.priority} Priority
				</span>
			</div>

			<h1 class="text-2xl leading-tight font-bold tracking-tight text-white">
				{data.task.title}
			</h1>

			<div class="flex items-center gap-4 pt-1 text-xs text-slate-400">
				<span class="flex items-center gap-1.5">
					<Calendar class="h-3.5 w-3.5 text-slate-500" />
					<span>Deadline: {new Date(data.task.deadline).toLocaleDateString()}</span>
				</span>
				<span class="flex items-center gap-1.5">
					<Clock class="h-3.5 w-3.5 text-slate-500" />
					<span>Effort: {data.task.estimatedEffort || '4-6 hours'}</span>
				</span>
				<span class="flex items-center gap-1.5 font-semibold text-indigo-400">
					<Award class="h-3.5 w-3.5" />
					<span>+{data.task.pointsReward} pts</span>
				</span>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={() => (showEditModal = true)}
				class="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
			>
				<Edit3 class="h-3.5 w-3.5" />
				<span>Edit Details</span>
			</button>

			{#if data.task.status !== 'CANCELLED'}
				<button
					type="button"
					onclick={() => (showCancelConfirmModal = true)}
					class="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
				>
					<ShieldAlert class="h-3.5 w-3.5" />
					<span>Cancel Task</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Main Details Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left: Task Description & Status Control -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Scope and Requirements -->
			<div class="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6">
				<h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase">
					Task Scope & Deliverables
				</h3>
				<p class="text-sm leading-relaxed whitespace-pre-line text-slate-200">
					{data.task.description}
				</p>
			</div>

			<!-- Status Progression Controller -->
			<div class="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6">
				<h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase">
					Lifecycle Status Control
				</h3>
				<p class="text-xs text-slate-400">
					Direct executive status override. Marking a task completed automatically rewards points in
					the member's ledger.
				</p>

				<div class="flex flex-wrap gap-2 pt-2">
					<form method="POST" action="?/changeStatus">
						<input type="hidden" name="status" value="PENDING" />
						<button
							type="submit"
							class={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
								data.task.status === 'PENDING'
									? 'border-slate-600 bg-slate-700 text-white'
									: 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
							}`}
						>
							Set Pending
						</button>
					</form>

					<form method="POST" action="?/changeStatus">
						<input type="hidden" name="status" value="IN_PROGRESS" />
						<button
							type="submit"
							class={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
								data.task.status === 'IN_PROGRESS'
									? 'border-blue-500 bg-blue-600 text-white'
									: 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
							}`}
						>
							Set In Progress
						</button>
					</form>

					<form method="POST" action="?/changeStatus">
						<input type="hidden" name="status" value="COMPLETED" />
						<button
							type="submit"
							class={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
								data.task.status === 'COMPLETED'
									? 'border-emerald-500 bg-emerald-600 text-white'
									: 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
							}`}
						>
							Mark Complete (+{data.task.pointsReward} pts)
						</button>
					</form>

					<form method="POST" action="?/changeStatus">
						<input type="hidden" name="status" value="OVERDUE" />
						<button
							type="submit"
							class={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
								data.task.status === 'OVERDUE'
									? 'border-rose-500 bg-rose-600 text-white'
									: 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
							}`}
						>
							Mark Overdue (-10 pts)
						</button>
					</form>
				</div>
			</div>

			<!-- Task Event Audit History -->
			<div class="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6">
				<div class="flex items-center justify-between">
					<h3
						class="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase"
					>
						<History class="h-4 w-4 text-indigo-400" />
						<span>Task Lifecycle History & Timeline</span>
					</h3>
					<span class="text-xs text-slate-500">{eventsList.length} Events</span>
				</div>

				<div class="space-y-3">
					{#if eventsList.length === 0}
						<div class="py-6 text-center text-xs text-slate-500">No events recorded.</div>
					{:else}
						{#each eventsList as event}
							<div
								class="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 transition hover:border-slate-700"
							>
								<div class="flex items-start justify-between gap-4">
									<div class="flex flex-wrap items-center gap-2">
										<span
											class="rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400"
										>
											{event.eventType}
										</span>
										<span
											class="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-slate-400 uppercase"
										>
											{event.source || 'CEO'}
										</span>
										<span class="text-xs font-bold text-white">
											{event.actorName || 'Administrator'}
										</span>
										<span class="text-[10px] text-slate-500">
											({event.actorRole || 'SYSTEM'})
										</span>
									</div>
									<span class="shrink-0 font-mono text-[10px] text-slate-500">
										{new Date(event.createdAt).toLocaleString()}
									</span>
								</div>

								{#if event.reason}
									<div
										class="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs text-slate-300 italic"
									>
										"{event.reason}"
									</div>
								{/if}

								{#if event.parsedOldValue || event.parsedNewValue}
									<div class="space-y-1 pt-1 font-mono text-[11px] text-slate-400">
										{#if event.parsedOldValue}
											<div class="truncate text-rose-400/90">
												- Prev: {JSON.stringify(event.parsedOldValue)}
											</div>
										{/if}
										{#if event.parsedNewValue}
											<div class="truncate text-emerald-400/90">
												+ New: {JSON.stringify(event.parsedNewValue)}
											</div>
										{/if}
									</div>
								{:else if event.newValue}
									<div class="truncate font-mono text-[11px] text-slate-400">
										{event.newValue}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- Right: Assignee & Department Cards -->
		<div class="space-y-6">
			<!-- Assignee Info -->
			<div class="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6">
				<h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase">Assigned Member</h3>
				{#if data.assignee}
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20 text-sm font-bold text-indigo-300"
						>
							{data.assignee.fullName.slice(0, 2).toUpperCase()}
						</div>
						<div>
							<div class="text-sm font-bold text-white">{data.assignee.fullName}</div>
							<div class="text-xs text-slate-400">
								@{data.assignee.username} • {data.assignee.role}
							</div>
						</div>
					</div>

					<div class="flex items-center gap-2 pt-2">
						<a
							href={`/members/${data.assignee.id}`}
							class="flex-1 rounded-xl bg-slate-800 py-2 text-center text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
						>
							Member Profile
						</a>
						<a
							href={`/messages?userId=${data.assignee.id}`}
							class="flex-1 rounded-xl bg-indigo-600 py-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
						>
							Message
						</a>
					</div>
				{:else}
					<div class="text-xs text-slate-500">Unassigned</div>
				{/if}
			</div>

			<!-- Department Info -->
			<div class="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6">
				<h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase">Department</h3>
				<div class="flex items-center gap-2.5">
					<div class="rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
						<Building2 class="h-4 w-4" />
					</div>
					<div>
						<div class="text-sm font-bold text-white">{data.department?.name}</div>
						<div class="line-clamp-1 text-[11px] text-slate-400">
							{data.department?.description}
						</div>
					</div>
				</div>
			</div>

			<!-- Meta timestamps -->
			<div
				class="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 text-xs text-slate-400"
			>
				<div>
					Created: <span class="text-slate-300"
						>{new Date(data.task.createdAt).toLocaleString()}</span
					>
				</div>
				<div>
					Updated: <span class="text-slate-300"
						>{new Date(data.task.updatedAt).toLocaleString()}</span
					>
				</div>
				{#if data.task.completedAt}
					<div>
						Completed: <span class="font-semibold text-emerald-400"
							>{new Date(data.task.completedAt).toLocaleString()}</span
						>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Edit Task Modal -->
{#if showEditModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-lg space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="text-base font-bold text-white">Edit Task Specifications</h3>
				<button
					type="button"
					aria-label="Close Edit Modal"
					onclick={() => (showEditModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<form method="POST" action="?/updateDetails" class="space-y-4">
				<div>
					<label
						for="editTitle"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
						>Title</label
					>
					<input
						type="text"
						id="editTitle"
						name="title"
						value={data.task.title}
						required
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
					/>
				</div>

				<div>
					<label
						for="editDesc"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
						>Description</label
					>
					<textarea
						id="editDesc"
						name="description"
						rows="4"
						value={data.task.description}
						required
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label
							for="editPriority"
							class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
							>Priority</label
						>
						<select
							id="editPriority"
							name="priority"
							class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
						>
							<option value="LOW" selected={data.task.priority === 'LOW'}>Low</option>
							<option value="MEDIUM" selected={data.task.priority === 'MEDIUM'}>Medium</option>
							<option value="HIGH" selected={data.task.priority === 'HIGH'}>High</option>
							<option value="URGENT" selected={data.task.priority === 'URGENT'}>Urgent</option>
						</select>
					</div>

					<div>
						<label
							for="editEffort"
							class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
							>Estimated Effort</label
						>
						<input
							type="text"
							id="editEffort"
							name="estimatedEffort"
							value={data.task.estimatedEffort || '4-6 hours'}
							class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
						/>
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
					<button
						type="button"
						onclick={() => (showEditModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
					>
						Save Changes
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Cancel Task Confirmation Modal -->
{#if showCancelConfirmModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
		>
			<div class="flex items-center gap-3 text-rose-400">
				<ShieldAlert class="h-6 w-6" />
				<h3 class="text-base font-bold text-white">Confirm Task Cancellation</h3>
			</div>

			<p class="text-xs leading-relaxed text-slate-300">
				Are you sure you want to cancel this active task? The task will be marked cancelled, no
				penalties will be applied, and the member will be notified.
			</p>

			<form method="POST" action="?/cancelTask" class="space-y-3 pt-2">
				<input
					type="text"
					name="reason"
					placeholder="Reason for cancellation (optional)"
					class="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
				/>

				<div class="flex items-center justify-end gap-2 pt-2">
					<button
						type="button"
						onclick={() => (showCancelConfirmModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Back
					</button>
					<button
						type="submit"
						class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/30 transition hover:bg-rose-500"
					>
						Yes, Cancel Task
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
