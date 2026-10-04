<script lang="ts">
	import {
		Activity,
		Filter,
		CheckSquare,
		Users,
		Building2,
		Award,
		Sparkles,
		Database,
		MessageSquare,
		ExternalLink,
		Calendar,
		ArrowRight
	} from '@lucide/svelte';

	let { data } = $props();

	let selectedDept = $state('');
	let selectedType = $state('');
	let selectedMember = $state('');
	let startDate = $state('');
	let endDate = $state('');

	$effect(() => {
		selectedDept = data.filters.departmentId;
		selectedType = data.filters.activityType;
		selectedMember = data.filters.memberId;
		startDate = data.filters.startDate;
		endDate = data.filters.endDate;
	});

	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedDept) params.set('departmentId', selectedDept);
		if (selectedType) params.set('activityType', selectedType);
		if (selectedMember) params.set('memberId', selectedMember);
		if (startDate) params.set('startDate', startDate);
		if (endDate) params.set('endDate', endDate);

		window.location.href = `/activity?${params.toString()}`;
	}

	function resetFilters() {
		window.location.href = '/activity';
	}

	function getActivityIcon(type: string) {
		switch (type) {
			case 'TASK':
				return CheckSquare;
			case 'MEMBER':
				return Users;
			case 'DEPARTMENT':
				return Building2;
			case 'ACHIEVEMENT':
				return Award;
			case 'DISTRIBUTION':
				return Sparkles;
			case 'INTEGRATION':
				return Database;
			case 'CHAT_ACTIVITY':
				return MessageSquare;
			default:
				return Activity;
		}
	}

	function getBadgeClasses(variant: string) {
		switch (variant) {
			case 'emerald':
				return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
			case 'rose':
				return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
			case 'amber':
				return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
			case 'purple':
				return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
			case 'cyan':
				return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
			case 'slate':
				return 'bg-slate-800 text-slate-300 border-slate-700';
			default:
				return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
				<Activity class="w-6 h-6 text-indigo-400" />
				<span>CEO Organization Activity Center</span>
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
					{data.totalCount} Events
				</span>
			</h1>
			<p class="text-sm text-slate-400 mt-1">
				Real-time organizational activity feed unifying tasks, members, departments, achievements, distributions, and privacy-protected communication signals.
			</p>
		</div>
	</div>

	<!-- Filter Controls -->
	<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4 shadow-xl">
		<div class="flex items-center justify-between border-b border-slate-800 pb-3">
			<div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
				<Filter class="w-4 h-4 text-indigo-400" />
				<span>Filter Organization Feed</span>
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

		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
			<div>
				<label for="actType" class="block text-[11px] text-slate-400 mb-1">Activity Type</label>
				<select
					id="actType"
					bind:value={selectedType}
					class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
				>
					<option value="">All Activities</option>
					<option value="TASK">Task Lifecycle</option>
					<option value="MEMBER">Member Accounts</option>
					<option value="DEPARTMENT">Department & Roles</option>
					<option value="ACHIEVEMENT">Achievement Unlocks</option>
					<option value="DISTRIBUTION">Weekly Distribution</option>
					<option value="INTEGRATION">Database Sync</option>
					<option value="CHAT_ACTIVITY">Direct Message Signals</option>
				</select>
			</div>

			<div>
				<label for="actDept" class="block text-[11px] text-slate-400 mb-1">Department</label>
				<select
					id="actDept"
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
				<label for="actMember" class="block text-[11px] text-slate-400 mb-1">Member Target</label>
				<select
					id="actMember"
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
				<label for="actStart" class="block text-[11px] text-slate-400 mb-1">Start Date</label>
				<input
					type="date"
					id="actStart"
					bind:value={startDate}
					class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
				/>
			</div>

			<div>
				<label for="actEnd" class="block text-[11px] text-slate-400 mb-1">End Date</label>
				<input
					type="date"
					id="actEnd"
					bind:value={endDate}
					class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
				/>
			</div>
		</div>
	</div>

	<!-- Activity Feed Stream -->
	<div class="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-xl">
		<div class="p-4 border-b border-slate-800 flex items-center justify-between">
			<span class="text-xs font-bold uppercase tracking-wider text-slate-400">
				Chronological Activity Feed ({data.items.length} Displayed)
			</span>
		</div>

		{#if data.items.length === 0}
			<div class="py-16 text-center text-xs text-slate-500 space-y-1">
				<Activity class="w-8 h-8 mx-auto text-slate-600 mb-2" />
				<div>No activity recorded matching the selected filter criteria.</div>
			</div>
		{:else}
			<div class="divide-y divide-slate-800/60">
				{#each data.items as item}
					{@const Icon = getActivityIcon(item.activityType)}
					<div class="p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition">
						<div class="flex items-start gap-3.5 min-w-0 flex-1">
							<div class={`p-2 rounded-xl border shrink-0 mt-0.5 ${getBadgeClasses(item.badgeVariant)}`}>
								<Icon class="w-4 h-4" />
							</div>

							<div class="space-y-1 min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-xs font-bold text-white">
										{item.title}
									</span>
									{#if item.departmentName}
										<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
											{item.departmentName}
										</span>
									{/if}
								</div>

								<div class="text-xs text-slate-300 leading-relaxed">
									{item.description}
								</div>

								<div class="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 pt-0.5">
									<span>By: <strong class="text-slate-400">{item.actorName}</strong> ({item.actorRole})</span>
									{#if item.targetUserName}
										<span>• Target: <strong class="text-slate-400">{item.targetUserName}</strong></span>
									{/if}
								</div>
							</div>
						</div>

						<div class="flex items-center gap-3 shrink-0 self-end sm:self-center">
							<span class="text-[10px] text-slate-500 font-mono">
								{new Date(item.timestamp).toLocaleString()}
							</span>

							{#if item.targetTaskId}
								<a
									href={`/tasks/${item.targetTaskId}`}
									class="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
									title="Inspect Task"
								>
									<ExternalLink class="w-3.5 h-3.5" />
								</a>
							{:else if item.targetUserId}
								<a
									href={`/members/${item.targetUserId}`}
									class="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
									title="Inspect Member Profile"
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

