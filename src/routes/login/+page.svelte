<script lang="ts">
	import { Shield, Lock, AlertCircle, ArrowRight } from '@lucide/svelte';

	let { form, data } = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-6 bg-slate-950">
	<div class="w-full max-w-md space-y-8 rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
		<div class="text-center space-y-2">
			<div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-600/30 text-white font-black text-2xl mb-2">
				Y
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-white">YOUTHs CEO Command Center</h1>
			<p class="text-sm text-slate-400">Executive Authentication & Organizational Control</p>
		</div>

		{#if form?.error}
			<div class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2.5">
				<AlertCircle class="w-5 h-5 shrink-0 text-red-400" />
				<span>{form.error}</span>
			</div>
		{/if}

		<form method="POST" class="space-y-4">
			<div>
				<label for="identifier" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
					Username or Executive Email
				</label>
				<input
					type="text"
					id="identifier"
					name="identifier"
					required
					autocomplete="username"
					placeholder="ceo@youths-org.com or username"
					class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
				/>
			</div>

			<div>
				<label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
					Master Password
				</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					autocomplete="current-password"
					placeholder="••••••••••••"
					class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
				/>
			</div>

			<button
				type="submit"
				class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition duration-150 flex items-center justify-center gap-2 mt-2"
			>
				<Lock class="w-4 h-4" />
				<span>Authenticate to Command Center</span>
				<ArrowRight class="w-4 h-4 ml-1" />
			</button>
		</form>

		<div class="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
			Protected organizational management zone. All authentication and administrative actions are logged in the immutable audit registry.
		</div>
	</div>
</div>
