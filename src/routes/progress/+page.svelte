<script lang="ts">
	import {
		BarChart3,
		Award,
		TrendingUp,
		TrendingDown,
		CheckCircle2,
		AlertTriangle,
		Building2,
		Users,
		ShieldCheck,
		ArrowUpRight
	} from '@lucide/svelte';

	let { data } = $props();
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
			Progress & Performance Analytics
			<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
				Live Ledger Metrics
			</span>
		</h1>
		<p class="text-sm text-slate-400 mt-1">
			Transparent performance tracking, organizational points leaderboard, and departmental execution velocity.
		</p>
	</div>

	<!-- Top Metrics -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase text-slate-400">Total Points Rewarded</span>
				<TrendingUp class="w-4 h-4 text-emerald-400" />
			</div>
			<div class="mt-2 text-3xl font-extrabold text-emerald-400 tracking-tight">
				+{data.totalEarned} <span class="text-sm font-medium text-slate-400">pts</span>
			</div>
			<div class="mt-2 text-xs text-slate-400">Granted through verified on-time tasks</div>
		</div>

		<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase text-slate-400">Total Penalties</span>
				<TrendingDown class="w-4 h-4 text-rose-400" />
			</div>
			<div class="mt-2 text-3xl font-extrabold text-rose-400 tracking-tight">
				-{data.totalDeducted} <span class="text-sm font-medium text-slate-400">pts</span>
			</div>
			<div class="mt-2 text-xs text-slate-400">Automatic deductions for overdue tasks</div>
		</div>

		<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase text-slate-400">Audited Transactions</span>
				<ShieldCheck class="w-4 h-4 text-indigo-400" />
			</div>
			<div class="mt-2 text-3xl font-extrabold text-white tracking-tight">
				{data.totalTransactions}
			</div>
			<div class="mt-2 text-xs text-slate-400">Append-only ledger entries</div>
		</div>

		<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase text-slate-400">Members Ranked</span>
				<Users class="w-4 h-4 text-blue-400" />
			</div>
			<div class="mt-2 text-3xl font-extrabold text-white tracking-tight">
				{data.leaderboard.length}
			</div>
			<div class="mt-2 text-xs text-slate-400">Active participants in leaderboard</div>
		</div>
	</div>

	<!-- Leaderboard Table -->
	<div class="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-sm">
		<div class="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
			<div>
				<h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
					Organizational Points & Performance Leaderboard
				</h3>
				<p class="text-[11px] text-slate-500 mt-0.5">
					Calculated objectively from task deadlines and verified completion records.
				</p>
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead>
					<tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
						<th class="py-3 px-4">Rank</th>
						<th class="py-3 px-4">Member</th>
						<th class="py-3 px-4">Department</th>
						<th class="py-3 px-4">Points Balance</th>
						<th class="py-3 px-4">Completed</th>
						<th class="py-3 px-4">On-Time Rate</th>
						<th class="py-3 px-4">Overdue</th>
						<th class="py-3 px-4 text-right">Profile</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800/60">
					{#if data.leaderboard.length === 0}
						<tr>
							<td colspan="8" class="py-12 text-center text-slate-500">
								No members ranked yet.
							</td>
						</tr>
					{:else}
						{#each data.leaderboard as member, idx}
							<tr class="hover:bg-slate-800/30 transition">
								<td class="py-3 px-4 font-bold text-slate-400">
									{#if idx === 0}
										<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
											1
										</span>
									{:else if idx === 1}
										<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/30 text-xs">
											2
										</span>
									{:else if idx === 2}
										<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/30 text-xs">
											3
										</span>
									{:else}
										<span class="pl-2">{idx + 1}</span>
									{/if}
								</td>

								<td class="py-3 px-4">
									<a href={`/members/${member.id}`} class="font-bold text-white hover:text-indigo-400 transition">
										{member.fullName}
									</a>
									<div class="text-[11px] text-slate-400">@{member.username}</div>
								</td>

								<td class="py-3 px-4 text-slate-300 font-medium">
									{member.departmentName}
								</td>

								<td class="py-3 px-4">
									<span class="inline-flex items-center gap-1 font-bold text-indigo-400 text-sm">
										<Award class="w-3.5 h-3.5" />
										<span>{member.balance} pts</span>
									</span>
								</td>

								<td class="py-3 px-4 text-slate-200 font-semibold">
									{member.completedCount} / {member.totalTasks}
								</td>

								<td class="py-3 px-4">
									<div class="flex items-center gap-2">
										<span class="font-bold text-white">{member.completionRate}%</span>
										<div class="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
											<div
												class="bg-emerald-500 h-full rounded-full"
												style="width: {member.completionRate}%"
											></div>
										</div>
									</div>
								</td>

								<td class="py-3 px-4 font-semibold text-rose-400">
									{member.overdueCount > 0 ? `${member.overdueCount}` : '0'}
								</td>

								<td class="py-3 px-4 text-right">
									<a
										href={`/members/${member.id}`}
										class="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold text-[11px]"
									>
										<span>View</span>
										<ArrowUpRight class="w-3 h-3" />
									</a>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Departmental Performance Comparison -->
	<div class="space-y-4">
		<h3 class="text-sm font-bold text-white flex items-center gap-2">
			<Building2 class="w-4 h-4 text-indigo-400" />
			<span>Department Delivery Velocity Comparison</span>
		</h3>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.departmentAnalytics as dept}
				<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3">
					<div class="flex items-center justify-between">
						<span class="font-bold text-sm text-white">{dept.name}</span>
						<span class="text-xs text-indigo-400 font-bold">{dept.completionRate}%</span>
					</div>

					<div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
						<div
							class="bg-indigo-500 h-full rounded-full transition-all duration-300"
							style="width: {dept.completionRate}%"
						></div>
					</div>

					<div class="flex items-center justify-between text-xs text-slate-400 pt-1">
						<span>{dept.memberCount} members</span>
						<span>{dept.completedCount} / {dept.taskCount} tasks</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Points Policy Note -->
	<div class="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1">
		<div class="font-semibold text-slate-300">Organizational Scoring Transparency Policy:</div>
		<p class="leading-relaxed">
			Every member starts with 100 points. Completing an assigned weekly task by Saturday awards +10 points. Missing a deadline deducts -10 points. Points are recorded strictly in an append-only cryptographic ledger with idempotency protections.
		</p>
	</div>
</div>
