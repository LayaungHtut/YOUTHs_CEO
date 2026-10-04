import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import { setSetting, getAllSettings } from '$lib/server/services/settingsService';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals.user, 'CEO');

	const rawSettings: Record<string, any> = await getAllSettings();

	return {
		settings: {
			orgName: rawSettings['org.name']?.value || 'YOUTHs (Youth Opportunities United Through Human Skills)',
			orgTimezone: rawSettings['org.timezone']?.value || 'Asia/Yangon',
			orgDescription:
				rawSettings['org.description']?.value ||
				'Empowering youth leaders across software development, graphic design, games & esports, merchandise & branding, and finance & operations.',
			cycleStart: rawSettings['schedule.cycle_start_day']?.value || 'Monday',
			deadlineDay: rawSettings['schedule.deadline_day']?.value || 'Saturday',
			reviewDay: rawSettings['schedule.review_day']?.value || 'Sunday',
			startingBalance: rawSettings['points.starting_balance']?.value ?? 100,
			completionReward: rawSettings['points.completion_reward']?.value ?? 10,
			overduePenalty: rawSettings['points.overdue_penalty']?.value ?? 10,
			maxWeeklyDeduction: rawSettings['points.max_weekly_deduction']?.value ?? 30,
			allowNegative: rawSettings['points.allow_negative']?.value ?? false,
			openRouterKey: rawSettings['ai.openrouter_api_key']?.value ? '••••••••••••••••' : '',
			aiModel: rawSettings['ai.default_model']?.value || 'anthropic/claude-3.5-sonnet',
			aiTemperature: rawSettings['ai.temperature']?.value ?? 0.2,
			autoPublish: rawSettings['ai.auto_publish']?.value ?? false
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
