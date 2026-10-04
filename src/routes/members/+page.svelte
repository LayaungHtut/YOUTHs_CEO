<script lang="ts">
	import {
		Users,
		UserPlus,
		Search,
		Filter,
		Shield,
		Award,
		CheckSquare,
		AlertTriangle,
		MoreHorizontal,
		KeyRound,
		UserX,
		UserCheck,
		ArrowUpRight,
		Copy,
		Check,
		X,
		Database
	} from '@lucide/svelte';

	let { data, form } = $props();

	let showAddModal = $state(false);
	let showCredentialsModal = $state(false);
	let showRoleModal = $state(false);
	let selectedUserForRole = $state<any>(null);

	let copiedPassword = $state(false);
	let copiedToken = $state(false);

	let searchQuery = $state('');
	let selectedDept = $state('');
	let selectedRole = $state('');
	let selectedStatus = $state('');

	$effect(() => {
		searchQuery = data.filters.search || '';
		selectedDept = data.filters.departmentId || '';
		selectedRole = data.filters.role || '';
		selectedStatus = data.filters.accountStatus || '';
	});

	// Trigger credentials modal if member was just created
	$effect(() => {
		if (form?.success && form?.createdMember) {
			showAddModal = false;
			showCredentialsModal = true;
		}
	});

	function getDepartmentName(deptId: string | null) {
		if (!deptId) return 'No Department';
		const dept = data.departments.find((d) => d.id === deptId);
		return dept ? dept.name : 'Unknown';
	}

	function copyToClipboard(text: string, type: 'password' | 'token') {
		navigator.clipboard.writeText(text);
		if (type === 'password') {
			copiedPassword = true;
			setTimeout(() => (copiedPassword = false), 2000);
		} else {
			copiedToken = true;
			setTimeout(() => (copiedToken = false), 2000);
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
				Organization Directory & Membership
				<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
					{data.members.length} Members
				</span>
			</h1>
			<p class="text-sm text-slate-400 mt-1">
				Administer roles, department assignments, points balance, and individual integration states.
			</p>
		</div>

		<button
			type="button"
			onclick={() => (showAddModal = true)}
			class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition"
		>
			<UserPlus class="w-4 h-4" />
			<span>Add Member</span>
		</button>
	</div>

	<!-- Search & Filters -->
	<div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col md:flex-row gap-3">
		<form method="GET" class="flex-1 flex flex-col sm:flex-row gap-3">
			<div class="relative flex-1">
				<Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					name="search"
					placeholder="Search by full name, username, or email..."
					bind:value={searchQuery}
					class="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
				/>
			</div>

			<select
				name="dept"
				bind:value={selectedDept}
				class="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
			>
				<option value="">All Departments</option>
				{#each data.departments as dept}
					<option value={dept.id}>{dept.name}</option>
				{/each}
			</select>

			<select
				name="role"
				bind:value={selectedRole}
				class="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
			>
				<option value="">All Roles</option>
				<option value="CEO">CEO</option>
				<option value="HEAD">Head</option>
				<option value="MEMBER">Member</option>
			</select>

			<select
				name="status"
				bind:value={selectedStatus}
				class="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
			>
				<option value="">All Statuses</option>
				<option value="ACTIVE">Active</option>
				<option value="SUSPENDED">Suspended</option>
				<option value="INVITED">Invited</option>
			</select>

			<button
				type="submit"
				class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
			>
				Filter
			</button>
		</form>
	</div>

	<!-- Member Directory Table -->
	<div class="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead>
					<tr class="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
						<th class="py-3.5 px-4">Member</th>
						<th class="py-3.5 px-4">Role & Department</th>
						<th class="py-3.5 px-4">Points</th>
						<th class="py-3.5 px-4">Tasks</th>
						<th class="py-3.5 px-4">Database Sync</th>
						<th class="py-3.5 px-4">Status</th>
						<th class="py-3.5 px-4 text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800/60">
					{#if data.members.length === 0}
						<tr>
							<td colspan="7" class="py-12 text-center text-slate-500">
								No members match the selected criteria.
							</td>
						</tr>
					{:else}
						{#each data.members as member}
							<tr class="hover:bg-slate-800/40 transition">
								<td class="py-3 px-4">
									<div class="flex items-center gap-3">
										<div class="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
											{member.fullName.slice(0, 2).toUpperCase()}
										</div>
										<div>
											<a href={`/members/${member.id}`} class="font-bold text-white hover:text-indigo-400 transition">
												{member.fullName}
											</a>
											<div class="text-[11px] text-slate-400">@{member.username} • {member.email}</div>
										</div>
									</div>
								</td>

								<td class="py-3 px-4">
									<div class="flex items-center gap-1.5">
										<span
											class={`px-2 py-0.5 rounded text-[10px] font-bold ${
												member.role === 'CEO'
													? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
													: member.role === 'HEAD'
														? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
														: 'bg-slate-800 text-slate-300 border border-slate-700'
											}`}
										>
											{member.role}
										</span>
									</div>
									<div class="text-[11px] text-slate-400 mt-1">
										{getDepartmentName(member.departmentId)}
									</div>
								</td>

								<td class="py-3 px-4">
									<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold">
										<Award class="w-3.5 h-3.5" />
										<span>{member.points} pts</span>
									</span>
								</td>

								<td class="py-3 px-4">
									<div class="text-slate-200 font-medium">
										{member.completedCount} completed
									</div>
									{#if member.overdueCount > 0}
										<div class="text-rose-400 font-semibold text-[11px]">
											{member.overdueCount} overdue
										</div>
									{/if}
								</td>

								<td class="py-3 px-4">
									<span
										class={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
											member.integrationStatus === 'CONNECTED'
												? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
												: member.integrationStatus === 'CONFIGURED'
													? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
													: 'bg-slate-800 text-slate-400 border border-slate-700'
										}`}
									>
										<Database class="w-3 h-3" />
										<span>{member.integrationStatus}</span>
									</span>
								</td>

								<td class="py-3 px-4">
									<span
										class={`px-2 py-0.5 rounded text-[10px] font-bold ${
											member.accountStatus === 'ACTIVE'
												? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
												: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
										}`}
									>
										{member.accountStatus}
									</span>
								</td>

								<td class="py-3 px-4 text-right">
									<div class="flex items-center justify-end gap-2">
										<a
											href={`/members/${member.id}`}
											class="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
											title="View Member Profile"
										>
											<ArrowUpRight class="w-4 h-4" />
										</a>

										{#if member.role !== 'CEO'}
											<button
												type="button"
												onclick={() => {
													selectedUserForRole = member;
													showRoleModal = true;
												}}
												class="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-indigo-400 hover:bg-slate-700 transition"
												title="Promote or Change Role"
											>
												<Shield class="w-4 h-4" />
											</button>

											<form method="POST" action="?/updateStatus" class="inline">
												<input type="hidden" name="userId" value={member.id} />
												<input
													type="hidden"
													name="status"
													value={member.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}
												/>
												<button
													type="submit"
													class={`p-1.5 rounded-lg bg-slate-800 transition ${
														member.accountStatus === 'ACTIVE'
															? 'text-slate-300 hover:text-rose-400 hover:bg-slate-700'
															: 'text-slate-300 hover:text-emerald-400 hover:bg-slate-700'
													}`}
													title={member.accountStatus === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
												>
													{#if member.accountStatus === 'ACTIVE'}
														<UserX class="w-4 h-4" />
													{:else}
														<UserCheck class="w-4 h-4" />
													{/if}
												</button>
											</form>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Add Member Modal -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white">Create New Organization Member</h3>
				<button
					type="button"
					aria-label="Close Modal"
					onclick={() => (showAddModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form method="POST" action="?/createMember" class="space-y-4">
				<div>
					<label for="fullName" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Full Name</label>
					<input
						type="text"
						id="fullName"
						name="fullName"
						required
						placeholder="e.g. Su Mon"
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="username" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Username</label>
						<input
							type="text"
							id="username"
							name="username"
							required
							placeholder="sumon_dev"
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
						/>
					</div>

					<div>
						<label for="email" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Email</label>
						<input
							type="email"
							id="email"
							name="email"
							required
							placeholder="sumon@youths.org"
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="departmentId" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Department</label>
						<select
							id="departmentId"
							name="departmentId"
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
						<label for="role" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Role</label>
						<select
							id="role"
							name="role"
							class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
						>
							<option value="MEMBER" selected>Member</option>
							<option value="HEAD">Department Head</option>
						</select>
					</div>
				</div>

				<div>
					<label for="customPassword" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
						Custom Temporary Password <span class="text-slate-500 lowercase">(leave blank to auto-generate)</span>
					</label>
					<input
						type="password"
						id="customPassword"
						name="customPassword"
						placeholder="Optional secure temporary password"
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (showAddModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
					>
						Create Account & Issue Key
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Generated Credentials & Sync Token Modal -->
{#if showCredentialsModal && form?.createdMember}
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white flex items-center gap-2">
					<Check class="w-5 h-5 text-emerald-400" />
					<span>Member Account Created</span>
				</h3>
				<button
					type="button"
					aria-label="Close Credentials Modal"
					onclick={() => (showCredentialsModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<p class="text-xs text-slate-400">
				Copy these temporary credentials and deliver them securely to the member. The sync token enables authenticated progress synchronization from their member database.
			</p>

			<div class="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
				<div>
					<span class="text-[10px] font-semibold text-slate-500 uppercase">Username</span>
					<div class="text-sm font-bold text-white">{form.createdMember.username}</div>
				</div>

				<div class="flex items-center justify-between">
					<div>
						<span class="text-[10px] font-semibold text-slate-500 uppercase">Temporary Password</span>
						<div class="text-sm font-mono font-bold text-amber-400">{form.createdMember.tempPassword}</div>
					</div>
					<button
						type="button"
						onclick={() => copyToClipboard(form.createdMember.tempPassword, 'password')}
						class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs"
					>
						{#if copiedPassword}
							<Check class="w-3.5 h-3.5 text-emerald-400" />
							<span class="text-emerald-400">Copied</span>
						{:else}
							<Copy class="w-3.5 h-3.5" />
							<span>Copy</span>
						{/if}
					</button>
				</div>

				<div class="pt-2 border-t border-slate-800 flex items-center justify-between">
					<div class="min-w-0 pr-3">
						<span class="text-[10px] font-semibold text-slate-500 uppercase">Integration Sync Bearer Token</span>
						<div class="text-xs font-mono text-indigo-400 truncate">{form.createdMember.syncToken}</div>
					</div>
					<button
						type="button"
						onclick={() => copyToClipboard(form.createdMember.syncToken, 'token')}
						class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs shrink-0"
					>
						{#if copiedToken}
							<Check class="w-3.5 h-3.5 text-emerald-400" />
							<span class="text-emerald-400">Copied</span>
						{:else}
							<Copy class="w-3.5 h-3.5" />
							<span>Copy</span>
						{/if}
					</button>
				</div>
			</div>

			<div class="flex justify-end">
				<button
					type="button"
					onclick={() => (showCredentialsModal = false)}
					class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Change Role & Department Modal -->
{#if showRoleModal && selectedUserForRole}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<h3 class="text-base font-bold text-white">Promote or Reassign Member</h3>
				<button
					type="button"
					aria-label="Close Role Modal"
					onclick={() => (showRoleModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form method="POST" action="?/updateRole" class="space-y-4">
				<input type="hidden" name="userId" value={selectedUserForRole.id} />

				<div class="text-xs text-slate-400">
					Member: <span class="font-bold text-white">{selectedUserForRole.fullName}</span> (@{selectedUserForRole.username})
				</div>

				<div>
					<label for="newRole" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Role</label>
					<select
						id="newRole"
						name="newRole"
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
					>
						<option value="MEMBER" selected={selectedUserForRole.role === 'MEMBER'}>Department Member</option>
						<option value="HEAD" selected={selectedUserForRole.role === 'HEAD'}>Department Head</option>
					</select>
				</div>

				<div>
					<label for="modalDeptId" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Department</label>
					<select
						id="modalDeptId"
						name="departmentId"
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
					>
						{#each data.departments as dept}
							<option value={dept.id} selected={selectedUserForRole.departmentId === dept.id}>{dept.name}</option>
						{/each}
					</select>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (showRoleModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
					>
						Confirm Role Promotion
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
