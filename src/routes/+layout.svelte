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
		Shield
	} from '@lucide/svelte';

	let { data, children } = $props();

	let isSidebarOpen = $state(false);
	let isNotificationsOpen = $state(false);

	const isAuthPage = $derived(
		page.url.pathname === '/login' || page.url.pathname === '/setup'
	);

	const navItems = [
		{ name: 'Overview', href: '/', icon: LayoutDashboard },
		{ name: 'Organization', href: '/members', icon: Users },
		{ name: 'Departments', href: '/departments', icon: Building2 },
		{ name: 'Task Management', href: '/tasks', icon: CheckSquare },
		{ name: 'AI Weekly Distribution', href: '/tasks/distribution', icon: Sparkles, badge: 'AI' },
		{ name: 'Progress & Analytics', href: '/progress', icon: BarChart3 },
		{ name: 'Messages', href: '/messages', icon: MessageSquare },
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
	<div class="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
		{@render children()}
	</div>
{:else}
	<!-- SaaS Command Center Shell -->
	<div class="min-h-screen bg-slate-900 font-sans text-slate-100 antialiased selection:bg-indigo-600 selection:text-white flex flex-col md:flex-row">
		<!-- Mobile Top Nav -->
		<header class="md:hidden flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
			<div class="flex items-center gap-2.5">
				<div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
					Y
				</div>
				<span class="font-bold tracking-tight text-white">YOUTHs CEO</span>
			</div>
			<div class="flex items-center gap-2">
				<button
					type="button"
					aria-label="Toggle Navigation"
					onclick={() => (isSidebarOpen = !isSidebarOpen)}
					class="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60"
				>
					{#if isSidebarOpen}
						<X class="w-5 h-5" />
					{:else}
						<Menu class="w-5 h-5" />
					{/if}
				</button>
			</div>
		</header>

		<!-- Sidebar (Desktop and Mobile Drawer) -->
		<aside
			class={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950/95 backdrop-blur border-r border-slate-800/80 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
				isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
			}`}
		>
			<!-- Brand Header -->
			<div class="px-6 py-5 border-b border-slate-800/60 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-600/30">
						Y
					</div>
					<div>
						<div class="font-bold text-base text-white tracking-tight leading-none">YOUTHs</div>
						<div class="text-[11px] font-medium text-indigo-400 mt-1 uppercase tracking-wider">Command Center</div>
					</div>
				</div>
				<button
					type="button"
					aria-label="Close Sidebar"
					class="md:hidden text-slate-400 hover:text-white"
					onclick={() => (isSidebarOpen = false)}
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Navigation Links -->
			<nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
				{#each navItems as item}
					{@const active = isActive(item.href)}
					<a
						href={item.href}
						onclick={() => (isSidebarOpen = false)}
						class={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
							active
								? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
						}`}
					>
						<div class="flex items-center gap-3">
							<item.icon class={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
							<span>{item.name}</span>
						</div>
						{#if item.badge}
							<span
								class={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
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
				<div class="p-3 border-t border-slate-800/60 bg-slate-950">
					<div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
						<div class="flex items-center gap-2.5 min-w-0">
							<div class="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
								{data.user.fullName.slice(0, 2).toUpperCase()}
							</div>
							<div class="min-w-0">
								<div class="text-xs font-semibold text-white truncate">{data.user.fullName}</div>
								<div class="text-[10px] font-medium text-slate-400 flex items-center gap-1">
									<Shield class="w-3 h-3 text-indigo-400" />
									<span>{data.user.role}</span>
								</div>
							</div>
						</div>
						<form action="/logout" method="POST">
							<button
								type="submit"
								title="Log out"
								aria-label="Log out"
								class="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800 transition"
							>
								<LogOut class="w-4 h-4" />
							</button>
						</form>
					</div>
				</div>
			{/if}
		</aside>

		<!-- Main Workspace Area -->
		<div class="flex-1 flex flex-col min-w-0 min-h-screen">
			<!-- Desktop Top Header -->
			<header class="hidden md:flex items-center justify-between h-16 px-8 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur sticky top-0 z-30">
				<div class="flex items-center gap-4 flex-1 max-w-md">
					<div class="relative w-full">
						<Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
						<input
							type="text"
							placeholder="Search tasks, members, departments..."
							class="w-full bg-slate-900/90 text-sm text-slate-200 placeholder-slate-500 pl-9 pr-4 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
							class="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/70 transition border border-transparent hover:border-slate-700/60"
						>
							<Bell class="w-5 h-5" />
							{#if data.unreadNotifications > 0}
								<span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950 animate-pulse"></span>
							{/if}
						</button>

						{#if isNotificationsOpen}
							<div class="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50">
								<div class="flex items-center justify-between pb-3 border-b border-slate-800">
									<h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Notifications</h4>
									<span class="text-xs text-indigo-400 font-medium">{data.unreadNotifications} unread</span>
								</div>
								<div class="mt-2 divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
									{#if data.notifications.length === 0}
										<div class="py-6 text-center text-xs text-slate-500">No new notifications</div>
									{:else}
										{#each data.notifications as notif}
											<div class="py-2.5">
												<div class="text-xs font-semibold text-slate-200">{notif.title}</div>
												<div class="text-[11px] text-slate-400 mt-0.5">{notif.message}</div>
												<div class="text-[10px] text-slate-500 mt-1">{new Date(notif.createdAt).toLocaleTimeString()}</div>
											</div>
										{/each}
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<div class="h-5 w-px bg-slate-800"></div>

					<!-- Quick Status Pill -->
					<div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
						<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
						<span>YOUTHs Core Active</span>
					</div>
				</div>
			</header>

			<!-- Page Content -->
			<main class="flex-1 p-4 md:p-8 overflow-y-auto">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
