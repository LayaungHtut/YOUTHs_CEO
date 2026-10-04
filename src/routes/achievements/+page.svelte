<script lang="ts">
	import {
		Award,
		Plus,
		CheckCircle2,
		Zap,
		Flame,
		Shield,
		RefreshCw,
		Check,
		X
	} from '@lucide/svelte';

	let { data, form } = $props();

	let showCreateModal = $state(false);
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
				Organizational Achievements & Badges
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
					{data.achievements.length} Achievements
				</span>
			</h1>
			<p class="text-sm text-slate-400 mt-1">
				Define criteria, supervise unlocked milestones, and motivate member contributions across departments.
			</p>
		</div>

		<button
			type="button"
			onclick={() => (showCreateModal = true)}
			class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-amber-600/20 hover:from-amber-500 hover:to-indigo-500 transition"
		>
			<Plus class="w-4 h-4" />
			<span>Create Achievement</span>
		</button>
	</div>

	<!-- Achievement Cards Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each data.achievements as ach}
			<div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between space-y-4">
				<div class="space-y-3">
					<div class="flex items-start justify-between">
						<div class="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
							<Award class="w-6 h-6" />
						</div>

						<div class="flex items-center gap-2">
							<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
								{ach.category}
							</span>
							<form method="POST" action="?/toggleActive">
								<input type="hidden" name="id" value={ach.id} />
								<input type="hidden" name="active" value={ach.active.toString()} />
								<button
									type="submit"
									class={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
										ach.active
											? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
											: 'bg-slate-800 text-slate-500 border border-slate-700'
									}`}
								>
									{ach.active ? 'Active' : 'Disabled'}
								</button>
							</form>
						</div>
					</div>

					<div>
						<h3 class="text-base font-bold text-white tracking-tight">{ach.name}</h3>
						<p class="text-xs text-slate-400 mt-1 leading-relaxed">{ach.description}</p>
					</div>

					<div class="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-[11px] font-mono text-slate-400">
						Criteria: {ach.criteria}
					</div>
				</div>

				<div class="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
					<span>Total Unlocked:</span>
					<span class="font-bold text-white text-sm">{ach.unlockCount} members</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Create Achievement Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white">Create Custom Achievement</h3>
				<button
					type="button"
					aria-label="Close Achievement Modal"
					onclick={() => (showCreateModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form method="POST" action="?/createAchievement" class="space-y-4">
				<div>
					<label for="achName" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Achievement Name</label>
					<input
						type="text"
						id="achName"
						name="name"
						required
						placeholder="e.g. Master Architect"
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<div>
					<label for="achDesc" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Description</label>
					<textarea
						id="achDesc"
						name="description"
						rows="2"
						required
						placeholder="Deliver 5 high-impact architecture milestones..."
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="achCat" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Category</label>
						<select
							id="achCat"
							name="category"
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
						>
							<option value="TASKS">Tasks</option>
							<option value="CONSISTENCY">Consistency</option>
							<option value="DEPARTMENT">Department</option>
							<option value="POINTS">Points</option>
						</select>
					</div>

					<div>
						<label for="achThreshold" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Task Threshold</label>
						<input
							type="number"
							id="achThreshold"
							name="threshold"
							value="5"
							min="1"
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
						/>
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (showCreateModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
					>
						Save Achievement
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
