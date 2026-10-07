<script lang="ts">
	import { ArrowRight, Check, AlertCircle, LogOut } from '@lucide/svelte';

	let { data, form } = $props();

	let newPassword = $state('');
	let confirmPassword = $state('');

	const hasMinLength = $derived(newPassword.length >= 8);
	const hasUppercase = $derived(/[A-Z]/.test(newPassword));
	const hasLowercase = $derived(/[a-z]/.test(newPassword));
	const hasNumber = $derived(/[0-9]/.test(newPassword));
	const passwordsMatch = $derived(newPassword.length > 0 && newPassword === confirmPassword);
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-950 p-6">
	<div
		class="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
	>
		<div class="space-y-2 text-center">
			<img
				src="/logo.png"
				alt="YOUTHs Logo"
				class="mx-auto mb-2 h-16 w-16 rounded-2xl object-contain drop-shadow-xl"
			/>
			<h1 class="text-2xl font-bold tracking-tight text-white">Change Temporary Password</h1>
			<p class="text-xs text-slate-400">
				Your account was created with a temporary password. Please set a secure permanent password
				to continue.
			</p>
		</div>

		<!-- User info badge -->
		<div
			class="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300"
		>
			<div>
				<div class="text-[10px] font-semibold text-slate-500 uppercase">Account</div>
				<div class="font-medium text-white">
					{data.username} <span class="text-slate-400">({data.email})</span>
				</div>
			</div>
			<div
				class="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400"
			>
				First Login
			</div>
		</div>

		{#if form?.error}
			<div
				class="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300"
			>
				<AlertCircle class="h-4 w-4 shrink-0 text-red-400" />
				<span>{form.error}</span>
			</div>
		{/if}

		<form method="POST" class="space-y-4">
			<div>
				<label
					for="currentPassword"
					class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
				>
					Current Temporary Password
				</label>
				<input
					type="password"
					id="currentPassword"
					name="currentPassword"
					required
					autocomplete="current-password"
					placeholder="Enter the password from your email"
					class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-600 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			</div>

			<div>
				<label
					for="newPassword"
					class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
				>
					New Password
				</label>
				<input
					type="password"
					id="newPassword"
					name="newPassword"
					required
					autocomplete="new-password"
					bind:value={newPassword}
					placeholder="At least 8 characters"
					class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-600 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			</div>

			<div>
				<label
					for="confirmPassword"
					class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
				>
					Confirm New Password
				</label>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					required
					autocomplete="new-password"
					bind:value={confirmPassword}
					placeholder="Re-enter your new password"
					class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-600 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			</div>

			<!-- Password requirement checklist -->
			<div class="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px]">
				<div
					class="flex items-center gap-1.5 {hasMinLength ? 'text-emerald-400' : 'text-slate-500'}"
				>
					<Check class="h-3.5 w-3.5 {hasMinLength ? 'opacity-100' : 'opacity-30'}" />
					<span>At least 8 characters</span>
				</div>
				<div
					class="flex items-center gap-1.5 {hasUppercase ? 'text-emerald-400' : 'text-slate-500'}"
				>
					<Check class="h-3.5 w-3.5 {hasUppercase ? 'opacity-100' : 'opacity-30'}" />
					<span>At least 1 uppercase letter</span>
				</div>
				<div
					class="flex items-center gap-1.5 {hasLowercase ? 'text-emerald-400' : 'text-slate-500'}"
				>
					<Check class="h-3.5 w-3.5 {hasLowercase ? 'opacity-100' : 'opacity-30'}" />
					<span>At least 1 lowercase letter</span>
				</div>
				<div class="flex items-center gap-1.5 {hasNumber ? 'text-emerald-400' : 'text-slate-500'}">
					<Check class="h-3.5 w-3.5 {hasNumber ? 'opacity-100' : 'opacity-30'}" />
					<span>At least 1 number</span>
				</div>
				<div
					class="flex items-center gap-1.5 {passwordsMatch ? 'text-emerald-400' : 'text-slate-500'}"
				>
					<Check class="h-3.5 w-3.5 {passwordsMatch ? 'opacity-100' : 'opacity-30'}" />
					<span>Passwords match</span>
				</div>
			</div>

			<button
				type="submit"
				class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none"
			>
				<span>Set Password & Proceed</span>
				<ArrowRight class="h-4 w-4" />
			</button>
		</form>

		<div class="flex justify-center border-t border-slate-800 pt-4">
			<form action="/logout" method="POST">
				<button
					type="submit"
					class="flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300"
				>
					<LogOut class="h-3.5 w-3.5" />
					<span>Sign out</span>
				</button>
			</form>
		</div>
	</div>
</div>
