import '../env';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export interface SendResult {
	sent: boolean;
	error?: string;
}

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
 * Builds the HTML and plain-text email content matching the required template:
 *
 * Subject:
 * Your YOUTHs account has been created
 *
 * Body:
 * Hello,
 *
 * Your account has been created.
 *
 * Username: {username}
 * Email: {gmail}
 * Temporary password: {temporaryPassword}
 *
 * Please log in using these credentials and change your temporary password after logging in.
 *
 * Regards,
 * YOUTHs
 */
export function renderCredentialsEmail(params: CredentialsEmailParams): {
	subject: string;
	html: string;
	text: string;
} {
	const orgName = resolveOrgName(params.orgName);
	const subject = params.subject || `Your ${orgName} account has been created`;
	const username = params.username || params.email.split('@')[0];
	const email = params.email;
	const temporaryPassword = params.password;
	const loginUrl =
		params.loginUrl ||
		(process.env.ORIGIN
			? `${process.env.ORIGIN.replace(/\/$/, '')}/login`
			: 'https://mail.google.com');

	const escapedOrg = escapeHtml(orgName);
	const escapedUsername = escapeHtml(username);
	const escapedEmail = escapeHtml(email);
	const escapedPassword = escapeHtml(temporaryPassword);
	const escapedLoginUrl = escapeHtml(loginUrl);

	const text = [
		`Hello,`,
		``,
		`Your account has been created.`,
		``,
		`Username: ${username}`,
		`Email: ${email}`,
		`Temporary password: ${temporaryPassword}`,
		``,
		`Please log in using these credentials and change your temporary password after logging in.`,
		``,
		`Regards,`,
		`${orgName}`
	].join('\n');

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);">
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,#4f46e5,#7c3aed,#2563eb);"></td>
          </tr>
          <tr>
            <td style="padding:36px 36px 28px 36px;">
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.35;">
                Your ${escapedOrg} account has been created
              </h1>

              <p style="margin:0 0 8px 0;font-size:15px;color:#cbd5e1;line-height:1.6;">
                Hello,
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;color:#cbd5e1;line-height:1.6;">
                Your account has been created.
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
                  <td style="padding:0;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:6px;">Temporary password</div>
                    <div>
                      <code style="display:inline-block;background-color:#1e293b;border:1px solid #475569;padding:8px 14px;border-radius:8px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-size:16px;font-weight:700;color:#fbbf24;letter-spacing:0.05em;">${escapedPassword}</code>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px 0;font-size:14px;color:#cbd5e1;line-height:1.6;">
                Please log in using these credentials and change your temporary password after logging in.
              </p>

              <div style="margin-bottom:28px;">
                <a href="${escapedLoginUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;">
                  Log in to ${escapedOrg}
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
              This is an automated administrative notification. Please keep your temporary credentials secure.
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
	const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER)?.trim();
	const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD)?.trim();

	if (smtpUser && smtpPass) {
		const cleanedPass = smtpPass.replace(/\s+/g, '');
		const from = process.env.SMTP_FROM?.trim() || `YOUTHs <${smtpUser}>`;

		try {
			const transporter = nodemailer.createTransport({
				host: 'smtp.gmail.com',
				port: 465,
				secure: true,
				auth: {
					user: smtpUser,
					pass: cleanedPass
				}
			});

			await transporter.sendMail({
				from,
				to: recipient,
				subject: params.subject,
				html: params.html,
				text: params.text
			});

			return { sent: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error('[email] Failed to send via Gmail SMTP:', message);
			return { sent: false, error: message };
		}
	}

	// 2. Fallback to Resend SDK if RESEND_API_KEY is configured
	const apiKey = process.env.RESEND_API_KEY?.trim();
	const from = process.env.RESEND_FROM_EMAIL?.trim() || 'YOUTHs <onboarding@resend.dev>';

	if (apiKey) {
		try {
			const resend = new Resend(apiKey);
			const { error } = await resend.emails.send({
				from,
				to: [recipient],
				subject: params.subject,
				html: params.html,
				text: params.text
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
		error: 'No email service configured. RESEND_API_KEY is not configured and SMTP credentials (SMTP_USER/SMTP_PASS) are missing.'
	};
}

/**
 * Emails a newly created member their assigned login credentials.
 */
export async function sendAccountCredentialsEmail(
	params: CredentialsEmailParams
): Promise<SendResult> {
	const { subject, html, text } = renderCredentialsEmail(params);

	return sendEmail({
		to: params.to,
		subject,
		html,
		text
	});
}
