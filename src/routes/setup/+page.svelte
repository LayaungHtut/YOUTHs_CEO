<script lang="ts">
	import { Shield, Sparkles, CheckCircle2, AlertCircle } from '@lucide/svelte';

	let { form } = $props();

	let password = $state('');
	let confirmPassword = $state('');

	const hasMinLength = $derived(password.length >= 8);
	const hasUppercase = $derived(/[A-Z]/.test(password));
	const hasLowercase = $derived(/[a-z]/.test(password));
	const hasNumber = $derived(/[0-9]/.test(password));
	const passwordsMatch = $derived(password.length > 0 && password === confirmPassword);
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-950 p-6">
	<div
		class="w-full max-w-lg space-y-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
	>
		<div class="space-y-2 text-center">
			<img
				src="/logo.png"
				alt="YOUTHs Logo"
				class="mx-auto h-16 w-16 object-contain rounded-2xl drop-shadow-xl mb-2"
			/>
			<h1 class="text-2xl font-bold tracking-tight text-white">YOUTHs CEO Command Center</h1>
			<p class="text-sm text-slate-400">
				First-Run Master Initialization. Create the organization's primary executive account.
			</p>
		</div>

		{#if form?.error}
			<div
				class="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300"
			>
				<AlertCircle class="h-5 w-5 shrink-0 text-red-400" />
				<span>{form.error}</span>
			</div>
		{/if}

		<form method="POST" class="space-y-4">
			<div>
				<label
					for="fullName"
					class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
					>Executive Full Name</label
				>
				<input
					type="text"
					id="fullName"
					name="fullName"
					required
					placeholder="e.g. Min Thura"
					class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
						placeholder="e.g. youths_ceo"
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
					/>
				</div>
				<div>
					<label
						for="email"
						class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
						>Executive Email</label
					>
					<input
						type="email"
						id="email"
						name="email"
						required
						placeholder="ceo@youths-org.com"
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
					/>
				</div>
			</div>

			<div>
				<label
					for="password"
					class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
					>Master Password</label
				>
				<input
					type="password"
					id="password"
					name="password"
					bind:value={password}
					required
					placeholder="••••••••••••"
					class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			</div>

			<div>
				<label
					for="confirmPassword"
					class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase"
					>Confirm Master Password</label
				>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					bind:value={confirmPassword}
					required
					placeholder="••••••••••••"
					class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			</div>

			<!-- Password validation indicators -->
			<div
				class="space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 text-xs text-slate-400"
			>
				<div class="mb-1 font-medium text-slate-300">Argon2id Security Requirements:</div>
				<div class="flex items-center gap-2">
					<CheckCircle2
						class={`h-3.5 w-3.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-600'}`}
					/>
					<span class={hasMinLength ? 'text-slate-200' : ''}>At least 8 characters</span>
				</div>
				<div class="flex items-center gap-2">
					<CheckCircle2
						class={`h-3.5 w-3.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-600'}`}
					/>
					<span class={hasUppercase ? 'text-slate-200' : ''}
						>At least one uppercase letter (A-Z)</span
					>
				</div>
				<div class="flex items-center gap-2">
					<CheckCircle2
						class={`h-3.5 w-3.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-600'}`}
					/>
					<span class={hasNumber ? 'text-slate-200' : ''}>At least one number (0-9)</span>
				</div>
				<div class="flex items-center gap-2">
					<CheckCircle2
						class={`h-3.5 w-3.5 ${passwordsMatch ? 'text-emerald-400' : 'text-slate-600'}`}
					/>
					<span class={passwordsMatch ? 'text-slate-200' : ''}>Passwords match exactly</span>
				</div>
			</div>

			<div>
				<label
					for="setupSecret"
					class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
				>
					Setup Authorization Key <span class="font-normal text-slate-500 lowercase"
						>(optional if not configured in .env)</span
					>
				</label>
				<input
					type="password"
					id="setupSecret"
					name="setupSecret"
					placeholder="Leave blank unless CEO_SETUP_SECRET is enforced"
					class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition duration-150 hover:from-indigo-500 hover:to-violet-500"
			>
				<Shield class="h-4 w-4" />
				<span>Initialize CEO Command Center</span>
			</button>
		</form>
	</div>
</div>
