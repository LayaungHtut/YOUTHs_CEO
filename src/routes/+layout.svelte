<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import {
		LayoutDashboard,
		Users,
		Building2,
		CheckSquare,
		Sparkles,
		BarChart3,
		MessageSquare,
		Award,
		Database,
		ShieldCheck,
		Settings,
		Bell,
		LogOut,
		Menu,
		X,
		Search,
		Shield,
		Mail
	} from '@lucide/svelte';

	let { data, children } = $props();

	let isSidebarOpen = $state(false);
	let isNotificationsOpen = $state(false);

	const isAuthPage = $derived(
		page.url.pathname === '/login' ||
			page.url.pathname === '/setup' ||
			page.url.pathname === '/change-password'
	);

	const navItems = [
		{ name: 'Overview', href: '/', icon: LayoutDashboard },
		{ name: 'Organization', href: '/members', icon: Users },
		{ name: 'Departments', href: '/departments', icon: Building2 },
		{ name: 'Task Management', href: '/tasks', icon: CheckSquare },
		{ name: 'AI Weekly Distribution', href: '/tasks/distribution', icon: Sparkles, badge: 'AI' },
		{ name: 'Progress & Analytics', href: '/progress', icon: BarChart3 },
		{ name: 'Messages', href: '/messages', icon: MessageSquare },
		{ name: 'Email Center', href: '/emails', icon: Mail },
		{ name: 'Achievements', href: '/achievements', icon: Award },
		{ name: 'Integrations', href: '/integrations', icon: Database },
		{ name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
		{ name: 'Settings', href: '/settings', icon: Settings }
	];

	function isActive(href: string) {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

{#if isAuthPage}
	<!-- Minimalist Authentication Shell -->
	<div
		class="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-indigo-600 selection:text-white"
	>
		{@render children()}
	</div>
{:else}
	<!-- SaaS Command Center Shell -->
	<div
		class="flex min-h-screen flex-col bg-slate-900 font-sans text-slate-100 antialiased selection:bg-indigo-600 selection:text-white md:flex-row"
	>
		<!-- Mobile Top Nav -->
		<header
			class="sticky top-0 z-50 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur md:hidden"
		>
			<div class="flex items-center gap-2.5">
				<img
					src="/logo.png"
					alt="YOUTHs Logo"
					class="h-8 w-8 rounded-lg object-contain drop-shadow"
				/>
				<span class="font-bold tracking-tight text-white">YOUTHs CEO</span>
			</div>
			<div class="flex items-center gap-2">
				<button
					type="button"
					aria-label="Toggle Navigation"
					onclick={() => (isSidebarOpen = !isSidebarOpen)}
					class="rounded-lg border border-slate-700/60 bg-slate-800/80 p-2 text-slate-300 hover:text-white"
				>
					{#if isSidebarOpen}
						<X class="h-5 w-5" />
					{:else}
						<Menu class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</header>

		<!-- Sidebar (Desktop and Mobile Drawer) -->
		<aside
			class={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur transition-transform duration-200 md:static md:translate-x-0 ${
				isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
			}`}
		>
			<!-- Brand Header -->
			<div class="flex items-center justify-between border-b border-slate-800/60 px-6 py-5">
				<div class="flex items-center gap-3">
					<img
						src="/logo.png"
						alt="YOUTHs Logo"
						class="h-9 w-9 rounded-xl object-contain drop-shadow-md"
					/>
					<div>
						<div class="text-base leading-none font-bold tracking-tight text-white">YOUTHs</div>
						<div class="mt-1 text-[11px] font-medium tracking-wider text-indigo-400 uppercase">
							Command Center
						</div>
					</div>
				</div>
				<button
					type="button"
					aria-label="Close Sidebar"
					class="text-slate-400 hover:text-white md:hidden"
					onclick={() => (isSidebarOpen = false)}
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Navigation Links -->
			<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
				{#each navItems as item}
					{@const active = isActive(item.href)}
					<a
						href={item.href}
						onclick={() => (isSidebarOpen = false)}
						class={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
							active
								? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
								: 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
						}`}
					>
						<div class="flex items-center gap-3">
							<item.icon class={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
							<span>{item.name}</span>
						</div>
						{#if item.badge}
							<span
								class={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
									active ? 'bg-indigo-800 text-indigo-200' : 'bg-indigo-500/20 text-indigo-400'
								}`}
							>
								{item.badge}
							</span>
						{/if}
					</a>
				{/each}
			</nav>

			<!-- User Profile Footer -->
			{#if data.user}
				<div class="border-t border-slate-800/60 bg-slate-950 p-3">
					<div
						class="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900 p-2.5"
					>
						<div class="flex min-w-0 items-center gap-2.5">
							<div
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20 text-xs font-bold text-indigo-300"
							>
								{data.user.fullName.slice(0, 2).toUpperCase()}
							</div>
							<div class="min-w-0">
								<div class="truncate text-xs font-semibold text-white">{data.user.fullName}</div>
								<div class="flex items-center gap-1 text-[10px] font-medium text-slate-400">
									<Shield class="h-3 w-3 text-indigo-400" />
									<span>{data.user.role}</span>
								</div>
							</div>
						</div>
						<form action="/logout" method="POST">
							<button
								type="submit"
								title="Log out"
								aria-label="Log out"
								class="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
							>
								<LogOut class="h-4 w-4" />
							</button>
						</form>
					</div>
				</div>
			{/if}
		</aside>

		<!-- Main Workspace Area -->
		<div class="flex min-h-screen min-w-0 flex-1 flex-col">
			<!-- Desktop Top Header -->
			<header
				class="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-8 backdrop-blur md:flex"
			>
				<div class="flex max-w-md flex-1 items-center gap-4">
					<div class="relative w-full">
						<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<input
							type="text"
							placeholder="Search tasks, members, departments..."
							class="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 pr-4 pl-9 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
						/>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<!-- Notification Center Dropdown -->
					<div class="relative">
						<button
							type="button"
							aria-label="Notifications"
							onclick={() => (isNotificationsOpen = !isNotificationsOpen)}
							class="relative rounded-lg border border-transparent p-2 text-slate-400 transition hover:border-slate-700/60 hover:bg-slate-800/70 hover:text-white"
						>
							<Bell class="h-5 w-5" />
							{#if data.unreadNotifications > 0}
								<span
									class="absolute top-1.5 right-1.5 h-2 w-2 animate-pulse rounded-full bg-indigo-500 ring-2 ring-slate-950"
								></span>
							{/if}
						</button>

						{#if isNotificationsOpen}
							<div
								class="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-2xl"
							>
								<div class="flex items-center justify-between border-b border-slate-800 pb-3">
									<h4 class="text-xs font-semibold tracking-wider text-slate-400 uppercase">
										Notifications
									</h4>
									<span class="text-xs font-medium text-indigo-400"
										>{data.unreadNotifications} unread</span
									>
								</div>
								<div class="mt-2 max-h-64 divide-y divide-slate-800/60 overflow-y-auto">
									{#if data.notifications.length === 0}
										<div class="py-6 text-center text-xs text-slate-500">No new notifications</div>
									{:else}
										{#each data.notifications as notif}
											<div class="py-2.5">
												<div class="text-xs font-semibold text-slate-200">{notif.title}</div>
												<div class="mt-0.5 text-[11px] text-slate-400">{notif.message}</div>
												<div class="mt-1 text-[10px] text-slate-500">
													{new Date(notif.createdAt).toLocaleTimeString()}
												</div>
											</div>
										{/each}
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<div class="h-5 w-px bg-slate-800"></div>

					<!-- Quick Status Pill -->
					<div
						class="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400"
					>
						<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></span>
						<span>YOUTHs Core Active</span>
					</div>
				</div>
			</header>

			<!-- Page Content -->
			<main class="flex-1 overflow-y-auto p-4 md:p-8">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
