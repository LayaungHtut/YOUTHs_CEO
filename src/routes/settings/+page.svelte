<script lang="ts">
	import {
		Settings,
		Building2,
		Sparkles,
		Award,
		ShieldCheck,
		Check,
		AlertCircle,
		Send,
		Play,
		Save
	} from '@lucide/svelte';

	let { data, form } = $props();

	let testAiStatus = $state<{ loading: boolean; result?: any; error?: string }>({ loading: false });

	async function runAiHealthCheck() {
		testAiStatus = { loading: true };
		try {
			const res = await fetch('/api/ai/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: data.settings.aiModel
				})
			});
			const resData = await res.json();
			if (resData.success) {
				testAiStatus = { loading: false, result: resData };
			} else {
				testAiStatus = { loading: false, error: resData.error || 'Connection test failed' };
			}
		} catch (err: any) {
			testAiStatus = { loading: false, error: err.message || 'Network error' };
		}
	}
</script>

<div class="space-y-8 max-w-4xl">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
			Executive Organization Settings
			<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
				Asia/Yangon
			</span>
		</h1>
		<p class="text-sm text-slate-400 mt-1">
			Configure organizational profile, AI model routing, transparent points policies, and session protections.
		</p>
	</div>

	{#if form?.message}
		<div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
			<Check class="w-4 h-4 text-emerald-400" />
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Section 1: Organization Profile -->
	<div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-5">
		<div class="flex items-center gap-3 pb-3 border-b border-slate-800">
			<div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
				<Building2 class="w-5 h-5" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-white">Organization Identity & Timezone</h3>
				<p class="text-xs text-slate-400">Global organizational name and official scheduling timezone.</p>
			</div>
		</div>

		<form method="POST" action="?/saveOrgSettings" class="space-y-4">
			<div>
				<label for="orgName" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Organization Legal Name</label>
				<input
					type="text"
					id="orgName"
					name="orgName"
					value={data.settings.orgName}
					required
					class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
				/>
			</div>

			<div>
				<label for="orgTimezone" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Operational Timezone</label>
				<input
					type="text"
					id="orgTimezone"
					name="orgTimezone"
					value={data.settings.orgTimezone}
					required
					class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
				/>
				<div class="text-[11px] text-slate-500 mt-1">Default: Asia/Yangon (UTC+06:30)</div>
			</div>

			<div>
				<label for="orgDescription" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Mission & Description</label>
				<textarea
					id="orgDescription"
					name="orgDescription"
					rows="3"
					class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
				>{data.settings.orgDescription}</textarea>
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="submit"
					class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
				>
					<Save class="w-3.5 h-3.5" />
					<span>Save Identity</span>
				</button>
			</div>
		</form>
	</div>

	<!-- Section 2: AI Provider & Model Routing -->
	<div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-5">
		<div class="flex items-center justify-between pb-3 border-b border-slate-800">
			<div class="flex items-center gap-3">
				<div class="p-2 rounded-xl bg-purple-500/10 text-purple-400">
					<Sparkles class="w-5 h-5" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-white">AI Weekly Task Engine (OpenRouter / UnoRouter)</h3>
					<p class="text-xs text-slate-400">Configure provider keys and LLM routing parameters.</p>
				</div>
			</div>

			<button
				type="button"
				onclick={runAiHealthCheck}
				disabled={testAiStatus.loading}
				class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold border border-purple-500/30 flex items-center gap-1.5 transition"
			>
				<Play class="w-3.5 h-3.5 text-purple-400" />
				<span>{testAiStatus.loading ? 'Testing...' : 'Test Connection'}</span>
			</button>
		</div>

		{#if testAiStatus.result}
			<div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
				<div class="font-bold flex items-center gap-1.5">
					<Check class="w-4 h-4 text-emerald-400" />
					<span>OpenRouter Connection Healthy</span>
				</div>
				<div>Latency: {testAiStatus.result.latencyMs}ms • Model: {testAiStatus.result.model}</div>
			</div>
		{:else if testAiStatus.error}
			<div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
				<div class="font-bold flex items-center gap-1.5">
					<AlertCircle class="w-4 h-4 text-amber-400" />
					<span>AI Service Notice</span>
				</div>
				<div>{testAiStatus.error}. Deterministic fallback will safely execute if API key is not configured.</div>
			</div>
		{/if}

		<form method="POST" action="?/saveAISettings" class="space-y-4">
			<div>
				<label for="openRouterKey" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">OpenRouter API Key</label>
				<input
					type="password"
					id="openRouterKey"
					name="openRouterKey"
					value={data.settings.openRouterKey}
					placeholder="sk-or-v1-••••••••••••••••"
					class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
				/>
				<div class="text-[11px] text-slate-500 mt-1">Stored securely on server only; never exposed to browser clients.</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="aiModel" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Primary Model</label>
					<select
						id="aiModel"
						name="aiModel"
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
					>
						<option value="anthropic/claude-3.5-sonnet" selected={data.settings.aiModel === 'anthropic/claude-3.5-sonnet'}>Claude 3.5 Sonnet</option>
						<option value="google/gemini-2.5-flash" selected={data.settings.aiModel === 'google/gemini-2.5-flash'}>Gemini 2.5 Flash</option>
						<option value="deepseek/deepseek-chat" selected={data.settings.aiModel === 'deepseek/deepseek-chat'}>DeepSeek Chat V3</option>
						<option value="meta-llama/llama-3.3-70b-instruct" selected={data.settings.aiModel === 'meta-llama/llama-3.3-70b-instruct'}>Llama 3.3 70B</option>
					</select>
				</div>

				<div>
					<label for="aiTemperature" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Temperature</label>
					<input
						type="number"
						id="aiTemperature"
						name="aiTemperature"
						step="0.05"
						min="0"
						max="1"
						value={data.settings.aiTemperature}
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
					/>
				</div>
			</div>

			<div class="flex items-center gap-3 pt-2">
				<input
					type="checkbox"
					id="autoPublish"
					name="autoPublish"
					value="true"
					checked={data.settings.autoPublish}
					class="w-4 h-4 rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-purple-500"
				/>
				<label for="autoPublish" class="text-xs text-slate-300">
					Enable Automatic Publishing without manual CEO approval (Default: Disabled)
				</label>
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="submit"
					class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
				>
					<Save class="w-3.5 h-3.5" />
					<span>Save AI Settings</span>
				</button>
			</div>
		</form>
	</div>

	<!-- Section 3: Points & Performance Policy -->
	<div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-5">
		<div class="flex items-center gap-3 pb-3 border-b border-slate-800">
			<div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
				<Award class="w-5 h-5" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-white">Points & Deductions Policy</h3>
				<p class="text-xs text-slate-400">Rules governing the append-only organizational points ledger.</p>
			</div>
		</div>

		<form method="POST" action="?/savePointsSettings" class="space-y-4">
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
				<div>
					<label for="startingBalance" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Starting Balance</label>
					<input
						type="number"
						id="startingBalance"
						name="startingBalance"
						value={data.settings.startingBalance}
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
					/>
				</div>

				<div>
					<label for="completionReward" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">On-Time Reward</label>
					<input
						type="number"
						id="completionReward"
						name="completionReward"
						value={data.settings.completionReward}
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
					/>
				</div>

				<div>
					<label for="overduePenalty" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Overdue Penalty</label>
					<input
						type="number"
						id="overduePenalty"
						name="overduePenalty"
						value={data.settings.overduePenalty}
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
					/>
				</div>

				<div>
					<label for="maxWeeklyDeduction" class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Max Weekly Deduct</label>
					<input
						type="number"
						id="maxWeeklyDeduction"
						name="maxWeeklyDeduction"
						value={data.settings.maxWeeklyDeduction}
						class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
					/>
				</div>
			</div>

			<div class="flex items-center gap-3 pt-2">
				<input
					type="checkbox"
					id="allowNegative"
					name="allowNegative"
					value="true"
					checked={data.settings.allowNegative}
					class="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-emerald-500"
				/>
				<label for="allowNegative" class="text-xs text-slate-300">
					Allow points balance to go below zero (floor at 0 if unchecked)
				</label>
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="submit"
					class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
				>
					<Save class="w-3.5 h-3.5" />
					<span>Save Points Policy</span>
				</button>
			</div>
		</form>
	</div>
</div>
