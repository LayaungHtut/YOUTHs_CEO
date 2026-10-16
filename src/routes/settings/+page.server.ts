import { type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth/permissions';
import { setSetting, getAllSettings } from '$lib/server/services/settingsService';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals.user, 'CEO');

	const rawSettings = (await getAllSettings()) as Record<string, { value?: unknown } | undefined>;
	// text settings fall back on empty too; numbers and booleans only when missing
	const text = (key: string, fallback: string) => (rawSettings[key]?.value as string) || fallback;
	const val = <T>(key: string, fallback: T) => (rawSettings[key]?.value as T | undefined) ?? fallback;

	return {
		settings: {
			orgName: text('org.name', 'YOUTHs (Youth Opportunities United Through Human Skills)'),
			orgTimezone: text('org.timezone', 'Asia/Yangon'),
			orgDescription: text(
				'org.description',
				'Empowering youth leaders across software development, graphic design, games & esports, merchandise & branding, and finance & operations.'
			),
			cycleStart: text('schedule.cycle_start_day', 'Monday'),
			deadlineDay: text('schedule.deadline_day', 'Saturday'),
			reviewDay: text('schedule.review_day', 'Sunday'),
			startingBalance: val('points.starting_balance', 100),
			completionReward: val('points.completion_reward', 10),
			overduePenalty: val('points.overdue_penalty', 10),
			maxWeeklyDeduction: val('points.max_weekly_deduction', 30),
			allowNegative: val('points.allow_negative', false),
			openRouterKey: rawSettings['ai.openrouter_api_key']?.value ? '••••••••••••••••' : '',
			aiModel: text('ai.default_model', 'anthropic/claude-3.5-sonnet'),
			aiTemperature: val('ai.temperature', 0.2),
			autoPublish: val('ai.auto_publish', false)
		}
	};
};

export const actions: Actions = {
	saveOrgSettings: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const orgName = (data.get('orgName') as string)?.trim();
		const orgTimezone = (data.get('orgTimezone') as string)?.trim();
		const orgDescription = (data.get('orgDescription') as string)?.trim();

		if (orgName) await setSetting('org.name', { value: orgName }, locals.user!.id);
		if (orgTimezone) await setSetting('org.timezone', { value: orgTimezone }, locals.user!.id);
		if (orgDescription) await setSetting('org.description', { value: orgDescription }, locals.user!.id);

		return { success: true, message: 'Organization profile updated.' };
	},

	saveAISettings: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const apiKey = (data.get('openRouterKey') as string)?.trim();
		const aiModel = (data.get('aiModel') as string)?.trim();
		const aiTemperature = parseFloat(data.get('aiTemperature') as string) || 0.2;
		const autoPublish = data.get('autoPublish') === 'true';

		// Only update API key if not masked placeholder
		if (apiKey && !apiKey.startsWith('•••')) {
			await setSetting('ai.openrouter_api_key', { value: apiKey }, locals.user!.id);
		}
		if (aiModel) await setSetting('ai.default_model', { value: aiModel }, locals.user!.id);
		await setSetting('ai.temperature', { value: aiTemperature }, locals.user!.id);
		await setSetting('ai.auto_publish', { value: autoPublish }, locals.user!.id);

		return { success: true, message: 'AI Engine settings saved.' };
	},

	savePointsSettings: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const startingBalance = parseInt(data.get('startingBalance') as string, 10) || 100;
		const completionReward = parseInt(data.get('completionReward') as string, 10) || 10;
		const overduePenalty = parseInt(data.get('overduePenalty') as string, 10) || 10;
		const maxWeeklyDeduction = parseInt(data.get('maxWeeklyDeduction') as string, 10) || 30;
		const allowNegative = data.get('allowNegative') === 'true';

		await setSetting('points.starting_balance', { value: startingBalance }, locals.user!.id);
		await setSetting('points.completion_reward', { value: completionReward }, locals.user!.id);
		await setSetting('points.overdue_penalty', { value: overduePenalty }, locals.user!.id);
		await setSetting('points.max_weekly_deduction', { value: maxWeeklyDeduction }, locals.user!.id);
		await setSetting('points.allow_negative', { value: allowNegative }, locals.user!.id);

		return { success: true, message: 'Points policy settings saved.' };
	}
};
