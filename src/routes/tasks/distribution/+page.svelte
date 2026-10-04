<script lang="ts">
	import {
		Sparkles,
		Calendar,
		Users,
		Layers,
		CheckCircle2,
		AlertCircle,
		Send,
		Edit3,
		Trash2,
		RefreshCw,
		HelpCircle,
		X
	} from '@lucide/svelte';

	let { data, form } = $props();

	let showEditModal = $state(false);
	let selectedAssignment = $state<any>(null);

	let isGenerating = $state(false);

	function openEditModal(assignment: any) {
		selectedAssignment = assignment;
		showEditModal = true;
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
				AI Weekly Task Distribution Engine
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
					OpenRouter / UnoRouter Ready
				</span>
			</h1>
			<p class="text-sm text-slate-400 mt-1">
				Automated Monday cycle matching active members to departmental task templates with executive review and approval.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<form method="POST" action="?/generateDistribution" onsubmit={() => (isGenerating = true)}>
				<input type="hidden" name="weekId" value={data.week.id} />
				<button
					type="submit"
					disabled={isGenerating || data.week.distributionStatus === 'PUBLISHED'}
					class={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-lg transition ${
						data.week.distributionStatus === 'PUBLISHED'
							? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
							: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
					}`}
				>
					<Sparkles class={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
					<span>{isGenerating ? 'Generating...' : 'Run AI Distribution'}</span>
				</button>
			</form>

			{#if data.week.distributionStatus === 'PROPOSED'}
				<form method="POST" action="?/publishDistribution">
					<input type="hidden" name="weekId" value={data.week.id} />
					<button
						type="submit"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
					>
						<Send class="w-4 h-4" />
						<span>Publish & Dispatch Tasks</span>
					</button>
				</form>
			{/if}
		</div>
	</div>

	<!-- Status & Schedule Banner -->
	<div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div>
			<span class="text-[10px] font-semibold uppercase text-slate-400">Current Cycle</span>
			<div class="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
				<Calendar class="w-4 h-4 text-indigo-400" />
				<span>
					{new Date(data.week.weekStart).toLocaleDateString()} - {new Date(data.week.weekEnd).toLocaleDateString()}
				</span>
			</div>
			<div class="text-[11px] text-slate-500 mt-1">Saturday Weekly Deadline</div>
		</div>

		<div>
			<span class="text-[10px] font-semibold uppercase text-slate-400">Distribution Status</span>
			<div class="mt-1">
				<span
					class={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
						data.week.distributionStatus === 'PUBLISHED'
							? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
							: data.week.distributionStatus === 'PROPOSED'
								? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
								: 'bg-slate-800 text-slate-400 border border-slate-700'
					}`}
				>
					<span class="w-1.5 h-1.5 rounded-full bg-current"></span>
					<span>{data.week.distributionStatus}</span>
				</span>
			</div>
			<div class="text-[11px] text-slate-500 mt-1">
				{data.week.distributionStatus === 'PUBLISHED' ? 'Authoritative Tasks Active' : 'Requires CEO Review'}
			</div>
		</div>

		<div>
			<span class="text-[10px] font-semibold uppercase text-slate-400">Eligible Members</span>
			<div class="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
				<Users class="w-4 h-4 text-indigo-400" />
				<span>{data.eligibleMembersCount} Active Members</span>
			</div>
			<div class="text-[11px] text-slate-500 mt-1">Target: 1 primary task/member</div>
		</div>

		<div>
			<span class="text-[10px] font-semibold uppercase text-slate-400">Task Templates Library</span>
			<div class="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
				<Layers class="w-4 h-4 text-indigo-400" />
				<span>{data.templatesCount} Department Templates</span>
			</div>
			<div class="text-[11px] text-slate-500 mt-1">Across 5 departments</div>
		</div>
	</div>

	<!-- Proposed Assignments Table -->
	<div class="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-sm space-y-4 p-5">
		<div class="flex items-center justify-between pb-3 border-b border-slate-800">
			<div>
				<h3 class="text-sm font-bold text-white flex items-center gap-2">
					<Sparkles class="w-4 h-4 text-purple-400" />
					<span>Weekly Task Assignments Proposal</span>
				</h3>
				<p class="text-xs text-slate-400 mt-0.5">
					Review, override, or approve AI-generated task allocations prior to publication.
				</p>
			</div>

			{#if data.proposal}
				<span class="text-xs text-purple-400 font-semibold px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
					Engine: {data.proposal.generatedBy}
				</span>
			{/if}
		</div>

		{#if data.assignments.length === 0}
			<div class="py-16 text-center text-slate-500 space-y-3">
				<Sparkles class="w-8 h-8 mx-auto text-slate-600" />
				<div class="text-sm font-medium text-slate-400">No proposed distribution for this week yet.</div>
				<p class="text-xs text-slate-500 max-w-sm mx-auto">
					Click "Run AI Distribution" to analyze member capacity and match them with active department task templates.
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="py-3 px-3">Member</th>
							<th class="py-3 px-3">Department</th>
							<th class="py-3 px-3">Proposed Task</th>
							<th class="py-3 px-3">Effort & Priority</th>
							<th class="py-3 px-3">AI Reasoning</th>
							<th class="py-3 px-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each data.assignments as item}
							<tr class="hover:bg-slate-800/30 transition">
								<td class="py-3 px-3 font-semibold text-white">
									<div>{item.memberName}</div>
									<div class="text-[10px] text-slate-400">{item.memberRole}</div>
								</td>

								<td class="py-3 px-3 text-slate-300 font-medium">
									{item.departmentName}
								</td>

								<td class="py-3 px-3 max-w-xs">
									<div class="font-bold text-slate-200">{item.title}</div>
									<div class="text-[11px] text-slate-400 truncate">{item.description}</div>
								</td>

								<td class="py-3 px-3">
									<div class="font-semibold text-slate-300">{item.priority}</div>
									<div class="text-[10px] text-slate-500">{item.estimatedEffort}</div>
								</td>

								<td class="py-3 px-3 max-w-xs text-slate-400 text-[11px] italic">
									"{item.reasoning}"
								</td>

								<td class="py-3 px-3 text-right">
									{#if data.week.distributionStatus !== 'PUBLISHED'}
										<div class="flex items-center justify-end gap-1.5">
											<button
												type="button"
												onclick={() => openEditModal(item)}
												class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
												title="Override Assignment"
											>
												<Edit3 class="w-3.5 h-3.5" />
											</button>
											<form method="POST" action="?/removeAssignment" class="inline">
												<input type="hidden" name="weekId" value={data.week.id} />
												<input type="hidden" name="memberId" value={item.memberId} />
												<button
													type="submit"
													class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
													title="Remove Assignment"
												>
													<Trash2 class="w-3.5 h-3.5" />
												</button>
											</form>
										</div>
									{:else}
										<span class="text-[11px] text-emerald-400 font-semibold">Published</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Override Proposed Assignment Modal -->
{#if showEditModal && selectedAssignment}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white">Override Proposed Assignment</h3>
				<button
					type="button"
					aria-label="Close Override Modal"
					onclick={() => (showEditModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form method="POST" action="?/overrideAssignment" class="space-y-4">
				<input type="hidden" name="weekId" value={data.week.id} />
				<input type="hidden" name="memberId" value={selectedAssignment.memberId} />

				<div class="text-xs text-slate-400">
					Assignee: <span class="font-bold text-white">{selectedAssignment.memberName}</span>
				</div>

				<div>
					<label for="overrideTitle" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Task Title</label>
					<input
						type="text"
						id="overrideTitle"
						name="title"
						value={selectedAssignment.title}
						required
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<div>
					<label for="overrideDesc" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Description</label>
					<textarea
						id="overrideDesc"
						name="description"
						rows="3"
						value={selectedAssignment.description}
						required
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
					></textarea>
				</div>

				<div>
					<label for="overridePriority" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Priority</label>
					<select
						id="overridePriority"
						name="priority"
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
					>
						<option value="LOW" selected={selectedAssignment.priority === 'LOW'}>Low</option>
						<option value="MEDIUM" selected={selectedAssignment.priority === 'MEDIUM'}>Medium</option>
						<option value="HIGH" selected={selectedAssignment.priority === 'HIGH'}>High</option>
						<option value="URGENT" selected={selectedAssignment.priority === 'URGENT'}>Urgent</option>
					</select>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (showEditModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
					>
						Save Assignment Override
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
