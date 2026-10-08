import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import {
	getSavedEmailTemplate,
	getEmailProviderStatus,
	sendTestEmail,
	sendBroadcastEmail,
	DEFAULT_EMAIL_TEMPLATE,
	type EmailTemplateConfig
} from '$lib/server/services/emailService';
import { setSetting, getSetting } from '$lib/server/services/settingsService';
import { logAudit, AuditActions } from '$lib/server/services/auditService';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals.user, 'CEO');

	const template = await getSavedEmailTemplate();
	const providerStatus = getEmailProviderStatus();
	const allMembers = await db.getAllUsers({ accountStatus: 'ACTIVE' });
	const departments = await db.getDepartments();

	const orgSetting = await getSetting<{ value: string }>('org.name');
	const rawOrgName = orgSetting?.value || 'YOUTHs';
	const orgName = rawOrgName.split('(')[0]?.trim() || 'YOUTHs';

	return {
		template,
		providerStatus,
		orgName,
		ceoEmail: locals.user?.email || '',
		members: allMembers.map((m) => ({
			id: m.id,
			fullName: m.fullName,
			username: m.username,
			email: m.email,
			departmentId: m.departmentId,
			role: m.role
		})),
		departments: departments.map((d) => ({
			id: d.id,
			name: d.name
		}))
	};
};

export const actions: Actions = {
	saveTemplate: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const subjectTemplate =
			(data.get('subjectTemplate') as string)?.trim() || DEFAULT_EMAIL_TEMPLATE.subjectTemplate;
		const headerTitle =
			(data.get('headerTitle') as string)?.trim() || DEFAULT_EMAIL_TEMPLATE.headerTitle;
		const greetingText =
			(data.get('greetingText') as string)?.trim() || DEFAULT_EMAIL_TEMPLATE.greetingText;
		const bodyText = (data.get('bodyText') as string)?.trim() || DEFAULT_EMAIL_TEMPLATE.bodyText;
		const instructionsText =
			(data.get('instructionsText') as string)?.trim() || DEFAULT_EMAIL_TEMPLATE.instructionsText;
		const buttonText =
			(data.get('buttonText') as string)?.trim() || DEFAULT_EMAIL_TEMPLATE.buttonText;
		const footerNote =
			(data.get('footerNote') as string)?.trim() || DEFAULT_EMAIL_TEMPLATE.footerNote;
		const portalUrl = (data.get('portalUrl') as string)?.trim() || '';
		const accentColor =
			(data.get('accentColor') as string)?.trim() || DEFAULT_EMAIL_TEMPLATE.accentColor;
		const logoUrl = (data.get('logoUrl') as string)?.trim() || '';
		const showLogo = data.get('showLogo') === 'true';

		const newTemplate: EmailTemplateConfig = {
			subjectTemplate,
			headerTitle,
			greetingText,
			bodyText,
			instructionsText,
			buttonText,
			footerNote,
			portalUrl,
			accentColor,
			logoUrl,
			showLogo
		};

		await setSetting('email.template', newTemplate, locals.user!.id);

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.EMAIL_TEMPLATE_UPDATE,
			targetType: 'SETTINGS',
			targetId: 'email.template',
			metadata: newTemplate as any
		});

		return {
			success: true,
			action: 'saveTemplate',
			message: 'Custom email template design and content saved.'
		};
	},

	resetTemplate: async ({ locals }) => {
		requireRole(locals.user, 'CEO');

		await setSetting('email.template', DEFAULT_EMAIL_TEMPLATE, locals.user!.id);

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.EMAIL_TEMPLATE_UPDATE,
			targetType: 'SETTINGS',
			targetId: 'email.template',
			metadata: { reset: true }
		});

		return {
			success: true,
			action: 'resetTemplate',
			message: 'Email template restored to default layout and copy.'
		};
	},

	sendTest: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const recipient = (data.get('recipient') as string)?.trim().toLowerCase();

		if (!recipient) {
			return fail(400, { error: 'Recipient email address is required for testing.' });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(recipient)) {
			return fail(400, { error: 'Please enter a valid recipient email address.' });
		}

		const result = await sendTestEmail(recipient);

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.EMAIL_TEST_SEND,
			targetType: 'SETTINGS',
			metadata: { recipient, sent: result.sent, error: result.error }
		});

		if (!result.sent) {
			return fail(500, {
				error: result.error || 'Failed to dispatch test verification email.',
				testResult: { sent: false, recipient }
			});
		}

		return {
			success: true,
			action: 'sendTest',
			message: `Verification test email dispatched successfully to ${recipient}!`,
			testResult: { sent: true, recipient }
		};
	},

	sendBroadcast: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const targetType = (data.get('targetType') as string) || 'all';
		const targetId = (data.get('targetId') as string) || '';
		const subject = (data.get('subject') as string)?.trim();
		const title = (data.get('title') as string)?.trim();
		const message = (data.get('message') as string)?.trim();
		const actionUrl = (data.get('actionUrl') as string)?.trim();
		const actionText = (data.get('actionText') as string)?.trim();

		if (!subject || !message) {
			return fail(400, { error: 'Subject and message body are required.' });
		}

		// Resolve recipients
		let recipients: { email: string; name: string }[] = [];
		const activeUsers = await db.getAllUsers({ accountStatus: 'ACTIVE' });

		if (targetType === 'all') {
			recipients = activeUsers.map((u) => ({ email: u.email, name: u.fullName }));
		} else if (targetType === 'department' && targetId) {
			recipients = activeUsers
				.filter((u) => u.departmentId === targetId)
				.map((u) => ({ email: u.email, name: u.fullName }));
		} else if (targetType === 'member' && targetId) {
			const member = activeUsers.find((u) => u.id === targetId);
			if (member) {
				recipients = [{ email: member.email, name: member.fullName }];
			}
		}

		if (recipients.length === 0) {
			return fail(400, { error: 'No active recipients found for the selected audience.' });
		}

		let successCount = 0;
		let lastError: string | undefined;

		for (const rec of recipients) {
			const res = await sendBroadcastEmail({
				to: rec.email,
				recipientName: rec.name,
				subject,
				title: title || subject,
				message,
				actionUrl: actionUrl || undefined,
				actionText: actionText || undefined
			});

			if (res.sent) {
				successCount++;
			} else {
				lastError = res.error;
			}
		}

		await logAudit({
			actorId: locals.user!.id,
			action: AuditActions.EMAIL_BROADCAST_SEND,
			targetType: 'USER',
			metadata: {
				targetType,
				targetId,
				totalRecipients: recipients.length,
				successCount,
				subject
			}
		});

		if (successCount === 0) {
			return fail(500, {
				error: lastError || 'Failed to send broadcast emails to recipients.'
			});
		}

		return {
			success: true,
			action: 'sendBroadcast',
			message: `Broadcast delivered to ${successCount} of ${recipients.length} member(s).`
		};
	}
};

