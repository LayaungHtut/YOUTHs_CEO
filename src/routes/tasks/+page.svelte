<script lang="ts">
	import {
		CheckSquare,
		Plus,
		Search,
		Filter,
		Columns,
		List,
		Sparkles,
		Clock,
		AlertTriangle,
		CheckCircle2,
		MoreHorizontal,
		ArrowUpRight,
		X
	} from '@lucide/svelte';

	let { data, form } = $props();

	let currentView = $state<'list' | 'kanban'>('list');
	let showCreateModal = $state(false);

	let selectedDeptForCreate = $state('');
	let selectedAssignees = $state<string[]>([]);

	const filteredMembersForCreate = $derived(
		selectedDeptForCreate
			? data.users.filter((u) => u.departmentId === selectedDeptForCreate)
			: data.users
	);

	const kanbanColumns = [
		{ id: 'PENDING', title: 'Pending', color: 'border-slate-700 bg-slate-900/50' },
		{ id: 'IN_PROGRESS', title: 'In Progress', color: 'border-blue-500/30 bg-blue-500/5' },
		{ id: 'COMPLETED', title: 'Completed', color: 'border-emerald-500/30 bg-emerald-500/5' },
		{ id: 'OVERDUE', title: 'Overdue', color: 'border-rose-500/30 bg-rose-500/5' },
		{ id: 'CANCELLED', title: 'Cancelled', color: 'border-slate-800 bg-slate-950/40' }
	];

	function getTasksByStatus(status: string) {
		return data.tasks.filter((t) => t.status === status);
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
				Task Management & Assignments
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
					{data.tasks.length} Tasks
				</span>
			</h1>
			<p class="text-sm text-slate-400 mt-1">
				Track, assign, duplicate, and supervise organizational deliverables across list and Kanban views.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<!-- View Toggle -->
			<div class="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center">
				<button
					type="button"
					onclick={() => (currentView = 'list')}
					class={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
						currentView === 'list'
							? 'bg-indigo-600 text-white shadow-sm'
							: 'text-slate-400 hover:text-white'
					}`}
				>
					<List class="w-3.5 h-3.5" />
					<span>List</span>
				</button>
				<button
					type="button"
					onclick={() => (currentView = 'kanban')}
					class={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
						currentView === 'kanban'
							? 'bg-indigo-600 text-white shadow-sm'
							: 'text-slate-400 hover:text-white'
					}`}
				>
					<Columns class="w-3.5 h-3.5" />
					<span>Kanban</span>
				</button>
			</div>

			<button
				type="button"
				onclick={() => (showCreateModal = true)}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition"
			>
				<Plus class="w-4 h-4" />
				<span>Create Task</span>
			</button>
		</div>
	</div>

	<!-- Search & Filter Bar -->
	<div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80">
		<form method="GET" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
			<div class="relative md:col-span-2">
				<Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					name="search"
					placeholder="Search task title or description..."
					value={data.filters.search || ''}
					class="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
				/>
			</div>

			<select
				name="dept"
				value={data.filters.departmentId || ''}
				class="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
			>
				<option value="">All Departments</option>
				{#each data.departments as dept}
					<option value={dept.id}>{dept.name}</option>
				{/each}
			</select>

			<select
				name="priority"
				value={data.filters.priority || ''}
				class="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
			>
				<option value="">All Priorities</option>
				<option value="LOW">Low</option>
				<option value="MEDIUM">Medium</option>
				<option value="HIGH">High</option>
				<option value="URGENT">Urgent</option>
			</select>

			<div class="flex items-center gap-2">
				<select
					name="source"
					value={data.filters.source || ''}
					class="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
				>
					<option value="">All Sources</option>
					<option value="MANUAL">Manual</option>
					<option value="AI_WEEKLY">AI Weekly</option>
				</select>
				<button
					type="submit"
					class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
				>
					Filter
				</button>
			</div>
		</form>
	</div>

	<!-- VIEW 1: List View -->
	{#if currentView === 'list'}
		<div class="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-sm">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="py-3.5 px-4">Title & Details</th>
							<th class="py-3.5 px-4">Department</th>
							<th class="py-3.5 px-4">Assignee</th>
							<th class="py-3.5 px-4">Source</th>
							<th class="py-3.5 px-4">Priority</th>
							<th class="py-3.5 px-4">Status</th>
							<th class="py-3.5 px-4">Deadline</th>
							<th class="py-3.5 px-4 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#if data.tasks.length === 0}
							<tr>
								<td colspan="8" class="py-12 text-center text-slate-500">
									No tasks found matching criteria.
								</td>
							</tr>
						{:else}
							{#each data.tasks as task}
								<tr class="hover:bg-slate-800/30 transition">
									<td class="py-3 px-4">
										<a href={`/tasks/${task.id}`} class="font-bold text-white hover:text-indigo-400 transition">
											{task.title}
										</a>
										<div class="text-[11px] text-slate-400 truncate max-w-sm">{task.description}</div>
									</td>

									<td class="py-3 px-4 text-slate-300 font-medium">
										{task.departmentName}
									</td>

									<td class="py-3 px-4">
										<div class="text-white font-semibold">{task.assigneeName}</div>
										<div class="text-[10px] text-slate-400">{task.assigneeRole}</div>
									</td>

									<td class="py-3 px-4">
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

									<td class="py-3 px-4">
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

									<td class="py-3 px-4">
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

									<td class="py-3 px-4 text-slate-400">
										{new Date(task.deadline).toLocaleDateString()}
									</td>

									<td class="py-3 px-4 text-right">
										<div class="flex items-center justify-end gap-1.5">
											{#if task.status !== 'COMPLETED' && task.status !== 'CANCELLED'}
												<form method="POST" action="?/updateStatus" class="inline">
													<input type="hidden" name="taskId" value={task.id} />
													<input type="hidden" name="status" value="COMPLETED" />
													<button
														type="submit"
														class="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold transition"
													>
														Complete
													</button>
												</form>
											{/if}

											<a
												href={`/tasks/${task.id}`}
												class="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
												title="Task Details & History"
											>
												<ArrowUpRight class="w-4 h-4" />
											</a>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- VIEW 2: Kanban Board View -->
	{#if currentView === 'kanban'}
		<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
			{#each kanbanColumns as col}
				{@const colTasks = getTasksByStatus(col.id)}
				<div class={`p-4 rounded-2xl border ${col.color} space-y-3 min-h-[500px] flex flex-col`}>
					<div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
						<h3 class="text-xs font-bold uppercase tracking-wider text-slate-300">{col.title}</h3>
						<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
							{colTasks.length}
						</span>
					</div>

					<div class="space-y-3 flex-1 overflow-y-auto">
						{#if colTasks.length === 0}
							<div class="py-8 text-center text-xs text-slate-500">No tasks</div>
						{:else}
							{#each colTasks as task}
								<div class="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-2 hover:border-slate-700 transition">
									<div class="flex items-start justify-between gap-2">
										<a href={`/tasks/${task.id}`} class="text-xs font-bold text-white hover:text-indigo-400">
											{task.title}
										</a>
										<span class="text-[10px] font-semibold text-slate-400 shrink-0">
											{task.priority}
										</span>
									</div>

									<p class="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>

									<div class="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
										<span>{task.assigneeName}</span>
										<span class="text-indigo-400 font-semibold">+{task.pointsReward} pts</span>
									</div>

									<!-- Quick Status Shift -->
									<div class="pt-1 flex items-center justify-between gap-1">
										{#if task.status === 'PENDING'}
											<form method="POST" action="?/updateStatus" class="w-full">
												<input type="hidden" name="taskId" value={task.id} />
												<input type="hidden" name="status" value="IN_PROGRESS" />
												<button
													type="submit"
													class="w-full py-1 text-[10px] rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-semibold text-center transition"
												>
													Start Task
												</button>
											</form>
										{:else if task.status === 'IN_PROGRESS'}
											<form method="POST" action="?/updateStatus" class="w-full">
												<input type="hidden" name="taskId" value={task.id} />
												<input type="hidden" name="status" value="COMPLETED" />
												<button
													type="submit"
													class="w-full py-1 text-[10px] rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-center transition"
												>
													Mark Complete
												</button>
											</form>
										{/if}
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Task Modal with Multiple Duplication Support -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<div>
					<h3 class="text-base font-bold text-white">Create & Assign Task</h3>
					<p class="text-xs text-slate-400 mt-0.5">Select one or multiple members to automatically duplicate this assignment.</p>
				</div>
				<button
					type="button"
					aria-label="Close Task Modal"
					onclick={() => (showCreateModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form method="POST" action="?/createTask" class="space-y-4">
				<div>
					<label for="createTaskTitle" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Task Title</label>
					<input
						type="text"
						id="createTaskTitle"
						name="title"
						required
						placeholder="e.g. Esports Bracket Engine Technical Refactor"
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<div>
					<label for="createTaskDesc" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Task Description</label>
					<textarea
						id="createTaskDesc"
						name="description"
						rows="3"
						required
						placeholder="Detailed deliverables, technical stack requirements, and guidelines..."
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
					></textarea>
				</div>

				<div>
					<label for="createTaskDept" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Department</label>
					<select
						id="createTaskDept"
						name="departmentId"
						bind:value={selectedDeptForCreate}
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
					<label for="assigneeSelect" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
						Assignees (Hold Ctrl/Cmd to select multiple for automatic task cloning)
					</label>
					<select
						id="assigneeSelect"
						name="assignedToIds"
						multiple
						required
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 h-28"
					>
						{#each filteredMembersForCreate as member}
							<option value={member.id}>
								{member.fullName} (@{member.username}) - {member.role}
							</option>
						{/each}
					</select>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div>
						<label for="createTaskPriority" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Priority</label>
						<select
							id="createTaskPriority"
							name="priority"
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
						>
							<option value="LOW">Low</option>
							<option value="MEDIUM" selected>Medium</option>
							<option value="HIGH">High</option>
							<option value="URGENT">Urgent</option>
						</select>
					</div>

					<div>
						<label for="createTaskDays" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Deadline</label>
						<select
							id="createTaskDays"
							name="deadlineDays"
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
						>
							<option value="2">2 Days</option>
							<option value="5" selected>5 Days (Saturday)</option>
							<option value="7">7 Days</option>
							<option value="14">14 Days</option>
						</select>
					</div>

					<div>
						<label for="createTaskReward" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Reward Pts</label>
						<input
							type="number"
							id="createTaskReward"
							name="pointsReward"
							value="10"
							min="5"
							max="50"
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
						class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
					>
						Create & Dispatch
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
