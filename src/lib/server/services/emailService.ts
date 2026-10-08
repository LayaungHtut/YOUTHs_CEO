import '../env';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { getSetting } from './settingsService';

export interface SendResult {
	sent: boolean;
	error?: string;
}

export interface EmailTemplateConfig {
	subjectTemplate: string;
	headerTitle: string;
	greetingText: string;
	bodyText: string;
	instructionsText: string;
	footerNote: string;
	accentColor: string;
	logoUrl: string;
	showLogo: boolean;
	buttonText: string;
	portalUrl: string;
}

export const DEFAULT_EMAIL_TEMPLATE: EmailTemplateConfig = {
	subjectTemplate: 'Your {orgName} account has been created',
	headerTitle: 'Your {orgName} account has been created',
	greetingText: 'Hello,',
	bodyText: 'Your account has been created.',
	instructionsText:
		'Please log in using these credentials and change your temporary password after logging in.',
	footerNote:
		'This is an automated administrative notification. Please keep your temporary credentials secure.',
	accentColor: '#6366f1',
	logoUrl: '',
	showLogo: false,
	buttonText: 'Log in to {orgName}',
	portalUrl: 'https://youths-member.vercel.app/'
};

export interface CredentialsEmailParams {
	to: string;
	email: string;
	password: string;
	username?: string;
	fullName?: string;
	role?: string;
	orgName?: string;
	loginUrl?: string;
	subject?: string;
	templateConfig?: EmailTemplateConfig;
}

function escapeHtml(value: string): string {
	if (!value) return '';
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Resolves the display organization name.
 * Priority: explicitly passed orgName -> process.env.ORGANIZATION_NAME -> display name in RESEND_FROM_EMAIL -> 'YOUTHs'
 */
export function resolveOrgName(customOrgName?: string): string {
	if (customOrgName?.trim()) return customOrgName.trim();
	if (process.env.ORGANIZATION_NAME?.trim()) return process.env.ORGANIZATION_NAME.trim();

	const fromEnv = process.env.RESEND_FROM_EMAIL;
	if (fromEnv) {
		const match = fromEnv.match(/^([^<]+)</);
		if (match && match[1].trim()) {
			return match[1].trim();
		}
	}

	return 'YOUTHs';
}

/**
 * Retrieves the saved email template configuration from settings, or returns defaults.
 */
export async function getSavedEmailTemplate(): Promise<EmailTemplateConfig> {
	try {
		const saved = await getSetting<Partial<EmailTemplateConfig>>('email.template');
		if (saved && typeof saved === 'object') {
			const merged = { ...DEFAULT_EMAIL_TEMPLATE, ...saved };
			if (!merged.portalUrl?.trim() || merged.portalUrl.includes('yout-hs-ceo')) {
				merged.portalUrl = 'https://youths-member.vercel.app/';
			}
			return merged;
		}
	} catch {
		// Ignore if database is not available
	}
	return DEFAULT_EMAIL_TEMPLATE;
}

/**
 * Builds the HTML and plain-text email content matching the required credentials template,
 * applying custom template customization (accent color, header, greeting, footer).
 */
export function renderCredentialsEmail(
	params: CredentialsEmailParams,
	customConfig?: EmailTemplateConfig
): {
	subject: string;
	html: string;
	text: string;
} {
	const config = customConfig || params.templateConfig || DEFAULT_EMAIL_TEMPLATE;
	const orgName = resolveOrgName(params.orgName);
	const username = params.username || params.email.split('@')[0];
	const email = params.email;
	const temporaryPassword = params.password;

	const subject = (params.subject || config.subjectTemplate || 'Your {orgName} account has been created')
		.replace(/\{orgName\}/g, orgName)
		.replace(/\{username\}/g, username);

	const headerTitle = (config.headerTitle || 'Your {orgName} account has been created')
		.replace(/\{orgName\}/g, orgName)
		.replace(/\{username\}/g, username);

	const buttonText = (config.buttonText || 'Log in to {orgName}')
		.replace(/\{orgName\}/g, orgName)
		.replace(/\{username\}/g, username);

	const greeting = config.greetingText || 'Hello,';
	const bodyText = config.bodyText || 'Your account has been created.';
	const instructions =
		config.instructionsText ||
		'Please log in using these credentials and change your temporary password after logging in.';
	const footerNote =
		config.footerNote ||
		'This is an automated administrative notification. Please keep your temporary credentials secure.';
	const accentColor = config.accentColor || '#6366f1';

	const defaultLoginUrl = () => {
		if (config.portalUrl?.trim() && !config.portalUrl.includes('yout-hs-ceo')) {
			return config.portalUrl.trim();
		}
		if (process.env.MEMBER_PORTAL_URL?.trim()) {
			return process.env.MEMBER_PORTAL_URL.trim();
		}
		return 'https://youths-member.vercel.app/';
	};

	const loginUrl = params.loginUrl || defaultLoginUrl();

	const escapedOrg = escapeHtml(orgName);
	const escapedUsername = escapeHtml(username);
	const escapedEmail = escapeHtml(email);
	const escapedPassword = escapeHtml(temporaryPassword);
	const escapedLoginUrl = escapeHtml(loginUrl);
	const escapedHeaderTitle = escapeHtml(headerTitle);
	const escapedGreeting = escapeHtml(greeting);
	const escapedBodyText = escapeHtml(bodyText);
	const escapedInstructions = escapeHtml(instructions);
	const escapedButtonText = escapeHtml(buttonText);
	const escapedFooterNote = escapeHtml(footerNote);
	const escapedAccent = escapeHtml(accentColor);
	const escapedLogoUrl = config.logoUrl ? escapeHtml(config.logoUrl) : '';

	const text = [
		greeting,
		``,
		bodyText,
		``,
		`Username: ${username}`,
		`Email: ${email}`,
		`Temporary password: ${temporaryPassword}`,
		`Login page: ${loginUrl}`,
		``,
		instructions,
		``,
		`Regards,`,
		`${orgName}`
	].join('\n');

	const logoHtml =
		config.showLogo && escapedLogoUrl
			? `<div style="text-align:center;margin-bottom:20px;"><img src="${escapedLogoUrl}" alt="${escapedOrg}" style="max-height:48px;max-width:200px;border-radius:8px;" /></div>`
			: '';

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;-webkit-font-smoothing:antialiased;">
  <!-- Anti-spam hidden preview snippet -->
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Official account credentials and onboarding instructions for ${escapedOrg}.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);">
          <tr>
            <td style="height:6px;background:${escapedAccent};"></td>
          </tr>
          <tr>
            <td style="padding:36px 36px 28px 36px;">
              ${logoHtml}
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.35;">
                ${escapedHeaderTitle}
              </h1>

              <p style="margin:0 0 8px 0;font-size:15px;color:#cbd5e1;line-height:1.6;">
                ${escapedGreeting}
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;color:#cbd5e1;line-height:1.6;">
                ${escapedBodyText}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:0 0 16px 0;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:6px;">Username</div>
                    <div style="font-size:15px;font-weight:600;color:#ffffff;">${escapedUsername}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px 0;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:6px;">Email</div>
                    <div style="font-size:15px;font-weight:600;color:#60a5fa;">
                      <a href="mailto:${escapedEmail}" style="color:#60a5fa;text-decoration:none;">${escapedEmail}</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px 0;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:6px;">Temporary password</div>
                    <div>
                      <code style="display:inline-block;background-color:#1e293b;border:1px solid #475569;padding:8px 14px;border-radius:8px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-size:16px;font-weight:700;color:#fbbf24;letter-spacing:0.05em;">${escapedPassword}</code>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0 0 0;border-top:1px solid #334155;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:6px;">Login page</div>
                    <div>
                      <a href="${escapedLoginUrl}" target="_blank" rel="noopener noreferrer" style="font-size:14px;font-weight:600;color:#38bdf8;text-decoration:underline;word-break:break-all;">${escapedLoginUrl}</a>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px 0;font-size:14px;color:#cbd5e1;line-height:1.6;">
                ${escapedInstructions}
              </p>

              <div style="margin-bottom:28px;">
                <a href="${escapedLoginUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:${escapedAccent};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;">
                  ${escapedButtonText}
                </a>
              </div>

              <div style="border-top:1px solid #334155;padding-top:20px;font-size:14px;color:#94a3b8;line-height:1.6;">
                <p style="margin:0 0 4px 0;">Regards,</p>
                <p style="margin:0;font-weight:700;color:#ffffff;">${escapedOrg}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f172a;padding:16px 36px;border-top:1px solid #334155;font-size:11px;color:#64748b;text-align:center;">
              ${escapedFooterNote}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

	return { subject, html, text };
}

/**
 * Builds custom HTML and text for general member communications and announcements.
 */
export function renderBroadcastEmail(params: {
	to: string;
	subject: string;
	title?: string;
	message: string;
	recipientName?: string;
	orgName?: string;
	actionUrl?: string;
	actionText?: string;
	templateConfig?: EmailTemplateConfig;
}): { subject: string; html: string; text: string } {
	const config = params.templateConfig || DEFAULT_EMAIL_TEMPLATE;
	const orgName = resolveOrgName(params.orgName);
	const escapedOrg = escapeHtml(orgName);
	const escapedTitle = escapeHtml(params.title || params.subject);
	const escapedSubject = escapeHtml(params.subject);
	const escapedMessage = escapeHtml(params.message).replace(/\n/g, '<br/>');
	const escapedGreeting = escapeHtml(config.greetingText || 'Hello');
	const recipientDisplay = params.recipientName ? escapeHtml(params.recipientName) : '';
	const accentColor = escapeHtml(config.accentColor || '#6366f1');
	const logoHtml =
		config.showLogo && config.logoUrl
			? `<div style="text-align:center;margin-bottom:20px;"><img src="${escapeHtml(config.logoUrl)}" alt="${escapedOrg}" style="max-height:48px;max-width:200px;border-radius:8px;" /></div>`
			: '';

	const buttonHtml =
		params.actionUrl && params.actionText
			? `<div style="margin:24px 0;"><a href="${escapeHtml(params.actionUrl)}" style="display:inline-block;background-color:${accentColor};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;">${escapeHtml(params.actionText)}</a></div>`
			: '';

	const text = [
		recipientDisplay ? `${config.greetingText} ${recipientDisplay},` : `${config.greetingText},`,
		``,
		params.message,
		``,
		params.actionUrl ? `${params.actionText || 'Link'}: ${params.actionUrl}` : '',
		``,
		`Regards,`,
		`${orgName}`
	]
		.filter(Boolean)
		.join('\n');

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedSubject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);">
          <tr>
            <td style="height:6px;background:${accentColor};"></td>
          </tr>
          <tr>
            <td style="padding:36px 36px 28px 36px;">
              ${logoHtml}
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.35;">
                ${escapedTitle}
              </h1>

              <p style="margin:0 0 16px 0;font-size:15px;color:#cbd5e1;line-height:1.6;">
                ${escapedGreeting}${recipientDisplay ? ' ' + recipientDisplay : ''},
              </p>

              <div style="margin:0 0 24px 0;font-size:15px;color:#cbd5e1;line-height:1.7;">
                ${escapedMessage}
              </div>

              ${buttonHtml}

              <div style="border-top:1px solid #334155;padding-top:20px;font-size:14px;color:#94a3b8;line-height:1.6;">
                <p style="margin:0 0 4px 0;">Regards,</p>
                <p style="margin:0;font-weight:700;color:#ffffff;">${escapedOrg}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f172a;padding:16px 36px;border-top:1px solid #334155;font-size:11px;color:#64748b;text-align:center;">
              ${escapeHtml(config.footerNote || 'YOUTHs Official Communication')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

	return { subject: params.subject, html, text };
}

/**
 * Sends an email via Gmail SMTP (Nodemailer) if configured, or falls back to Resend SDK.
 * Never throws — returns { sent: false, error } on failure so callers can handle gracefully.
 */
export async function sendEmail(params: {
	to: string;
	subject: string;
	html: string;
	text: string;
}): Promise<SendResult> {
	const recipient = process.env.RESEND_TEST_OVERRIDE_EMAIL?.trim() || params.to;

	// 1. Gmail SMTP (Nodemailer) — Sends directly from your personal Gmail to ANY recipient without requiring a custom domain
	const rawUser = (process.env.SMTP_USER || process.env.GMAIL_USER)?.trim();
	const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD)?.trim();

	if (rawUser && rawPass) {
		const smtpUser = rawUser.replace(/^["']|["']$/g, '').trim();
		const cleanedPass = rawPass.replace(/^["']|["']$/g, '').replace(/\s+/g, '');
		const rawFrom = process.env.SMTP_FROM?.trim();
		const from = rawFrom ? rawFrom.replace(/^["']|["']$/g, '').trim() : `YOUTHs <${smtpUser}>`;

		const sendWithPort = async (p: number, s: boolean) => {
			const transporter = nodemailer.createTransport({
				host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
				port: p,
				secure: s,
				auth: {
					user: smtpUser,
					pass: cleanedPass
				}
			});
			await transporter.sendMail({
				from,
				to: recipient,
				replyTo: smtpUser,
				subject: params.subject,
				html: params.html,
				text: params.text,
				headers: {
					'X-Priority': '3',
					'X-Mailer': 'YOUTHs Communication Center'
				}
			});
		};

		try {
			// Try port 587 first (STARTTLS, standard port that bypasses ISP port 465 blocks)
			try {
				await sendWithPort(587, false);
				return { sent: true };
			} catch (firstErr: any) {
				// If port 587 has a connection network issue, fallback to port 465
				if (firstErr?.code === 'ECONNREFUSED' || firstErr?.code === 'ETIMEDOUT') {
					await sendWithPort(465, true);
					return { sent: true };
				}
				throw firstErr;
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error('[email] Failed to send via Gmail SMTP:', message);
			const isBadCredentials = message.includes('535') || message.includes('BadCredentials');
			const friendlyError = isBadCredentials
				? 'Invalid login (535 BadCredentials): Google rejected your Gmail credentials. Please ensure 2-Step Verification is enabled on your Google account and you are using a 16-character Google App Password (not your regular Gmail password).'
				: message;
			return { sent: false, error: friendlyError };
		}
	}

	// 2. Fallback to Resend SDK if RESEND_API_KEY is configured
	const apiKey = process.env.RESEND_API_KEY?.trim();
	const from = process.env.RESEND_FROM_EMAIL?.trim() || 'YOUTHs <onboarding@resend.dev>';

	if (apiKey) {
		try {
			const resend = new Resend(apiKey);
			const replyToEmail = (process.env.SMTP_USER || process.env.GMAIL_USER)?.trim()?.replace(/^["']|["']$/g, '');
			const { error } = await resend.emails.send({
				from,
				to: [recipient],
				replyTo: replyToEmail || undefined,
				subject: params.subject,
				html: params.html,
				text: params.text,
				headers: {
					'X-Priority': '3',
					'X-Mailer': 'YOUTHs Communication Center'
				}
			});

			if (error) {
				console.error('[email] Resend error:', error.message);
				return { sent: false, error: error.message };
			}

			return { sent: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error('[email] Failed to reach Resend:', message);
			return { sent: false, error: message };
		}
	}

	return {
		sent: false,
		error:
			'No email service configured. RESEND_API_KEY is not configured and SMTP credentials (SMTP_USER/SMTP_PASS) are missing.'
	};
}

/**
 * Emails a newly created member their assigned login credentials.
 */
export async function sendAccountCredentialsEmail(
	params: CredentialsEmailParams
): Promise<SendResult> {
	const templateConfig = await getSavedEmailTemplate();
	const { subject, html, text } = renderCredentialsEmail(params, templateConfig);

	return sendEmail({
		to: params.to,
		subject,
		html,
		text
	});
}

/**
 * Sends a custom broadcast email announcement to a recipient.
 */
export async function sendBroadcastEmail(params: {
	to: string;
	subject: string;
	title?: string;
	message: string;
	recipientName?: string;
	orgName?: string;
	actionUrl?: string;
	actionText?: string;
}): Promise<SendResult> {
	const templateConfig = await getSavedEmailTemplate();
	const { subject, html, text } = renderBroadcastEmail({
		...params,
		templateConfig
	});

	return sendEmail({
		to: params.to,
		subject,
		html,
		text
	});
}

/**
 * Dispatches a test verification email to confirm email delivery is working.
 */
export async function sendTestEmail(
	to: string,
	customConfig?: EmailTemplateConfig
): Promise<SendResult> {
	const config = customConfig || (await getSavedEmailTemplate());
	const orgName = resolveOrgName();
	const { subject, html, text } = renderCredentialsEmail(
		{
			to,
			email: to,
			password: 'DemoPassword123!',
			username: 'demo_user',
			orgName,
			subject: `[Test] Email Verification - ${orgName}`
		},
		config
	);

	return sendEmail({
		to,
		subject,
		html,
		text
	});
}

/**
 * Returns current email provider diagnostics and configuration state.
 */
export function getEmailProviderStatus(): {
	configured: boolean;
	provider: 'GMAIL_SMTP' | 'RESEND' | 'NONE';
	fromAddress: string;
	userAddress: string | null;
	resendConfigured: boolean;
	smtpConfigured: boolean;
} {
	const rawUser = (process.env.SMTP_USER || process.env.GMAIL_USER)?.trim();
	const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD)?.trim();
	const apiKey = process.env.RESEND_API_KEY?.trim();

	const smtpConfigured = Boolean(rawUser && rawPass);
	const resendConfigured = Boolean(apiKey);

	if (smtpConfigured) {
		const cleanUser = rawUser!.replace(/^["']|["']$/g, '').trim();
		const from =
			process.env.SMTP_FROM?.trim().replace(/^["']|["']$/g, '') || `YOUTHs <${cleanUser}>`;
		return {
			configured: true,
			provider: 'GMAIL_SMTP',
			fromAddress: from,
			userAddress: cleanUser,
			smtpConfigured: true,
			resendConfigured
		};
	}

	if (resendConfigured) {
		const from =
			process.env.RESEND_FROM_EMAIL?.trim().replace(/^["']|["']$/g, '') ||
			'YOUTHs <onboarding@resend.dev>';
		return {
			configured: true,
			provider: 'RESEND',
			fromAddress: from,
			userAddress: null,
			smtpConfigured: false,
			resendConfigured: true
		};
	}

	return {
		configured: false,
		provider: 'NONE',
		fromAddress: 'Not configured',
		userAddress: null,
		smtpConfigured: false,
		resendConfigured: false
	};
}
