<script lang="ts">
	import {
		Users,
		Shield,
		CheckSquare,
		AlertTriangle,
		TrendingUp,
		Clock,
		Building2,
		Sparkles,
		Plus,
		ArrowUpRight,
		CheckCircle2,
		X
	} from '@lucide/svelte';

	let { data, form } = $props();

	let showQuickCreateModal = $state(false);
	let selectedDeptId = $state('');

	const filteredMembers = $derived(
		selectedDeptId
			? data.activeMembers.filter((m) => m.departmentId === selectedDeptId)
			: data.activeMembers
	);
</script>

<div class="space-y-8">
	<!-- Top Executive Banner -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
				Executive Command Center
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
					Live
				</span>
			</h1>
			<p class="text-sm text-slate-400 mt-1">
				Real-time organizational oversight across Software, Design, Games, Merchandise, and Finance.
			</p>
		</div>
		<div class="flex items-center gap-3">
			<a
				href="/tasks/distribution"
				class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold hover:bg-slate-700/70 transition"
			>
				<Sparkles class="w-4 h-4 text-indigo-400" />
				<span>AI Weekly Cycle</span>
			</a>
			<button
				type="button"
				onclick={() => (showQuickCreateModal = true)}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition"
			>
				<Plus class="w-4 h-4" />
				<span>Create Task</span>
			</button>
		</div>
	</div>

	<!-- KPI Metric Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Total Members -->
		<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm relative overflow-hidden">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Active Members</span>
				<div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
					<Users class="w-4 h-4" />
				</div>
			</div>
			<div class="mt-3 flex items-baseline gap-2">
				<span class="text-3xl font-extrabold text-white tracking-tight">{data.metrics.totalMembers}</span>
				<span class="text-xs text-indigo-400 font-medium">({data.metrics.totalHeads} Heads)</span>
			</div>
			<div class="mt-3 flex items-center text-xs text-slate-400">
				<span>Across {data.metrics.totalDepartments} core departments</span>
			</div>
		</div>

		<!-- Completion Rate -->
		<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm relative overflow-hidden">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Completion Rate</span>
				<div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
					<TrendingUp class="w-4 h-4" />
				</div>
			</div>
			<div class="mt-3 flex items-baseline gap-2">
				<span class="text-3xl font-extrabold text-white tracking-tight">{data.metrics.completionRate}%</span>
				<span class="text-xs text-emerald-400 font-medium">
					{data.metrics.completedTasks}/{data.metrics.totalTasks} Done
				</span>
			</div>
			<div class="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
				<div
					class="bg-emerald-500 h-full rounded-full transition-all duration-500"
					style="width: {data.metrics.completionRate}%"
				></div>
			</div>
		</div>

		<!-- In Progress -->
		<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm relative overflow-hidden">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Tasks In Progress</span>
				<div class="p-2 rounded-xl bg-blue-500/10 text-blue-400">
					<Clock class="w-4 h-4" />
				</div>
			</div>
			<div class="mt-3 flex items-baseline gap-2">
				<span class="text-3xl font-extrabold text-white tracking-tight">{data.metrics.inProgressTasks}</span>
				<span class="text-xs text-slate-400">({data.metrics.pendingTasks} pending)</span>
			</div>
			<div class="mt-3 text-xs text-slate-400">
				Active weekly execution cycle
			</div>
		</div>

		<!-- Overdue Tasks -->
		<div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-sm relative overflow-hidden">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Overdue Tasks</span>
				<div class="p-2 rounded-xl bg-rose-500/10 text-rose-400">
					<AlertTriangle class="w-4 h-4" />
				</div>
			</div>
			<div class="mt-3 flex items-baseline gap-2">
				<span class="text-3xl font-extrabold text-rose-400 tracking-tight">{data.metrics.overdueTasks}</span>
				<span class="text-xs text-rose-300/80">Require Intervention</span>
			</div>
			<div class="mt-3 text-xs text-slate-400">
				-10 pts deduction applied automatically
			</div>
		</div>
	</div>

	<!-- Department Task Performance Breakdown -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-base font-bold tracking-tight text-white flex items-center gap-2">
				<Building2 class="w-4 h-4 text-indigo-400" />
				<span>Departmental Delivery Matrix</span>
			</h2>
			<a href="/departments" class="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
				<span>Manage Departments</span>
				<ArrowUpRight class="w-3.5 h-3.5" />
			</a>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.departmentStats as dept}
				<div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition space-y-4">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="text-sm font-bold text-white tracking-tight">{dept.name}</h3>
							<div class="text-xs text-slate-400 mt-0.5">Head: <span class="text-slate-200 font-medium">{dept.headName}</span></div>
						</div>
						<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
							{dept.memberCount} members
						</span>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between text-xs">
							<span class="text-slate-400">Completion</span>
							<span class="font-bold text-white">{dept.completionRate}%</span>
						</div>
						<div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
							<div
								class="bg-indigo-500 h-full rounded-full transition-all duration-300"
								style="width: {dept.completionRate}%"
							></div>
						</div>
					</div>

					<div class="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
						<span>Total: {dept.taskCount} tasks</span>
						<span class={dept.overdueCount > 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}>
							{dept.overdueCount} overdue
						</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Attention & Recent Tasks Row -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Members Needing Attention -->
		<div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-bold tracking-tight text-white flex items-center gap-2">
					<AlertTriangle class="w-4 h-4 text-amber-400" />
					<span>Members Needing Attention</span>
				</h3>
				<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
					{data.membersNeedingAttention.length}
				</span>
			</div>

			<div class="space-y-3">
				{#if data.membersNeedingAttention.length === 0}
					<div class="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
						<CheckCircle2 class="w-6 h-6 text-emerald-400/60" />
						<span>All members are on schedule! No overdue tasks.</span>
					</div>
				{:else}
					{#each data.membersNeedingAttention as member}
						<div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
							<div>
								<div class="text-xs font-bold text-white">{member.fullName}</div>
								<div class="text-[11px] text-slate-400 mt-0.5">@{member.username}</div>
							</div>
							<div class="text-right">
								<span class="text-xs font-bold text-rose-400">{member.overdueCount} overdue</span>
								<div class="mt-1">
									<a
										href={`/members/${member.id}`}
										class="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
									>
										Review Profile →
									</a>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Recent Tasks Stream -->
		<div class="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-bold tracking-tight text-white flex items-center gap-2">
					<CheckSquare class="w-4 h-4 text-indigo-400" />
					<span>Recent Organizational Tasks</span>
				</h3>
				<a href="/tasks" class="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
					<span>View All Tasks</span>
					<ArrowUpRight class="w-3.5 h-3.5" />
				</a>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="pb-3">Task Title</th>
							<th class="pb-3">Source</th>
							<th class="pb-3">Priority</th>
							<th class="pb-3">Status</th>
							<th class="pb-3">Deadline</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#if data.recentTasks.length === 0}
							<tr>
								<td colspan="5" class="py-8 text-center text-slate-500">
									No tasks created yet. Create a manual task or run weekly AI distribution.
								</td>
							</tr>
						{:else}
							{#each data.recentTasks as task}
								<tr class="hover:bg-slate-800/30 transition">
									<td class="py-3 font-semibold text-slate-200">
										<a href={`/tasks/${task.id}`} class="hover:text-indigo-400">
											{task.title}
										</a>
									</td>
									<td class="py-3">
										<span
											class={`px-2 py-0.5 rounded text-[10px] font-semibold ${
												task.source === 'AI_WEEKLY'
													? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
													: 'bg-slate-800 text-slate-300 border border-slate-700'
											}`}
										>
											{task.source}
										</span>
									</td>
									<td class="py-3">
										<span
											class={`font-semibold ${
												task.priority === 'URGENT'
													? 'text-rose-400'
													: task.priority === 'HIGH'
														? 'text-amber-400'
														: 'text-slate-300'
											}`}
										>
											{task.priority}
										</span>
									</td>
									<td class="py-3">
										<span
											class={`px-2 py-0.5 rounded text-[10px] font-semibold ${
												task.status === 'COMPLETED'
													? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
													: task.status === 'OVERDUE'
														? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
														: task.status === 'IN_PROGRESS'
															? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
															: 'bg-slate-800 text-slate-400 border border-slate-700'
											}`}
										>
											{task.status}
										</span>
									</td>
									<td class="py-3 text-slate-400">
										{new Date(task.deadline).toLocaleDateString()}
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<!-- Quick Create Task Modal -->
{#if showQuickCreateModal}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white">Create & Assign Manual Task</h3>
				<button
					type="button"
					aria-label="Close Modal"
					onclick={() => (showQuickCreateModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form method="POST" action="?/quickCreateTask" class="space-y-4">
				<div>
					<label for="title" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Task Title</label>
					<input
						type="text"
						id="title"
						name="title"
						required
						placeholder="e.g. Design Branding Kit for Fall Championship"
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<div>
					<label for="description" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Description & Scope</label>
					<textarea
						id="description"
						name="description"
						rows="3"
						required
						placeholder="Detailed deliverables, specifications, and reference links..."
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
					></textarea>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="departmentId" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Department</label>
						<select
							id="departmentId"
							name="departmentId"
							bind:value={selectedDeptId}
							required
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
						>
							<option value="">Select Department</option>
							{#each data.departments as dept}
								<option value={dept.id}>{dept.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="assignedTo" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Assignee</label>
						<select
							id="assignedTo"
							name="assignedTo"
							required
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
						>
							<option value="">Select Member</option>
							{#each filteredMembers as member}
								<option value={member.id}>{member.fullName} ({member.role})</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="priority" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Priority</label>
						<select
							id="priority"
							name="priority"
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
						>
							<option value="LOW">Low</option>
							<option value="MEDIUM" selected>Medium</option>
							<option value="HIGH">High</option>
							<option value="URGENT">Urgent</option>
						</select>
					</div>

					<div>
						<label for="deadlineDays" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Deadline</label>
						<select
							id="deadlineDays"
							name="deadlineDays"
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
						>
							<option value="2">2 Days</option>
							<option value="5" selected>5 Days (Weekly Saturday)</option>
							<option value="7">7 Days</option>
							<option value="14">14 Days</option>
						</select>
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (showQuickCreateModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
					>
						Create & Dispatch Task
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
