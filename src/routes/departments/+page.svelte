<script lang="ts">
	import {
		Building2,
		Shield,
		Users,
		CheckSquare,
		TrendingUp,
		AlertTriangle,
		MoreHorizontal,
		UserCheck,
		Edit3,
		ArrowRight,
		X
	} from '@lucide/svelte';

	let { data, form } = $props();

	let showAssignHeadModal = $state(false);
	let selectedDept = $state<any>(null);

	let showEditDescModal = $state(false);
	let editDesc = $state('');

	function openAssignHead(dept: any) {
		selectedDept = dept;
		showAssignHeadModal = true;
	}

	function openEditDesc(dept: any) {
		selectedDept = dept;
		editDesc = dept.description;
		showEditDescModal = true;
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
				Department Administration & Leadership
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
					5 Departments
				</span>
			</h1>
			<p class="text-sm text-slate-400 mt-1">
				Oversee department Heads, member allocations, and operational delivery metrics.
			</p>
		</div>
	</div>

	<!-- Department Cards Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each data.departments as dept}
			<div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 transition flex flex-col justify-between space-y-5">
				<div class="space-y-4">
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
								<Building2 class="w-5 h-5" />
							</div>
							<div>
								<h3 class="text-base font-bold text-white tracking-tight">{dept.name}</h3>
								<span class="text-xs text-slate-400">{dept.membersCount} active members</span>
							</div>
						</div>

						<button
							type="button"
							aria-label="Edit Department Description"
							onclick={() => openEditDesc(dept)}
							class="text-slate-500 hover:text-slate-300 p-1"
						>
							<Edit3 class="w-4 h-4" />
						</button>
					</div>

					<p class="text-xs text-slate-400 line-clamp-3 leading-relaxed">
						{dept.description}
					</p>

					<!-- Head of Department Pill -->
					<div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/70 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Shield class="w-4 h-4 text-indigo-400" />
							<div class="text-xs">
								<span class="text-slate-500">Head: </span>
								<span class="font-bold text-white">
									{dept.headUser ? dept.headUser.fullName : 'Unassigned'}
								</span>
							</div>
						</div>
						<button
							type="button"
							onclick={() => openAssignHead(dept)}
							class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
						>
							{dept.headUser ? 'Replace' : 'Assign'}
						</button>
					</div>

					<!-- Metrics -->
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

					<div class="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800/60">
						<div class="p-2 rounded-lg bg-slate-950/40">
							<span class="text-[10px] text-slate-500 uppercase block">Tasks</span>
							<span class="font-bold text-white">{dept.tasksCount}</span>
						</div>
						<div class="p-2 rounded-lg bg-slate-950/40">
							<span class="text-[10px] text-slate-500 uppercase block">Done</span>
							<span class="font-bold text-emerald-400">{dept.completedCount}</span>
						</div>
						<div class="p-2 rounded-lg bg-slate-950/40">
							<span class="text-[10px] text-slate-500 uppercase block">Overdue</span>
							<span class="font-bold text-rose-400">{dept.overdueCount}</span>
						</div>
					</div>
				</div>

				<div class="pt-3 border-t border-slate-800/60 flex items-center justify-between">
					<a
						href={`/tasks?dept=${dept.id}`}
						class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
					>
						<span>View Department Tasks</span>
						<ArrowRight class="w-3.5 h-3.5" />
					</a>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Assign / Replace Head Modal -->
{#if showAssignHeadModal && selectedDept}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white">Assign Department Head</h3>
				<button
					type="button"
					aria-label="Close Head Modal"
					onclick={() => (showAssignHeadModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form method="POST" action="?/assignHead" class="space-y-4">
				<input type="hidden" name="departmentId" value={selectedDept.id} />

				<div class="text-xs text-slate-400">
					Department: <span class="font-bold text-white">{selectedDept.name}</span>
				</div>

				<div>
					<label for="headUserId" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
						Select Leader to Promote as Head
					</label>
					<select
						id="headUserId"
						name="headUserId"
						required
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
					>
						<option value="">Select a member</option>
						{#each data.allUsers as user}
							{#if user.role !== 'CEO'}
								<option value={user.id} selected={selectedDept.headUserId === user.id}>
									{user.fullName} (@{user.username}) - Current Role: {user.role}
								</option>
							{/if}
						{/each}
					</select>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (showAssignHeadModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
					>
						Approve & Assign Head
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Description Modal -->
{#if showEditDescModal && selectedDept}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white">Edit Department Scope</h3>
				<button
					type="button"
					aria-label="Close Description Modal"
					onclick={() => (showEditDescModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form method="POST" action="?/updateDescription" class="space-y-4">
				<input type="hidden" name="departmentId" value={selectedDept.id} />

				<div>
					<label for="description" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
						Description & Mission
					</label>
					<textarea
						id="description"
						name="description"
						rows="4"
						bind:value={editDesc}
						required
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
					></textarea>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (showEditDescModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
					>
						Save Changes
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
