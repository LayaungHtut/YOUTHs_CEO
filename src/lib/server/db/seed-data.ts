import type { NewDepartment, NewAchievement, NewTaskTemplate } from './types';

export const INITIAL_DEPARTMENTS: Array<NewDepartment & { id: string }> = [
	{
		id: 'dept-software-dev',
		name: 'Software Development',
		description: 'Engineering, web, infrastructure, and technical toolchain.',
		headUserId: null
	},
	{
		id: 'dept-graphic-design',
		name: 'Graphic Design',
		description: 'Brand identities, visual assets, creative media, and UI/UX design.',
		headUserId: null
	},
	{
		id: 'dept-games-esports',
		name: 'Games & Esports',
		description: 'Competitive gaming events, tournament operations, and game design.',
		headUserId: null
	},
	{
		id: 'dept-merchandise-branding',
		name: 'Merchandise & Branding',
		description: 'Physical and digital apparel, promotional items, and partner branding.',
		headUserId: null
	},
	{
		id: 'dept-finance-operations',
		name: 'Finance & Operations',
		description: 'Budgeting, logistics, governance, compliance, and organizational workflows.',
		headUserId: null
	}
];

export const INITIAL_ACHIEVEMENTS: Array<NewAchievement & { id: string }> = [
	{
		id: 'ach-first-task',
		name: 'First Task',
		description: 'Completed your first assigned task for YOUTHs.',
		icon: 'award',
		category: 'TASKS',
		criteria: JSON.stringify({ type: 'COMPLETED_TASKS_COUNT', threshold: 1 }),
		active: true
	},
	{
		id: 'ach-task-master',
		name: 'Task Master',
		description: 'Completed 10 tasks successfully.',
		icon: 'check-circle',
		category: 'TASKS',
		criteria: JSON.stringify({ type: 'COMPLETED_TASKS_COUNT', threshold: 10 }),
		active: true
	},
	{
		id: 'ach-dept-champion',
		name: 'Department Champion',
		description: 'Completed 5 tasks within your primary department.',
		icon: 'shield',
		category: 'DEPARTMENT',
		criteria: JSON.stringify({ type: 'DEPARTMENT_TASKS_COUNT', threshold: 5 }),
		active: true
	},
	{
		id: 'ach-on-time-ace',
		name: 'On-Time Ace',
		description: 'Maintained a 90%+ on-time completion rate across at least 5 tasks.',
		icon: 'clock',
		category: 'CONSISTENCY',
		criteria: JSON.stringify({ type: 'ON_TIME_RATE', threshold: 90, minTasks: 5 }),
		active: true
	},
	{
		id: 'ach-comeback-kid',
		name: 'Resilient Comeback',
		description: 'Completed a task promptly following an overdue milestone.',
		icon: 'zap',
		category: 'CONSISTENCY',
		criteria: JSON.stringify({ type: 'COMEBACK_AFTER_OVERDUE' }),
		active: true
	},
	{
		id: 'ach-streak-master',
		name: 'Consistency King',
		description: 'Completed on-time tasks across 4 consecutive cycle weeks.',
		icon: 'flame',
		category: 'CONSISTENCY',
		criteria: JSON.stringify({ type: 'CONSECUTIVE_ON_TIME_WEEKS', threshold: 4 }),
		active: true
	}
];

export const INITIAL_TASK_TEMPLATES: Array<NewTaskTemplate & { id: string }> = [
	{
		id: 'tmpl-soft-1',
		title: 'Build Feature Module',
		description: 'Implement and unit test assigned feature module adhering to project specifications.',
		departmentId: 'dept-software-dev',
		priority: 'MEDIUM',
		estimatedEffort: '4-6 hours',
		requiredSkills: JSON.stringify(['TypeScript', 'SvelteKit']),
		active: true
	},
	{
		id: 'tmpl-soft-2',
		title: 'API Integration & Testing',
		description: 'Integrate and test endpoints for external service or subsystem.',
		departmentId: 'dept-software-dev',
		priority: 'HIGH',
		estimatedEffort: '3-5 hours',
		requiredSkills: JSON.stringify(['API', 'PostgreSQL']),
		active: true
	},
	{
		id: 'tmpl-design-1',
		title: 'Design Social Media Banner Kit',
		description: 'Create responsive visual assets and banners for upcoming campaign.',
		departmentId: 'dept-graphic-design',
		priority: 'MEDIUM',
		estimatedEffort: '3-4 hours',
		requiredSkills: JSON.stringify(['Figma', 'Photoshop']),
		active: true
	},
	{
		id: 'tmpl-design-2',
		title: 'Brand Identity Icon Pack',
		description: 'Develop vectors and icon set aligned with organization branding.',
		departmentId: 'dept-graphic-design',
		priority: 'MEDIUM',
		estimatedEffort: '4-5 hours',
		requiredSkills: JSON.stringify(['Illustrator', 'Branding']),
		active: true
	},
	{
		id: 'tmpl-games-1',
		title: 'Weekly Tournament Bracket Setup',
		description: 'Configure tournament brackets, rulebook, and verify roster check-ins.',
		departmentId: 'dept-games-esports',
		priority: 'MEDIUM',
		estimatedEffort: '2-3 hours',
		requiredSkills: JSON.stringify(['Tournament Ops', 'Discord']),
		active: true
	},
	{
		id: 'tmpl-merch-1',
		title: 'Merchandise Mockup Review',
		description: 'Review vendor mockups and size charts for seasonal drop.',
		departmentId: 'dept-merchandise-branding',
		priority: 'LOW',
		estimatedEffort: '2-4 hours',
		requiredSkills: JSON.stringify(['Merch Design', 'Vendor Ops']),
		active: true
	},
	{
		id: 'tmpl-fin-1',
		title: 'Weekly Expense & Budget Audit',
		description: 'Verify expense receipts, update budget ledger, and flag anomalies.',
		departmentId: 'dept-finance-operations',
		priority: 'HIGH',
		estimatedEffort: '3-5 hours',
		requiredSkills: JSON.stringify(['Accounting', 'Excel']),
		active: true
	}
];

export const DEFAULT_ORG_SETTINGS: Record<string, unknown> = {
	'org.name': { value: 'YOUTHs (Youth Opportunities United Through Human Skills)' },
	'org.timezone': { value: 'Asia/Yangon' },
	'org.description': {
		value:
			'Empowering youth leaders across software development, graphic design, games & esports, merchandise & branding, and finance & operations.'
	},
	'schedule.cycle_start_day': { value: 'Monday' },
	'schedule.deadline_day': { value: 'Saturday' },
	'schedule.review_day': { value: 'Sunday' },
	'points.starting_balance': { value: 100 },
	'points.completion_reward': { value: 10 },
	'points.overdue_penalty': { value: 10 },
	'points.max_weekly_deduction': { value: 30 },
	'points.allow_negative': { value: false },
	'ai.openrouter_api_key': { value: '' },
	'ai.default_model': { value: 'anthropic/claude-3.5-sonnet' },
	'ai.temperature': { value: 0.2 },
	'ai.auto_publish': { value: false }
};

