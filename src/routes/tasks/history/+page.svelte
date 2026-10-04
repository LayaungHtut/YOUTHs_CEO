<script lang="ts">
	import {
		History,
		Filter,
		ArrowUpDown,
		Search,
		Calendar,
		ArrowLeft,
		CheckSquare,
		ExternalLink,
		Bot,
		ShieldCheck,
		RotateCcw
	} from '@lucide/svelte';

	let { data } = $props();

	let selectedMember = $state('');
	let selectedDept = $state('');
	let selectedEventType = $state('');
	let selectedSource = $state('');
	let selectedPriority = $state('');
	let selectedStatus = $state('');
	let selectedSort = $state('newest');
	let startDate = $state('');
	let endDate = $state('');

	$effect(() => {
		selectedMember = data.filters.memberId;
		selectedDept = data.filters.departmentId;
		selectedEventType = data.filters.eventType;
		selectedSource = data.filters.source;
		selectedPriority = data.filters.priority;
		selectedStatus = data.filters.status;
		selectedSort = data.filters.sort;
		startDate = data.filters.startDate;
		endDate = data.filters.endDate;
	});

	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedMember) params.set('memberId', selectedMember);
		if (selectedDept) params.set('departmentId', selectedDept);
		if (selectedEventType) params.set('eventType', selectedEventType);
		if (selectedSource) params.set('source', selectedSource);
		if (selectedPriority) params.set('priority', selectedPriority);
		if (selectedStatus) params.set('status', selectedStatus);
		if (selectedSort) params.set('sort', selectedSort);
		if (startDate) params.set('startDate', startDate);
		if (endDate) params.set('endDate', endDate);

		window.location.href = `/tasks/history?${params.toString()}`;
	}

	function resetFilters() {
		window.location.href = '/tasks/history';
	}
</script>

<div class="space-y-6">
	<!-- Top Navigation -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a
				href="/tasks"
				class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
				title="Back to Tasks"
			>
				<ArrowLeft class="w-4 h-4" />
			</a>
			<div>
				<h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
					<History class="w-5 h-5 text-indigo-400" />
					<span>Organizational Task History</span>
				</h1>
				<p class="text-xs text-slate-400">
					Permanent event trail and lifecycle audit records across all organizational tasks.
				</p>
			</div>
		</div>

		<a
			href="/tasks"
			class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition border border-slate-700"
		>
			<CheckSquare class="w-4 h-4 text-indigo-400" />
			<span>Task Board</span>
		</a>
	</div>

	<!-- Multi-faceted Filter Control Bar -->
	<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4 shadow-xl">
		<div class="flex items-center justify-between border-b border-slate-800 pb-3">
			<div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
				<Filter class="w-4 h-4 text-indigo-400" />
				<span>Filter Task History</span>
			</div>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={resetFilters}
					class="px-2.5 py-1 text-xs rounded-lg text-slate-400 hover:text-white transition"
				>
					Reset
				</button>
				<button
					type="button"
					onclick={applyFilters}
					class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
				>
					Apply Filters
				</button>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
			<div>
				<label for="filterMember" class="block text-[11px] text-slate-400 mb-1">Member</label>
				<select
					id="filterMember"
					bind:value={selectedMember}
					class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
				>
					<option value="">All Members</option>
					{#each data.users as u}
						<option value={u.id}>{u.fullName}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="filterDept" class="block text-[11px] text-slate-400 mb-1">Department</label>
				<select
					id="filterDept"
					bind:value={selectedDept}
					class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
				>
					<option value="">All Departments</option>
					{#each data.departments as d}
						<option value={d.id}>{d.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="filterEventType" class="block text-[11px] text-slate-400 mb-1">Event Type</label>
				<select
					id="filterEventType"
					bind:value={selectedEventType}
					class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
				>
					<option value="">All Event Types</option>
					<option value="CREATED">CREATED</option>
					<option value="REASSIGNED">REASSIGNED</option>
					<option value="DEADLINE_CHANGED">DEADLINE_CHANGED</option>
					<option value="PRIORITY_CHANGED">PRIORITY_CHANGED</option>
					<option value="STATUS_CHANGED">STATUS_CHANGED</option>
					<option value="COMPLETED">COMPLETED</option>
					<option value="OVERDUE">OVERDUE</option>
					<option value="CANCELLED">CANCELLED</option>
					<option value="REOPENED">REOPENED</option>
					<option value="RESTORED">RESTORED</option>
				</select>
			</div>

			<div>
				<label for="filterSource" class="block text-[11px] text-slate-400 mb-1">Action Source</label>
				<select
					id="filterSource"
					bind:value={selectedSource}
					class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
				>
					<option value="">All Sources</option>
					<option value="CEO">CEO</option>
					<option value="HEAD">Head</option>
					<option value="MEMBER">Member</option>
					<option value="AI">AI Engine</option>
					<option value="SYSTEM">Automated System</option>
				</select>
			</div>

			<div>
				<label for="filterPriority" class="block text-[11px] text-slate-400 mb-1">Task Priority</label>
				<select
					id="filterPriority"
					bind:value={selectedPriority}
					class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
				>
					<option value="">All Priorities</option>
					<option value="LOW">Low</option>
					<option value="MEDIUM">Medium</option>
					<option value="HIGH">High</option>
					<option value="URGENT">Urgent</option>
				</select>
			</div>

			<div>
				<label for="filterStatus" class="block text-[11px] text-slate-400 mb-1">Current Task Status</label>
				<select
					id="filterStatus"
					bind:value={selectedStatus}
					class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
				>
					<option value="">All Statuses</option>
					<option value="PENDING">PENDING</option>
					<option value="IN_PROGRESS">IN_PROGRESS</option>
					<option value="COMPLETED">COMPLETED</option>
					<option value="OVERDUE">OVERDUE</option>
					<option value="CANCELLED">CANCELLED</option>
				</select>
			</div>

			<div>
				<label for="filterSort" class="block text-[11px] text-slate-400 mb-1">Chronological Sort</label>
				<select
					id="filterSort"
					bind:value={selectedSort}
					class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
				>
					<option value="newest">Newest First</option>
					<option value="oldest">Oldest First</option>
				</select>
			</div>

			<div class="grid grid-cols-2 gap-1.5">
				<div>
					<label for="filterStart" class="block text-[11px] text-slate-400 mb-1">Start Date</label>
					<input
						type="date"
						id="filterStart"
						bind:value={startDate}
						class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
					/>
				</div>
				<div>
					<label for="filterEnd" class="block text-[11px] text-slate-400 mb-1">End Date</label>
					<input
						type="date"
						id="filterEnd"
						bind:value={endDate}
						class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
					/>
				</div>
			</div>
		</div>
	</div>

	<!-- Event Feed Table/List -->
	<div class="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-xl">
		<div class="p-4 border-b border-slate-800 flex items-center justify-between">
			<span class="text-xs font-bold uppercase tracking-wider text-slate-400">
				Showing {data.events.length} Historical Records
			</span>
		</div>

		{#if data.events.length === 0}
			<div class="py-16 text-center text-xs text-slate-500 space-y-1">
				<History class="w-8 h-8 mx-auto text-slate-600 mb-2" />
				<div>No task events matching the selected filters.</div>
			</div>
		{:else}
			<div class="divide-y divide-slate-800/60">
				{#each data.events as ev}
					<div class="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-800/30 transition">
						<div class="space-y-1 min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
									{ev.eventType}
								</span>
								<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
									Source: {ev.source || 'CEO'}
								</span>
								<span class="text-xs font-bold text-white truncate">
									{ev.task?.title || 'Unknown Task'}
								</span>
							</div>

							<div class="text-xs text-slate-400 flex flex-wrap items-center gap-3 pt-0.5">
								<span>Actor: <strong class="text-slate-300">{ev.actor?.fullName || 'System'}</strong> ({ev.actorRole})</span>
								{#if ev.task?.priority}
									<span>Priority: <span class="text-slate-300">{ev.task.priority}</span></span>
								{/if}
								{#if ev.task?.status}
									<span>Current Status: <span class="text-slate-300">{ev.task.status}</span></span>
								{/if}
							</div>

							{#if ev.reason}
								<div class="text-[11px] text-slate-300 italic pt-0.5">
									"{ev.reason}"
								</div>
							{/if}

							{#if ev.newValue}
								<div class="text-[10px] text-slate-500 font-mono truncate max-w-xl">
									{ev.newValue}
								</div>
							{/if}
						</div>

						<div class="flex items-center gap-4 shrink-0 text-right">
							<span class="text-[10px] text-slate-500 font-mono">
								{new Date(ev.createdAt).toLocaleString()}
							</span>
							{#if ev.task}
								<a
									href={`/tasks/${ev.task.id}`}
									class="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
									title="Inspect Task Detail and Timeline"
								>
									<ExternalLink class="w-3.5 h-3.5" />
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

