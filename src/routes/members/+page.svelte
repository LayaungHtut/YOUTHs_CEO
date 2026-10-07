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
		Database,
		Mail,
		Trash2
	} from '@lucide/svelte';

	let { data, form } = $props();

	let showAddModal = $state(false);
	let showCredentialsModal = $state(false);
	let showRoleModal = $state(false);
	let showResetModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedUserForRole = $state<any>(null);
	let selectedUserForDelete = $state<any>(null);

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

	// Trigger reset modal if password was reset
	$effect(() => {
		if (form?.success && form?.resetInfo) {
			showResetModal = true;
		}
	});

	// Close delete modal if member was deleted
	$effect(() => {
		if (form?.success && form?.deletedMember) {
			showDeleteModal = false;
			selectedUserForDelete = null;
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
	<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
		<div>
			<h1 class="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white">
				Organization Directory & Membership
				<span
					class="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400"
				>
					{data.members.length} Members
				</span>
			</h1>
			<p class="mt-1 text-sm text-slate-400">
				Administer roles, department assignments, points balance, and individual integration states.
			</p>
		</div>

		<button
			type="button"
			onclick={() => (showAddModal = true)}
			class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-violet-500"
		>
			<UserPlus class="h-4 w-4" />
			<span>Add Member</span>
		</button>
	</div>

	{#if form?.error}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300"
		>
			<AlertTriangle class="h-4 w-4 shrink-0 text-red-400" />
			<span>{form.error}</span>
		</div>
	{/if}

	{#if form?.success && form?.deletedMember}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300"
		>
			<Check class="h-4 w-4 shrink-0 text-emerald-400" />
			<span>
				Member account for <strong class="text-white">{form.deletedMember.fullName}</strong> (@{form.deletedMember.username}) was permanently removed.
			</span>
		</div>
	{/if}

	<!-- Search & Filters -->
	<div
		class="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4 md:flex-row"
	>
		<form method="GET" class="flex flex-1 flex-col gap-3 sm:flex-row">
			<div class="relative flex-1">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					name="search"
					placeholder="Search by full name, username, or email..."
					bind:value={searchQuery}
					class="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pr-4 pl-9 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
				/>
			</div>

			<select
				name="dept"
				bind:value={selectedDept}
				class="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
			>
				<option value="">All Departments</option>
				{#each data.departments as dept}
					<option value={dept.id}>{dept.name}</option>
				{/each}
			</select>

			<select
				name="role"
				bind:value={selectedRole}
				class="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
			>
				<option value="">All Roles</option>
				<option value="CEO">CEO</option>
				<option value="HEAD">Head</option>
				<option value="MEMBER">Member</option>
			</select>

			<select
				name="status"
				bind:value={selectedStatus}
				class="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
			>
				<option value="">All Statuses</option>
				<option value="ACTIVE">Active</option>
				<option value="SUSPENDED">Suspended</option>
				<option value="INVITED">Invited</option>
			</select>

			<button
				type="submit"
				class="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
			>
				Filter
			</button>
		</form>
	</div>

	<!-- Member Directory Table -->
	<div class="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs">
				<thead>
					<tr
						class="border-b border-slate-800 bg-slate-950/60 font-semibold tracking-wider text-slate-400 uppercase"
					>
						<th class="px-4 py-3.5">Member</th>
						<th class="px-4 py-3.5">Role & Department</th>
						<th class="px-4 py-3.5">Points</th>
						<th class="px-4 py-3.5">Tasks</th>
						<th class="px-4 py-3.5">Database Sync</th>
						<th class="px-4 py-3.5">Status</th>
						<th class="px-4 py-3.5 text-right">Actions</th>
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
							<tr class="transition hover:bg-slate-800/40">
								<td class="px-4 py-3">
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20 font-bold text-indigo-300"
										>
											{member.fullName.slice(0, 2).toUpperCase()}
										</div>
										<div>
											<a
												href={`/members/${member.id}`}
												class="font-bold text-white transition hover:text-indigo-400"
											>
												{member.fullName}
											</a>
											<div class="text-[11px] text-slate-400">
												@{member.username} • {member.email}
											</div>
										</div>
									</div>
								</td>

								<td class="px-4 py-3">
									<div class="flex items-center gap-1.5">
										<span
											class={`rounded px-2 py-0.5 text-[10px] font-bold ${
												member.role === 'CEO'
													? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
													: member.role === 'HEAD'
														? 'border border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
														: 'border border-slate-700 bg-slate-800 text-slate-300'
											}`}
										>
											{member.role}
										</span>
									</div>
									<div class="mt-1 text-[11px] text-slate-400">
										{getDepartmentName(member.departmentId)}
									</div>
								</td>

								<td class="px-4 py-3">
									<span
										class="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 font-bold text-indigo-300"
									>
										<Award class="h-3.5 w-3.5" />
										<span>{member.points} pts</span>
									</span>
								</td>

								<td class="px-4 py-3">
									<div class="font-medium text-slate-200">
										{member.completedCount} completed
									</div>
									{#if member.overdueCount > 0}
										<div class="text-[11px] font-semibold text-rose-400">
											{member.overdueCount} overdue
										</div>
									{/if}
								</td>

								<td class="px-4 py-3">
									<span
										class={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
											member.integrationStatus === 'CONNECTED'
												? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
												: member.integrationStatus === 'CONFIGURED'
													? 'border border-blue-500/20 bg-blue-500/10 text-blue-400'
													: 'border border-slate-700 bg-slate-800 text-slate-400'
										}`}
									>
										<Database class="h-3 w-3" />
										<span>{member.integrationStatus}</span>
									</span>
								</td>

								<td class="px-4 py-3">
									<span
										class={`rounded px-2 py-0.5 text-[10px] font-bold ${
											member.accountStatus === 'ACTIVE'
												? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
												: 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
										}`}
									>
										{member.accountStatus}
									</span>
								</td>

								<td class="px-4 py-3 text-right">
									<div class="flex items-center justify-end gap-2">
										<a
											href={`/members/${member.id}`}
											class="rounded-lg bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-white"
											title="View Member Profile"
										>
											<ArrowUpRight class="h-4 w-4" />
										</a>

										{#if member.role !== 'CEO'}
											<button
												type="button"
												onclick={() => {
													selectedUserForRole = member;
													showRoleModal = true;
												}}
												class="rounded-lg bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-indigo-400"
												title="Promote or Change Role"
											>
												<Shield class="h-4 w-4" />
											</button>

											<form
												method="POST"
												action="?/resetPassword"
												class="inline"
												onsubmit={(e) => {
													if (
														!confirm(
															`Generate new temporary password and email credentials to ${member.email}?`
														)
													)
														e.preventDefault();
												}}
											>
												<input type="hidden" name="userId" value={member.id} />
												<button
													type="submit"
													class="rounded-lg bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-amber-400"
													title="Reset Password & Send Email"
												>
													<KeyRound class="h-4 w-4" />
												</button>
											</form>

											<form method="POST" action="?/updateStatus" class="inline">
												<input type="hidden" name="userId" value={member.id} />
												<input
													type="hidden"
													name="status"
													value={member.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}
												/>
												<button
													type="submit"
													class={`rounded-lg bg-slate-800 p-1.5 transition ${
														member.accountStatus === 'ACTIVE'
															? 'text-slate-300 hover:bg-slate-700 hover:text-rose-400'
															: 'text-slate-300 hover:bg-slate-700 hover:text-emerald-400'
													}`}
													title={member.accountStatus === 'ACTIVE'
														? 'Suspend Account'
														: 'Reactivate Account'}
												>
													{#if member.accountStatus === 'ACTIVE'}
														<UserX class="h-4 w-4" />
													{:else}
														<UserCheck class="h-4 w-4" />
													{/if}
												</button>
											</form>

											<button
												type="button"
												onclick={() => {
													selectedUserForDelete = member;
													showDeleteModal = true;
												}}
												class="rounded-lg bg-slate-800 p-1.5 text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-400"
												title="Remove Member Account"
											>
												<Trash2 class="h-4 w-4" />
											</button>
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
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-lg space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="text-base font-bold text-white">Create New Organization Member</h3>
				<button
					type="button"
					aria-label="Close Modal"
					onclick={() => (showAddModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			{#if form?.error}
				<div
					class="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300"
				>
					<AlertTriangle class="h-4 w-4 shrink-0 text-red-400" />
					<span>{form.error}</span>
				</div>
			{/if}

			<form method="POST" action="?/createMember" class="space-y-4">
				<div>
					<label
						for="fullName"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
						>Full Name</label
					>
					<input
						type="text"
						id="fullName"
						name="fullName"
						required
						placeholder="e.g. Su Mon"
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label
							for="username"
							class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
							>Username</label
						>
						<input
							type="text"
							id="username"
							name="username"
							required
							placeholder="sumon_dev"
							class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							for="email"
							class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
							>Email</label
						>
						<input
							type="email"
							id="email"
							name="email"
							required
							placeholder="sumon@youths.org"
							class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label
						for="deliveryEmail"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
					>
						Delivery Email <span class="text-slate-500 lowercase"
							>(optional personal email to deliver credentials)</span
						>
					</label>
					<input
						type="email"
						id="deliveryEmail"
						name="deliveryEmail"
						placeholder="e.g. personal@gmail.com (defaults to assigned email)"
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label
							for="departmentId"
							class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
							>Department</label
						>
						<select
							id="departmentId"
							name="departmentId"
							required
							class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
						>
							<option value="">Select Department</option>
							{#each data.departments as dept}
								<option value={dept.id}>{dept.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<label
							for="role"
							class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
							>Role</label
						>
						<select
							id="role"
							name="role"
							class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
						>
							<option value="MEMBER" selected>Member</option>
							<option value="HEAD">Department Head</option>
						</select>
					</div>
				</div>

				<div>
					<label
						for="customPassword"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
					>
						Custom Temporary Password <span class="text-slate-500 lowercase"
							>(leave blank to auto-generate)</span
						>
					</label>
					<input
						type="password"
						id="customPassword"
						name="customPassword"
						autocomplete="new-password"
						placeholder="Optional secure temporary password"
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
					/>
				</div>

				<div class="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
					<button
						type="button"
						onclick={() => (showAddModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
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
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-lg space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="flex items-center gap-2 text-base font-bold text-white">
					<Check class="h-5 w-5 text-emerald-400" />
					<span>Member Account Created</span>
				</h3>
				<button
					type="button"
					aria-label="Close Credentials Modal"
					onclick={() => (showCredentialsModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<p class="text-xs text-slate-400">
				Copy these temporary credentials and deliver them securely to the member. The sync token
				enables authenticated progress synchronization from their member database.
			</p>

			<div class="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
				<div>
					<span class="text-[10px] font-semibold text-slate-500 uppercase">Username</span>
					<div class="text-sm font-bold text-white">{form.createdMember.username}</div>
				</div>

				<div class="flex items-center justify-between">
					<div>
						<span class="text-[10px] font-semibold text-slate-500 uppercase"
							>Temporary Password</span
						>
						<div class="font-mono text-sm font-bold text-amber-400">
							{form.createdMember.tempPassword}
						</div>
					</div>
					<button
						type="button"
						onclick={() => copyToClipboard(form.createdMember.tempPassword, 'password')}
						class="flex items-center gap-1.5 rounded-lg bg-slate-800 p-2 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
					>
						{#if copiedPassword}
							<Check class="h-3.5 w-3.5 text-emerald-400" />
							<span class="text-emerald-400">Copied</span>
						{:else}
							<Copy class="h-3.5 w-3.5" />
							<span>Copy</span>
						{/if}
					</button>
				</div>

				<div class="flex items-center justify-between border-t border-slate-800 pt-2">
					<div class="min-w-0 pr-3">
						<span class="text-[10px] font-semibold text-slate-500 uppercase"
							>Integration Sync Bearer Token</span
						>
						<div class="truncate font-mono text-xs text-indigo-400">
							{form.createdMember.syncToken}
						</div>
					</div>
					<button
						type="button"
						onclick={() => copyToClipboard(form.createdMember.syncToken, 'token')}
						class="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-800 p-2 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
					>
						{#if copiedToken}
							<Check class="h-3.5 w-3.5 text-emerald-400" />
							<span class="text-emerald-400">Copied</span>
						{:else}
							<Copy class="h-3.5 w-3.5" />
							<span>Copy</span>
						{/if}
					</button>
				</div>
			</div>

			{#if form.createdMember.emailSent}
				<div
					class="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400"
				>
					<Mail class="h-4 w-4 shrink-0" />
					<span
						>Credentials email successfully dispatched to <strong
							>{form.createdMember.recipientEmail || form.createdMember.email}</strong
						> via Resend.</span
					>
				</div>
			{:else}
				<div
					class="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300"
				>
					<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
					<div>
						<div class="font-semibold text-amber-200">Email delivery notice:</div>
						<div class="mt-0.5 text-amber-300/90">
							{form.createdMember.emailError || 'Failed to dispatch email via Resend.'}
						</div>
						<div class="mt-1 text-[11px] text-slate-400">
							User was created, but please copy and share their temporary credentials manually.
						</div>
					</div>
				</div>
			{/if}

			<div class="flex justify-end">
				<button
					type="button"
					onclick={() => (showCredentialsModal = false)}
					class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Password Reset Modal -->
{#if showResetModal && form?.resetInfo}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="flex items-center gap-2 text-base font-bold text-white">
					<KeyRound class="h-5 w-5 text-amber-400" />
					<span>Temporary Password Generated</span>
				</h3>
				<button
					type="button"
					aria-label="Close Reset Modal"
					onclick={() => (showResetModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
				<div>
					<span class="text-[10px] font-semibold text-slate-500 uppercase">Username</span>
					<div class="text-sm font-bold text-white">{form.resetInfo.username}</div>
				</div>

				<div class="flex items-center justify-between">
					<div>
						<span class="text-[10px] font-semibold text-slate-500 uppercase"
							>New Temporary Password</span
						>
						<div class="font-mono text-sm font-bold text-amber-400">
							{form.resetInfo.newPassword}
						</div>
					</div>
					<button
						type="button"
						onclick={() => copyToClipboard(form.resetInfo.newPassword, 'password')}
						class="flex items-center gap-1.5 rounded-lg bg-slate-800 p-2 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
					>
						{#if copiedPassword}
							<Check class="h-3.5 w-3.5 text-emerald-400" />
							<span class="text-emerald-400">Copied</span>
						{:else}
							<Copy class="h-3.5 w-3.5" />
							<span>Copy</span>
						{/if}
					</button>
				</div>
			</div>

			{#if form.resetInfo.emailSent}
				<div
					class="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400"
				>
					<Mail class="h-4 w-4 shrink-0" />
					<span>Updated credentials email dispatched successfully via Resend.</span>
				</div>
			{:else}
				<div
					class="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300"
				>
					<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
					<div>
						<div class="font-semibold text-amber-200">Email delivery notice:</div>
						<div class="mt-0.5 text-amber-300/90">
							{form.resetInfo.emailError || 'Failed to dispatch email via Resend.'}
						</div>
						<div class="mt-1 text-[11px] text-slate-400">
							The password was reset, but please deliver the new temporary password manually.
						</div>
					</div>
				</div>
			{/if}

			<div class="flex justify-end">
				<button
					type="button"
					onclick={() => (showResetModal = false)}
					class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Change Role & Department Modal -->
{#if showRoleModal && selectedUserForRole}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-slate-800 pb-3">
				<h3 class="text-base font-bold text-white">Promote or Reassign Member</h3>
				<button
					type="button"
					aria-label="Close Role Modal"
					onclick={() => (showRoleModal = false)}
					class="text-slate-400 hover:text-white"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<form method="POST" action="?/updateRole" class="space-y-4">
				<input type="hidden" name="userId" value={selectedUserForRole.id} />

				<div class="text-xs text-slate-400">
					Member: <span class="font-bold text-white">{selectedUserForRole.fullName}</span>
					(@{selectedUserForRole.username})
				</div>

				<div>
					<label
						for="newRole"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
						>Role</label
					>
					<select
						id="newRole"
						name="newRole"
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
					>
						<option value="MEMBER" selected={selectedUserForRole.role === 'MEMBER'}
							>Department Member</option
						>
						<option value="HEAD" selected={selectedUserForRole.role === 'HEAD'}
							>Department Head</option
						>
					</select>
				</div>

				<div>
					<label
						for="modalDeptId"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
						>Department</label
					>
					<select
						id="modalDeptId"
						name="departmentId"
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
					>
						{#each data.departments as dept}
							<option value={dept.id} selected={selectedUserForRole.departmentId === dept.id}
								>{dept.name}</option
							>
						{/each}
					</select>
				</div>

				<div class="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
					<button
						type="button"
						onclick={() => (showRoleModal = false)}
						class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
					>
						Confirm Role Promotion
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Member Confirmation Modal -->
{#if showDeleteModal && selectedUserForDelete}
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
					<strong class="text-white">{selectedUserForDelete.fullName}</strong>
					(<span class="text-indigo-300">@{selectedUserForDelete.username}</span>)?
				</p>
				<div
					class="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-300/90"
				>
					<div class="mb-1 flex items-center gap-1.5 font-semibold text-rose-200">
						<AlertTriangle class="h-3.5 w-3.5 shrink-0" />
						Permanent Deletion
					</div>
					This will permanently remove the member's profile, active sessions, and integration token. Any tasks created by this member will be reassigned to you.
				</div>
			</div>

			<form
				method="POST"
				action="?/deleteMember"
				class="flex items-center justify-end gap-3 border-t border-slate-800 pt-3"
			>
				<input type="hidden" name="userId" value={selectedUserForDelete.id} />
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
