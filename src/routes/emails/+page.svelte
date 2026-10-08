<script lang="ts">
	import {
		Mail,
		Palette,
		Send,
		Radio,
		Smartphone,
		Monitor,
		Check,
		AlertTriangle,
		RotateCcw,
		Sparkles,
		ShieldCheck,
		Users,
		Building2,
		ExternalLink,
		Eye,
		Save,
		RefreshCw
	} from '@lucide/svelte';

	let { data, form } = $props();

	let activeTab = $state<'designer' | 'test' | 'broadcast'>('designer');
	let previewDevice = $state<'desktop' | 'mobile'>('desktop');

	// Local reactive state for template editor to provide instant live preview
	let subjectTemplate = $state('Your {orgName} account has been created');
	let headerTitle = $state('Your {orgName} account has been created');
	let greetingText = $state('Hello,');
	let bodyText = $state('Your account has been created.');
	let instructionsText = $state(
		'Please log in using these credentials and change your temporary password after logging in.'
	);
	let buttonText = $state('Log in to {orgName}');
	let portalUrl = $state('https://youths-member.vercel.app/');
	let footerNote = $state(
		'This is an automated administrative notification. Please keep your temporary credentials secure.'
	);
	let accentColor = $state('#6366f1');
	let logoUrl = $state('');
	let showLogo = $state(false);

	// Test email state
	let testRecipient = $state('');

	$effect(() => {
		if (data.template) {
			subjectTemplate = data.template.subjectTemplate || 'Your {orgName} account has been created';
			headerTitle = data.template.headerTitle || 'Your {orgName} account has been created';
			greetingText = data.template.greetingText || 'Hello,';
			bodyText = data.template.bodyText || 'Your account has been created.';
			instructionsText =
				data.template.instructionsText ||
				'Please log in using these credentials and change your temporary password after logging in.';
			buttonText = data.template.buttonText || 'Log in to {orgName}';
			portalUrl = data.template.portalUrl || 'https://youths-member.vercel.app/';
			footerNote =
				data.template.footerNote ||
				'This is an automated administrative notification. Please keep your temporary credentials secure.';
			accentColor = data.template.accentColor || '#6366f1';
			logoUrl = data.template.logoUrl || '';
			showLogo = data.template.showLogo ?? false;
		}
		if (data.ceoEmail) {
			testRecipient = data.ceoEmail;
		}
	});

	// Broadcast email state
	let broadcastTarget = $state<'all' | 'department' | 'member'>('all');
	let selectedDeptId = $state('');
	let selectedMemberId = $state('');
	let broadcastSubject = $state('');
	let broadcastTitle = $state('');
	let broadcastMessage = $state('');
	let broadcastActionUrl = $state('');
	let broadcastActionText = $state('');

	// Color presets for quick selection
	const colorPresets = [
		{ name: 'Indigo', value: '#6366f1' },
		{ name: 'Violet', value: '#8b5cf6' },
		{ name: 'Emerald', value: '#10b981' },
		{ name: 'Sky', value: '#0ea5e9' },
		{ name: 'Amber', value: '#f59e0b' },
		{ name: 'Rose', value: '#f43f5e' }
	];

	// Derived live preview texts
	let renderedSubject = $derived(
		subjectTemplate.replace(/\{orgName\}/g, data.orgName).replace(/\{username\}/g, 'alex_leader')
	);
	let renderedHeader = $derived(
		headerTitle.replace(/\{orgName\}/g, data.orgName).replace(/\{username\}/g, 'alex_leader')
	);
	let renderedButton = $derived(
		buttonText.replace(/\{orgName\}/g, data.orgName)
	);

	function resetLocalForm() {
		subjectTemplate = 'Your {orgName} account has been created';
		headerTitle = 'Your {orgName} account has been created';
		greetingText = 'Hello,';
		bodyText = 'Your account has been created.';
		instructionsText = 'Please log in using these credentials and change your temporary password after logging in.';
		buttonText = 'Log in to {orgName}';
		portalUrl = 'https://youths-member.vercel.app/';
		footerNote = 'This is an automated administrative notification. Please keep your temporary credentials secure.';
		accentColor = '#6366f1';
		logoUrl = '';
		showLogo = false;
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
		<div>
			<h1 class="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white">
				<Mail class="h-6 w-6 text-indigo-400" />
				Email Communications Suite
				<span
					class={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
						data.providerStatus.configured
							? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
							: 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
					}`}
				>
					{data.providerStatus.configured
						? data.providerStatus.provider === 'GMAIL_SMTP'
							? 'Gmail SMTP Active'
							: 'Resend Active'
						: 'No Provider'}
				</span>
			</h1>
			<p class="mt-1 text-sm text-slate-400">
				Customize the email branding and design, verify live SMTP delivery, and broadcast announcements to members.
			</p>
		</div>

		<!-- Tab Navigation Pills -->
		<div class="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
			<button
				type="button"
				onclick={() => (activeTab = 'designer')}
				class={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
					activeTab === 'designer'
						? 'bg-indigo-600 text-white shadow'
						: 'text-slate-400 hover:text-slate-200'
				}`}
			>
				<Palette class="h-3.5 w-3.5" />
				<span>Template Designer</span>
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'test')}
				class={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
					activeTab === 'test'
						? 'bg-indigo-600 text-white shadow'
						: 'text-slate-400 hover:text-slate-200'
				}`}
			>
				<Radio class="h-3.5 w-3.5" />
				<span>Test & Diagnostics</span>
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'broadcast')}
				class={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
					activeTab === 'broadcast'
						? 'bg-indigo-600 text-white shadow'
						: 'text-slate-400 hover:text-slate-200'
				}`}
			>
				<Send class="h-3.5 w-3.5" />
				<span>Member Composer</span>
			</button>
		</div>
	</div>

	<!-- Alert Messages -->
	{#if form?.message}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300"
		>
			<Check class="h-4 w-4 shrink-0 text-emerald-400" />
			<span>{form.message}</span>
		</div>
	{/if}
	{#if form?.error}
		<div
			class="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300"
		>
			<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
			<div>
				<div class="font-semibold text-rose-200">Email Delivery Notice:</div>
				<div class="mt-0.5">{form.error}</div>
			</div>
		</div>
	{/if}

	<!-- TAB 1: TEMPLATE DESIGNER & REAL-TIME PREVIEW -->
	{#if activeTab === 'designer'}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
			<!-- Left Column: Controls Form -->
			<div class="space-y-6 lg:col-span-6">
				<div class="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5 space-y-4">
					<div class="flex items-center justify-between border-b border-slate-800 pb-3">
						<div class="flex items-center gap-2">
							<Palette class="h-4 w-4 text-indigo-400" />
							<h3 class="text-sm font-bold text-white">Email Branding & Typography</h3>
						</div>
						<div class="text-[11px] text-slate-400">All member credentials use this design</div>
					</div>

					<form method="POST" action="?/saveTemplate" class="space-y-4">
						<!-- Brand Accent Color -->
						<div>
							<label for="accentColorPicker" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
								Brand Accent Color
							</label>
							<div class="flex items-center gap-3">
								<input
									type="color"
									id="accentColorPicker"
									bind:value={accentColor}
									name="accentColor"
									class="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-1"
								/>
								<div class="flex flex-wrap items-center gap-1.5">
									{#each colorPresets as preset}
										<button
											type="button"
											onclick={() => (accentColor = preset.value)}
											class={`h-7 rounded-lg px-2.5 text-xs font-semibold transition ${
												accentColor.toLowerCase() === preset.value.toLowerCase()
													? 'border-2 border-white text-white shadow'
													: 'border border-slate-700 text-slate-300 hover:border-slate-500'
											}`}
											style={`background-color: ${preset.value};`}
										>
											{preset.name}
										</button>
									{/each}
								</div>
							</div>
						</div>

						<!-- Subject Line Template -->
						<div>
							<div class="flex items-center justify-between mb-1.5">
								<label for="subjectTemplate" class="text-xs font-semibold tracking-wider text-slate-300 uppercase">
									Subject Line
								</label>
								<span class="text-[10px] text-slate-400">Tags: <code class="text-indigo-400 font-mono">{"{orgName}"}</code>, <code class="text-indigo-400 font-mono">{"{username}"}</code></span>
							</div>
							<input
								type="text"
								id="subjectTemplate"
								name="subjectTemplate"
								bind:value={subjectTemplate}
								class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
							/>
						</div>

						<!-- Header Title -->
						<div>
							<label for="headerTitle" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
								Header Heading
							</label>
							<input
								type="text"
								id="headerTitle"
								name="headerTitle"
								bind:value={headerTitle}
								class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
							/>
						</div>

						<!-- Greeting & Body Text -->
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div>
								<label for="greetingText" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
									Salutation
								</label>
								<input
									type="text"
									id="greetingText"
									name="greetingText"
									bind:value={greetingText}
									class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
								/>
							</div>
							<div>
								<label for="bodyText" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
									Introductory Line
								</label>
								<input
									type="text"
									id="bodyText"
									name="bodyText"
									bind:value={bodyText}
									class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
								/>
							</div>
						</div>

						<!-- Instructions Text -->
						<div>
							<label for="instructionsText" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
								Login Instructions Text
							</label>
							<textarea
								id="instructionsText"
								name="instructionsText"
								rows="2"
								bind:value={instructionsText}
								class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
							></textarea>
						</div>

						<!-- Button Text -->
						<div>
							<label for="buttonText" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
								Action Button Label
							</label>
							<input
								type="text"
								id="buttonText"
								name="buttonText"
								bind:value={buttonText}
								class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
							/>
						</div>

						<!-- Web App / Portal URL (Anti-Spam deliverability) -->
						<div>
							<div class="flex items-center justify-between mb-1.5">
								<label for="portalUrl" class="text-xs font-semibold tracking-wider text-slate-300 uppercase">
									Portal / Web App Login URL
								</label>
								<span class="text-[10px] text-emerald-400 font-semibold">Anti-Spam Booster</span>
							</div>
							<input
								type="url"
								id="portalUrl"
								name="portalUrl"
								placeholder="https://youths-member.vercel.app/"
								bind:value={portalUrl}
								class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
							/>
							<p class="mt-1 text-[11px] text-slate-400">
								Setting the member portal domain (<span class="font-mono text-indigo-400">https://youths-member.vercel.app/</span>) directs new members straight to their login page and ensures email clients recognize legitimate login links.
							</p>
						</div>

						<!-- Logo Settings -->
						<div class="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 space-y-2">
							<div class="flex items-center justify-between">
								<label for="showLogoToggle" class="text-xs font-semibold text-slate-300">
									Include Brand Logo at Top
								</label>
								<input
									type="checkbox"
									id="showLogoToggle"
									name="showLogo"
									value="true"
									bind:checked={showLogo}
									class="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
								/>
							</div>
							{#if showLogo}
								<input
									type="url"
									name="logoUrl"
									placeholder="https://example.com/logo.png"
									bind:value={logoUrl}
									class="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
								/>
							{/if}
						</div>

						<!-- Footer Security Note -->
						<div>
							<label for="footerNote" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
								Footer Security & Disclaimer Note
							</label>
							<input
								type="text"
								id="footerNote"
								name="footerNote"
								bind:value={footerNote}
								class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
							/>
						</div>

						<div class="flex items-center justify-between pt-3 border-t border-slate-800">
							<button
								type="button"
								onclick={resetLocalForm}
								class="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
							>
								<RotateCcw class="h-3.5 w-3.5" />
								<span>Reset Inputs</span>
							</button>

							<div class="flex items-center gap-2">
								<button
									type="submit"
									class="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
								>
									<Save class="h-3.5 w-3.5" />
									<span>Save Template Design</span>
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>

			<!-- Right Column: Interactive Live Preview -->
			<div class="space-y-4 lg:col-span-6">
				<div class="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5 space-y-4">
					<div class="flex items-center justify-between border-b border-slate-800 pb-3">
						<div class="flex items-center gap-2">
							<Eye class="h-4 w-4 text-emerald-400" />
							<h3 class="text-sm font-bold text-white">Live Email Preview</h3>
						</div>
						<div class="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
							<button
								type="button"
								onclick={() => (previewDevice = 'desktop')}
								class={`rounded px-2 py-1 text-[11px] font-semibold transition ${
									previewDevice === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
								}`}
								title="Desktop View"
							>
								<Monitor class="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								onclick={() => (previewDevice = 'mobile')}
								class={`rounded px-2 py-1 text-[11px] font-semibold transition ${
									previewDevice === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
								}`}
								title="Mobile View"
							>
								<Smartphone class="h-3.5 w-3.5" />
							</button>
						</div>
					</div>

					<div class="text-[11px] text-slate-400">
						Subject: <strong class="text-slate-200">{renderedSubject}</strong>
					</div>

					<!-- Visual Email Card Container -->
					<div class="flex justify-center bg-slate-950 p-4 rounded-xl border border-slate-800/60 overflow-hidden">
						<div
							class={`transition-all duration-200 w-full ${
								previewDevice === 'mobile' ? 'max-w-[340px]' : 'max-w-[500px]'
							}`}
						>
							<div class="rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-xl overflow-hidden">
								<!-- Accent Top Line -->
								<div class="h-1.5 w-full" style={`background-color: ${accentColor};`}></div>

								<div class="p-6 space-y-4">
									{#if showLogo && logoUrl}
										<div class="flex justify-center pb-2">
											<img src={logoUrl} alt="Logo" class="max-h-10 rounded object-contain" />
										</div>
									{/if}

									<h2 class="text-lg font-bold text-slate-900 leading-tight">
										{renderedHeader}
									</h2>

									<div class="text-xs text-slate-600 space-y-2 leading-relaxed">
										<p>{greetingText}</p>
										<p>{bodyText}</p>
									</div>

									<!-- Credentials Box -->
									<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
										<div>
											<div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Username</div>
											<div class="text-sm font-semibold text-slate-900">alex_leader</div>
										</div>
										<div>
											<div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</div>
											<div class="text-sm font-semibold text-slate-900">alex@gmail.com</div>
										</div>
										<div>
											<div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Temporary Password</div>
											<div class="mt-1">
												<code class="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-sm font-bold text-slate-900 tracking-wider">
													Alex#2026Secure
												</code>
											</div>
										</div>
										<div class="border-t border-slate-200 pt-2.5">
											<div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Login Page</div>
											<div class="text-xs font-semibold text-blue-600 underline truncate">
												{portalUrl || 'https://youths-member.vercel.app/'}
											</div>
										</div>
									</div>

									<p class="text-xs text-slate-600 leading-relaxed">
										{instructionsText}
									</p>

									<div>
										<a
											href={portalUrl || 'https://youths-member.vercel.app/'}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-block rounded-lg px-4 py-2 text-xs font-semibold text-white shadow"
											style={`background-color: ${accentColor};`}
										>
											{renderedButton}
										</a>
									</div>

									<div class="border-t border-slate-200 pt-4 text-xs text-slate-500">
										<p>Regards,</p>
										<p class="font-bold text-slate-900">{data.orgName}</p>
									</div>
								</div>

								<!-- Footer Disclaimer -->
								<div class="border-t border-slate-200 bg-slate-50 px-6 py-3 text-center text-[10px] text-slate-500">
									{footerNote}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 2: CONNECTION DIAGNOSTICS & TEST EMAIL -->
	{#if activeTab === 'test'}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-12 max-w-4xl">
			<!-- Provider Status Card -->
			<div class="lg:col-span-6 space-y-4">
				<div class="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 space-y-4">
					<div class="flex items-center gap-3 border-b border-slate-800 pb-3">
						<div class="rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
							<Radio class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-white">Active Dispatcher Status</h3>
							<p class="text-xs text-slate-400">Current email delivery configuration</p>
						</div>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
							<div>
								<div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Configured Service</div>
								<div class="text-sm font-bold text-white mt-0.5">
									{#if data.providerStatus.provider === 'GMAIL_SMTP'}
										Gmail SMTP (Nodemailer)
									{:else if data.providerStatus.provider === 'RESEND'}
										Resend SDK
									{:else}
										Not Configured
									{/if}
								</div>
							</div>
							<span
								class={`rounded-full px-2.5 py-1 text-xs font-semibold ${
									data.providerStatus.configured
										? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
										: 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
								}`}
							>
								{data.providerStatus.configured ? 'Ready' : 'Inactive'}
							</span>
						</div>

						<div class="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-xs">
							<div class="flex items-center justify-between">
								<span class="text-slate-400">Sender Address:</span>
								<span class="font-mono text-slate-200 font-semibold">{data.providerStatus.fromAddress}</span>
							</div>
							{#if data.providerStatus.userAddress}
								<div class="flex items-center justify-between">
									<span class="text-slate-400">Authenticated Account:</span>
									<span class="font-mono text-indigo-300 font-semibold">{data.providerStatus.userAddress}</span>
								</div>
							{/if}
							<div class="flex items-center justify-between">
								<span class="text-slate-400">SMTP Port Mode:</span>
								<span class="text-slate-300">587 (STARTTLS) with 465 fallback</span>
							</div>
						</div>
					</div>

					<div class="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-300 leading-relaxed">
						<div class="font-semibold text-indigo-200 mb-1 flex items-center gap-1.5">
							<ShieldCheck class="h-4 w-4" />
							Personal Gmail SMTP
						</div>
						Sending directly through Google's mail server avoids third-party domain restrictions, allowing you to deliver credentials to any Gmail recipient.
					</div>
				</div>
			</div>

			<!-- Test Email Dispatch Card -->
			<div class="lg:col-span-6 space-y-4">
				<div class="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 space-y-4">
					<div class="flex items-center gap-3 border-b border-slate-800 pb-3">
						<div class="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
							<Send class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-white">Send Verification Test Email</h3>
							<p class="text-xs text-slate-400">Validate real-time delivery and inbox receipt</p>
						</div>
					</div>

					<form method="POST" action="?/sendTest" class="space-y-4">
						<div>
							<label for="testRecipient" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
								Recipient Email Address
							</label>
							<input
								type="email"
								id="testRecipient"
								name="recipient"
								required
								bind:value={testRecipient}
								placeholder="e.g. yourname@gmail.com"
								class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
							/>
							<p class="mt-1 text-[11px] text-slate-500">
								A sample credentials email will be delivered to this inbox to test end-to-end SMTP routing.
							</p>
						</div>

						<button
							type="submit"
							class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500"
						>
							<Send class="h-4 w-4" />
							<span>Dispatch Verification Test Email</span>
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- TAB 3: MEMBER EMAIL COMPOSER -->
	{#if activeTab === 'broadcast'}
		<div class="max-w-2xl rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 space-y-5">
			<div class="flex items-center gap-3 border-b border-slate-800 pb-3">
				<div class="rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
					<Send class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-white">Broadcast Email to Organization Members</h3>
					<p class="text-xs text-slate-400">Compose and send formatted notifications to active team members</p>
				</div>
			</div>

			<form method="POST" action="?/sendBroadcast" class="space-y-4">
				<!-- Audience Selector -->
				<div>
					<span class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
						Target Audience
					</span>
					<div class="grid grid-cols-3 gap-2">
						<button
							type="button"
							onclick={() => (broadcastTarget = 'all')}
							class={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
								broadcastTarget === 'all'
									? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
									: 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
							}`}
						>
							All Members ({data.members.length})
						</button>
						<button
							type="button"
							onclick={() => (broadcastTarget = 'department')}
							class={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
								broadcastTarget === 'department'
									? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
									: 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
							}`}
						>
							By Department
						</button>
						<button
							type="button"
							onclick={() => (broadcastTarget = 'member')}
							class={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
								broadcastTarget === 'member'
									? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
									: 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
							}`}
						>
							Single Member
						</button>
					</div>
					<input type="hidden" name="targetType" value={broadcastTarget} />
				</div>

				<!-- Target Pickers -->
				{#if broadcastTarget === 'department'}
					<div>
						<label for="deptSelect" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
							Select Department
						</label>
						<select
							id="deptSelect"
							name="targetId"
							bind:value={selectedDeptId}
							required
							class="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
						>
							<option value="">Choose Department...</option>
							{#each data.departments as dept}
								<option value={dept.id}>{dept.name}</option>
							{/each}
						</select>
					</div>
				{/if}

				{#if broadcastTarget === 'member'}
					<div>
						<label for="memberSelect" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
							Select Member
						</label>
						<select
							id="memberSelect"
							name="targetId"
							bind:value={selectedMemberId}
							required
							class="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
						>
							<option value="">Choose Member...</option>
							{#each data.members as m}
								<option value={m.id}>{m.fullName} (@{m.username}) — {m.email}</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- Subject Line -->
				<div>
					<label for="bSubject" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
						Email Subject Line
					</label>
					<input
						type="text"
						id="bSubject"
						name="subject"
						required
						bind:value={broadcastSubject}
						placeholder="e.g. Important Announcement: Weekly Hackathon Kickoff"
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
					/>
				</div>

				<!-- Title -->
				<div>
					<label for="bTitle" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
						Header Title in Email Body (Optional)
					</label>
					<input
						type="text"
						id="bTitle"
						name="title"
						bind:value={broadcastTitle}
						placeholder="Leave blank to use Subject"
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
					/>
				</div>

				<!-- Message Body -->
				<div>
					<label for="bMessage" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
						Message Body
					</label>
					<textarea
						id="bMessage"
						name="message"
						rows="5"
						required
						bind:value={broadcastMessage}
						placeholder="Write your announcement or instructions to the members here..."
						class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
					></textarea>
				</div>

				<!-- Optional Action Button -->
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<label for="bActionUrl" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
							Action Button Link (Optional)
						</label>
						<input
							type="text"
							id="bActionUrl"
							name="actionUrl"
							bind:value={broadcastActionUrl}
							placeholder="e.g. /tasks or https://discord.gg/..."
							class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
						/>
					</div>
					<div>
						<label for="bActionText" class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
							Action Button Label (Optional)
						</label>
						<input
							type="text"
							id="bActionText"
							name="actionText"
							bind:value={broadcastActionText}
							placeholder="e.g. View Task Details"
							class="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
						/>
					</div>
				</div>

				<div class="pt-3 border-t border-slate-800 flex justify-end">
					<button
						type="submit"
						class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
					>
						<Send class="h-4 w-4" />
						<span>Send Broadcast Email</span>
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>
