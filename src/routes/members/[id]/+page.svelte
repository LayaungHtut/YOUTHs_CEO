<script lang="ts">
	import {
		Users,
		Award,
		CheckSquare,
		AlertTriangle,
		Database,
		Shield,
		Calendar,
		Clock,
		ArrowLeft,
		Plus,
		MessageSquare,
		KeyRound,
		Copy,
		Check,
		RefreshCw,
		X,
		History,
		Filter,
		Trash2
	} from '@lucide/svelte';

	let { data, form } = $props();

	let showAdjustModal = $state(false);
	let showDeleteModal = $state(false);
	let activeTab = $state<'tasks' | 'points' | 'achievements' | 'sync'>('tasks');
	let copiedToken = $state(false);

	let taskList = $derived((data.taskHistory || data.tasks || []) as any[]);

	function copyToken(token: string) {
		navigator.clipboard.writeText(token);
		copiedToken = true;
		setTimeout(() => (copiedToken = false), 2000);
	}
</script>

<div class="space-y-6">
	<!-- Back Button -->
	<div>
		<a
			href="/members"
			class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>Back to Organization Directory</span>
		</a>
	</div>

	{#if form?.error}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300"
		>
			<AlertTriangle class="h-4 w-4 shrink-0 text-red-400" />
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- Member Hero Header Card -->
	<div
		class="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 md:flex-row md:items-center"
	>
		<div class="flex items-center gap-4">
			<div
				class="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20 text-xl font-bold text-indigo-300"
			>
				{data.member.fullName.slice(0, 2).toUpperCase()}
			</div>
			<div>
				<div class="flex items-center gap-2.5">
					<h1 class="text-xl font-bold tracking-tight text-white">{data.member.fullName}</h1>
					<span
						class={`rounded px-2 py-0.5 text-[10px] font-bold ${
							data.member.role === 'CEO'
								? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
								: data.member.role === 'HEAD'
									? 'border border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
									: 'border border-slate-700 bg-slate-800 text-slate-300'
						}`}
					>
						{data.member.role}
					</span>
					<span
						class={`rounded px-2 py-0.5 text-[10px] font-bold ${
							data.member.accountStatus === 'ACTIVE'
								? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
								: 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
						}`}
					>
						{data.member.accountStatus}
					</span>
				</div>
				<div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
					<span>@{data.member.username}</span>
					<span>•</span>
					<span>{data.member.email}</span>
					<span>•</span>
					<span class="font-medium text-slate-300"
						>{data.department ? data.department.name : 'No Department'}</span
					>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<a
				href={`/messages?userId=${data.member.id}`}
				class="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700/70 hover:text-white"
			>
				<MessageSquare class="h-4 w-4 text-indigo-400" />
				<span>Direct Message</span>
			</a>
			<button
				type="button"
				onclick={() => (showAdjustModal = true)}
				class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
			>
				<Plus class="h-4 w-4" />
				<span>Adjust Points</span>
			</button>

			{#if data.member.role !== 'CEO'}
				<button
					type="button"
					onclick={() => (showDeleteModal = true)}
					class="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
					title="Remove Member Account"
				>
					<Trash2 class="h-4 w-4" />
					<span>Remove Member</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Top Metric Summary Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold text-slate-400 uppercase">Points Balance</span>
				<Award class="h-4 w-4 text-indigo-400" />
			</div>
			<div class="mt-2 text-3xl font-extrabold tracking-tight text-white">
				{data.pointsSummary.balance} <span class="text-sm font-medium text-slate-400">pts</span>
			</div>
			<div class="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
				<span class="font-semibold text-emerald-400">+{data.pointsSummary.earned} earned</span>
				<span>•</span>
				<span class="font-semibold text-rose-400">-{data.pointsSummary.deducted} lost</span>
			</div>
		</div>

		<div class="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold text-slate-400 uppercase">Completion Rate</span>
				<CheckSquare class="h-4 w-4 text-emerald-400" />
			</div>
			<div class="mt-2 text-3xl font-extrabold tracking-tight text-white">
				{data.stats.completionRate}%
			</div>
			<div class="mt-2 text-[11px] text-slate-400">
				{data.stats.completedCount} of {data.stats.totalAssigned} tasks completed
			</div>
		</div>

		<div class="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold text-slate-400 uppercase">Overdue Tasks</span>
				<AlertTriangle class="h-4 w-4 text-rose-400" />
			</div>
			<div class="mt-2 text-3xl font-extrabold tracking-tight text-rose-400">
				{data.stats.overdueCount}
			</div>
			<div class="mt-2 text-[11px] text-slate-400">
				{data.stats.overdueCount > 0
					? 'Requires attention & mentoring'
					: 'All deadlines met on time'}
			</div>
		</div>

		<div class="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold text-slate-400 uppercase">Database Integration</span>
				<Database class="h-4 w-4 text-blue-400" />
			</div>
			<div class="mt-2 text-base font-bold tracking-tight text-white">
				{data.connection?.integrationStatus || 'UNCONFIGURED'}
			</div>
			<div class="mt-2 text-[11px] text-slate-400">
				{data.latestSnapshot
					? `Last sync: ${new Date(data.latestSnapshot.lastSyncedAt).toLocaleTimeString()}`
					: 'No sync recorded'}
			</div>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<div class="flex gap-2 border-b border-slate-800">
		<button
			type="button"
			onclick={() => (activeTab = 'tasks')}
			class={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
				activeTab === 'tasks'
					? 'border-indigo-500 text-white'
					: 'border-transparent text-slate-400 hover:text-slate-200'
			}`}
		>
			Assigned Tasks ({data.tasks.length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'points')}
			class={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
				activeTab === 'points'
					? 'border-indigo-500 text-white'
					: 'border-transparent text-slate-400 hover:text-slate-200'
			}`}
		>
			Points Ledger ({data.pointsSummary.transactions.length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'achievements')}
			class={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
				activeTab === 'achievements'
					? 'border-indigo-500 text-white'
					: 'border-transparent text-slate-400 hover:text-slate-200'
			}`}
		>
			Achievements ({data.achievements.length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'sync')}
			class={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
				activeTab === 'sync'
					? 'border-indigo-500 text-white'
					: 'border-transparent text-slate-400 hover:text-slate-200'
			}`}
		>
			Neon Database Sync
		</button>
	</div>

	<!-- TAB 1: Member Task History -->
	{#if activeTab === 'tasks'}
		<div class="space-y-4">
			<!-- Task History Filters -->
			<form
				method="GET"
				class="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4"
			>
				<div
					class="flex items-center gap-1.5 pr-2 text-xs font-semibold tracking-wider text-slate-400 uppercase"
				>
					<Filter class="h-3.5 w-3.5 text-indigo-400" />
					<span>History Filters</span>
				</div>

				<!-- Status Filter -->
				<select
					name="taskStatus"
					class="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
				>
					<option value="">All Statuses</option>
					<option value="PENDING" selected={data.taskFilters?.status === 'PENDING'}>Pending</option>
					<option value="IN_PROGRESS" selected={data.taskFilters?.status === 'IN_PROGRESS'}
						>In Progress</option
					>
					<option value="COMPLETED" selected={data.taskFilters?.status === 'COMPLETED'}
						>Completed</option
					>
					<option value="OVERDUE" selected={data.taskFilters?.status === 'OVERDUE'}>Overdue</option>
					<option value="CANCELLED" selected={data.taskFilters?.status === 'CANCELLED'}
						>Cancelled</option
					>
				</select>

				<!-- Year Filter -->
				<select
					name="taskYear"
					class="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
				>
					<option value="">All Years</option>
					<option value="2026" selected={data.taskFilters?.year === '2026'}>2026</option>
					<option value="2025" selected={data.taskFilters?.year === '2025'}>2025</option>
				</select>

				<!-- Month Filter -->
				<select
					name="taskMonth"
					class="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
				>
					<option value="">All Months</option>
					<option value="0" selected={data.taskFilters?.month === '0'}>January</option>
					<option value="1" selected={data.taskFilters?.month === '1'}>February</option>
					<option value="2" selected={data.taskFilters?.month === '2'}>March</option>
					<option value="3" selected={data.taskFilters?.month === '3'}>April</option>
					<option value="4" selected={data.taskFilters?.month === '4'}>May</option>
					<option value="5" selected={data.taskFilters?.month === '5'}>June</option>
					<option value="6" selected={data.taskFilters?.month === '6'}>July</option>
					<option value="7" selected={data.taskFilters?.month === '7'}>August</option>
					<option value="8" selected={data.taskFilters?.month === '8'}>September</option>
					<option value="9" selected={data.taskFilters?.month === '9'}>October</option>
					<option value="10" selected={data.taskFilters?.month === '10'}>November</option>
					<option value="11" selected={data.taskFilters?.month === '11'}>December</option>
				</select>

				<!-- Week Filter -->
				<select
					name="taskWeek"
					class="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
				>
					<option value="">All Task Weeks</option>
					{#each data.taskWeeks || [] as w}
						<option value={w.id} selected={data.taskFilters?.weekId === w.id}>
							Week of {new Date(w.weekStart).toLocaleDateString()}
						</option>
					{/each}
				</select>

				<button
					type="submit"
					class="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
				>
					Filter
				</button>
				{#if data.taskFilters?.status || data.taskFilters?.year || data.taskFilters?.month || data.taskFilters?.weekId}
					<a
						href={`/members/${data.member.id}`}
						class="px-2.5 py-1.5 text-xs text-slate-400 transition hover:text-white"
					>
						Reset
					</a>
				{/if}
			</form>

			<!-- Task History Table -->
			<div class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs">
						<thead>
							<tr
								class="border-b border-slate-800 bg-slate-950/60 font-semibold tracking-wider text-slate-400 uppercase"
							>
								<th class="px-4 py-3">Task</th>
								<th class="px-4 py-3">Source</th>
								<th class="px-4 py-3">Assigned</th>
								<th class="px-4 py-3">Original Deadline</th>
								<th class="px-4 py-3">Current Deadline</th>
								<th class="px-4 py-3">Completed</th>
								<th class="px-4 py-3">Status</th>
								<th class="px-4 py-3">Points</th>
								<th class="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-800/60">
							{#if taskList.length === 0}
								<tr>
									<td colspan="9" class="py-12 text-center text-slate-500">
										No tasks match the selected history filter.
									</td>
								</tr>
							{:else}
								{#each taskList as task}
									<tr class="transition hover:bg-slate-800/30">
										<td class="px-4 py-3 font-semibold text-slate-200">
											<a href={`/tasks/${task.id}`} class="font-bold hover:text-indigo-400">
												{task.title}
											</a>
											<div class="max-w-xs truncate text-[11px] text-slate-400">
												{task.description}
											</div>
										</td>
										<td class="px-4 py-3">
											<span
												class={`rounded px-2 py-0.5 text-[10px] font-semibold ${
													task.source === 'AI_WEEKLY'
														? 'border border-purple-500/20 bg-purple-500/10 text-purple-400'
														: 'border border-slate-700 bg-slate-800 text-slate-300'
												}`}
											>
												{task.source}
											</span>
										</td>
										<td class="px-4 py-3 font-mono text-slate-400">
											{new Date(task.createdAt).toLocaleDateString()}
										</td>
										<td class="px-4 py-3 font-mono text-slate-400">
											{new Date(task.originalDeadline || task.deadline).toLocaleDateString()}
										</td>
										<td class="px-4 py-3 font-mono">
											<span
												class={task.originalDeadline &&
												new Date(task.originalDeadline).getTime() !==
													new Date(task.deadline).getTime()
													? 'font-semibold text-amber-400'
													: 'text-slate-300'}
											>
												{new Date(task.deadline).toLocaleDateString()}
											</span>
											{#if task.originalDeadline && new Date(task.originalDeadline).getTime() !== new Date(task.deadline).getTime()}
												<span class="block text-[10px] text-amber-500/80">Extended</span>
											{/if}
										</td>
										<td class="px-4 py-3 font-mono text-slate-400">
											{#if task.completedAt}
												<span class="font-semibold text-emerald-400"
													>{new Date(task.completedAt).toLocaleDateString()}</span
												>
											{:else}
												<span class="text-slate-500">—</span>
											{/if}
										</td>
										<td class="px-4 py-3">
											<span
												class={`rounded px-2 py-0.5 text-[10px] font-semibold ${
													task.status === 'COMPLETED'
														? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
														: task.status === 'OVERDUE'
															? 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
															: task.status === 'IN_PROGRESS'
																? 'border border-blue-500/20 bg-blue-500/10 text-blue-400'
																: 'border border-slate-700 bg-slate-800 text-slate-400'
												}`}
											>
												{task.status}
											</span>
										</td>
										<td class="px-4 py-3 font-semibold">
											{#if task.pointsImpact && task.pointsImpact > 0}
												<span class="text-emerald-400">+{task.pointsImpact} pts</span>
											{:else if task.pointsImpact && task.pointsImpact < 0}
												<span class="text-rose-400">{task.pointsImpact} pts</span>
											{:else}
												<span class="text-slate-400">+{task.pointsReward} pts potential</span>
											{/if}
										</td>
										<td class="px-4 py-3 text-right">
											<a
												href={`/tasks/${task.id}`}
												class="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-indigo-600 hover:text-white"
											>
												View History
											</a>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 2: Points Ledger -->
	{#if activeTab === 'points'}
		<div class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90">
			<div class="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 p-4">
				<div>
					<h3 class="text-xs font-semibold tracking-wider text-slate-400 uppercase">
						Append-Only Transaction Ledger
					</h3>
					<p class="mt-0.5 text-[11px] text-slate-500">
						Immutable record of every point rewarded, deducted, or administratively adjusted.
					</p>
				</div>
				<div class="text-xs font-bold text-white">
					Current Balance: <span class="text-indigo-400">{data.pointsSummary.balance} pts</span>
				</div>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr
							class="border-b border-slate-800 font-semibold tracking-wider text-slate-400 uppercase"
						>
							<th class="px-4 py-3">Type</th>
							<th class="px-4 py-3">Amount</th>
							<th class="px-4 py-3">Description</th>
							<th class="px-4 py-3">Timestamp</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each data.pointsSummary.transactions as tx}
							<tr class="transition hover:bg-slate-800/30">
								<td class="px-4 py-3">
									<span
										class={`rounded px-2 py-0.5 text-[10px] font-bold ${
											tx.amount > 0
												? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
												: 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
										}`}
									>
										{tx.transactionType}
									</span>
								</td>
								<td class="px-4 py-3 text-sm font-bold">
									<span class={tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}>
										{tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
									</span>
								</td>
								<td class="px-4 py-3 font-medium text-slate-300">
									{tx.description}
								</td>
								<td class="px-4 py-3 text-slate-400">
									{new Date(tx.createdAt).toLocaleString()}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- TAB 3: Achievements -->
	{#if activeTab === 'achievements'}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#if data.achievements.length === 0}
				<div class="col-span-full py-12 text-center text-xs text-slate-500">
					No achievements unlocked yet. Complete weekly tasks on time to unlock badges.
				</div>
			{:else}
				{#each data.achievements as ach}
					<div
						class="flex items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5"
					>
						<div class="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
							<Award class="h-6 w-6" />
						</div>
						<div>
							<h4 class="text-sm font-bold text-white">{ach.name}</h4>
							<p class="mt-1 text-xs text-slate-400">{ach.description}</p>
							<div class="mt-2 text-[10px] text-slate-500">
								Unlocked: {new Date(ach.unlockedAt).toLocaleDateString()}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	{/if}

	<!-- TAB 4: Neon Database Sync -->
	{#if activeTab === 'sync'}
		<div class="space-y-6 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6">
			<div>
				<h3 class="text-base font-bold text-white">Member Neon Database Synchronization</h3>
				<p class="mt-1 text-xs text-slate-400">
					Each member maintains an independent Neon PostgreSQL database on the free plan. The CEO
					app strictly ingests read-only task progress snapshots via authenticated integration
					tokens.
				</p>
			</div>

			<!-- Integration Credentials Box -->
			<div class="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
				<div class="flex items-center justify-between">
					<div class="text-xs font-semibold text-slate-400 uppercase">Integration Bearer Token</div>
					<div class="flex items-center gap-2">
						<form method="POST" action="?/regenerateSyncToken" class="inline">
							<button
								type="submit"
								class="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
							>
								<RefreshCw class="h-3 w-3" />
								<span>Generate / Rotate</span>
							</button>
						</form>
						<form method="POST" action="?/revokeSyncToken" class="inline">
							<button
								type="submit"
								class="rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300"
							>
								Revoke
							</button>
						</form>
					</div>
				</div>

				<div
					class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-2.5 font-mono text-xs text-slate-300"
				>
					<span
						>{form?.newSyncToken ||
							data.connection?.integrationToken ||
							'yt_sync_****************'}</span
					>
					{#if form?.newSyncToken}
						<button
							type="button"
							onclick={() => copyToken(form.newSyncToken)}
							class="flex items-center gap-1 font-sans text-xs text-indigo-400 hover:text-indigo-300"
						>
							{#if copiedToken}
								<Check class="h-3.5 w-3.5 text-emerald-400" />
								<span class="text-emerald-400">Copied</span>
							{:else}
								<Copy class="h-3.5 w-3.5" />
								<span>Copy New Token</span>
							{/if}
						</button>
					{/if}
				</div>

				<div class="text-[11px] text-slate-500">
					Endpoint: <code class="text-indigo-400">POST /api/sync/progress</code> • Authorization:
					<code class="text-indigo-400">Bearer &lt;token&gt;</code>
				</div>
			</div>

			<!-- Latest Snapshot Box -->
			{#if data.latestSnapshot}
				<div class="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
					<div class="flex items-center gap-2 text-xs font-bold text-white">
						<span class="h-2 w-2 rounded-full bg-emerald-400"></span>
						<span>Verified Progress Snapshot (Contract v1)</span>
					</div>
					<div class="grid grid-cols-2 gap-3 pt-2 text-xs sm:grid-cols-4">
						<div>
							<span class="text-[10px] text-slate-500 uppercase">Tasks Reported</span>
							<div class="font-bold text-white">{data.latestSnapshot.tasksAssigned}</div>
						</div>
						<div>
							<span class="text-[10px] text-slate-500 uppercase">Completed</span>
							<div class="font-bold text-emerald-400">{data.latestSnapshot.tasksCompleted}</div>
						</div>
						<div>
							<span class="text-[10px] text-slate-500 uppercase">Overdue</span>
							<div class="font-bold text-rose-400">{data.latestSnapshot.tasksOverdue}</div>
						</div>
						<div>
							<span class="text-[10px] text-slate-500 uppercase">Completion</span>
							<div class="font-bold text-indigo-400">
								{data.latestSnapshot.completionPercentage}%
							</div>
						</div>
					</div>
					<div class="border-t border-slate-800/60 pt-2 text-[10px] text-slate-500">
						Synced at: {new Date(data.latestSnapshot.lastSyncedAt).toLocaleString()} • Source: {data
							.latestSnapshot.source}
					</div>
				</div>
			{:else}
				<div class="p-8 text-center text-xs text-slate-500">
					No synchronized snapshot received from member database yet.
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Manual Points Adjustment Modal -->
{#if showAdjustModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="text-base font-bold text-white">Adjust Member Points</h3>
				<button
					type="button"
					aria-label="Close Points Adjustment Modal"
					onclick={() => (showAdjustModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<form method="POST" action="?/adjustPoints" class="space-y-4">
				<div>
					<label
						for="amount"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
					>
						Points Adjustment (Positive to award, Negative to deduct)
					</label>
					<input
						type="number"
						id="amount"
						name="amount"
						required
						placeholder="+15 or -10"
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
					/>
				</div>

				<div>
					<label
						for="reason"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
					>
						Justification / Reason
					</label>
					<textarea
						id="reason"
						name="reason"
						rows="2"
						required
						placeholder="e.g. Exceptional leadership during community hackathon."
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
					></textarea>
				</div>

				<div class="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
					<button
						type="button"
						onclick={() => (showAdjustModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
					>
						Record in Ledger
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Member Confirmation Modal -->
{#if showDeleteModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-md space-y-5 rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl shadow-rose-950/40"
		>
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<div class="flex items-center gap-2.5 text-rose-400">
					<div class="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5">
						<Trash2 class="h-5 w-5" />
					</div>
					<h3 class="text-base font-bold text-white">Remove Member Account</h3>
				</div>
				<button
					type="button"
					aria-label="Close Delete Modal"
					onclick={() => (showDeleteModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="space-y-3">
				<p class="text-xs leading-relaxed text-slate-300">
					Are you sure you want to permanently delete the account for
					<strong class="text-white">{data.member.fullName}</strong>
					(<span class="text-indigo-300">@{data.member.username}</span>)?
				</p>
				<div
					class="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-300/90"
				>
					<div class="mb-1 flex items-center gap-1.5 font-semibold text-rose-200">
						<AlertTriangle class="h-3.5 w-3.5 shrink-0" />
						Permanent Action
					</div>
					This will permanently remove the member's account, login sessions, and database connection. Tasks created by this member will be reassigned to the CEO.
				</div>
			</div>

			<form
				method="POST"
				action="?/deleteMember"
				class="flex items-center justify-end gap-3 border-t border-slate-800 pt-3"
			>
				<button
					type="button"
					onclick={() => (showDeleteModal = false)}
					class="px-4 py-2 text-xs font-semibold text-slate-400 transition hover:text-white"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500 focus:outline-none"
				>
					<Trash2 class="h-3.5 w-3.5" />
					<span>Permanently Delete</span>
				</button>
			</form>
		</div>
	</div>
{/if}
