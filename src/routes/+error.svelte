<script lang="ts">
	import { page } from '$app/state';
	import { AlertTriangle, ArrowLeft, Home } from '@lucide/svelte';
</script>

<div class="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
	<div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center space-y-6 shadow-2xl">
		<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
			<AlertTriangle class="w-8 h-8" />
		</div>

		<div class="space-y-2">
			<h1 class="text-3xl font-extrabold text-white tracking-tight">
				{page.status}
			</h1>
			<h2 class="text-base font-semibold text-slate-300">
				{page.error?.message || 'Access Denied or Page Not Found'}
			</h2>
			<p class="text-xs text-slate-500 leading-relaxed">
				The requested resource is restricted, missing, or requires executive administrative clearance.
			</p>
		</div>

		<div class="pt-4 flex items-center justify-center gap-3">
			<a
				href="/"
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
			>
				<Home class="w-4 h-4" />
				<span>Return to Overview</span>
			</a>
		</div>
	</div>
</div>
