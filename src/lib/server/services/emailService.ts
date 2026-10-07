import '../env';

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
 * Builds the HTML and plain-text email content matching the organization onboarding template:
 *
 * Welcome to {Org}! Here’s your professional email
 * Email
 * {email}
 * Password
 * {password}
 * Next Steps
 * Go to [Gmail Login]
 * Use the credentials above to login
 * Create your own password
 * Have fun with your brand new {Org} email,
 * All the best!
 */
export function renderCredentialsEmail(params: CredentialsEmailParams): {
	subject: string;
	html: string;
	text: string;
} {
	const orgName = resolveOrgName(params.orgName);
	const loginUrl = params.loginUrl || process.env.GMAIL_LOGIN_URL || 'https://mail.google.com';
	const subject = params.subject || `Welcome to ${orgName}! Here’s your professional email`;

	const escapedOrg = escapeHtml(orgName);
	const escapedEmail = escapeHtml(params.email);
	const escapedPassword = escapeHtml(params.password);
	const escapedLoginUrl = escapeHtml(loginUrl);
	const escapedUsername = params.username ? escapeHtml(params.username) : '';

	const usernameRowHtml = params.username
		? `
                <tr>
                  <td style="padding:0 0 16px 0;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:6px;">Username</div>
                    <div style="font-size:15px;font-weight:600;color:#1e293b;">${escapedUsername}</div>
                  </td>
                </tr>`
		: '';

	const usernameText = params.username ? `\nUsername\n${params.username}\n` : '';

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,#4f46e5,#7c3aed,#2563eb);"></td>
          </tr>
          <tr>
            <td style="padding:36px 36px 28px 36px;">
              <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.35;">
                Welcome to ${escapedOrg}! Here’s your professional email
              </h1>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:28px;">
                <tr>
                  <td style="padding:0 0 16px 0;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:6px;">Email</div>
                    <div style="font-size:15px;font-weight:600;color:#1e293b;">
                      <a href="mailto:${escapedEmail}" style="color:#2563eb;text-decoration:none;">${escapedEmail}</a>
                    </div>
                  </td>
                </tr>${usernameRowHtml}
                <tr>
                  <td style="padding:0;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:6px;">Password</div>
                    <div>
                      <code style="display:inline-block;background-color:#ffffff;border:1px solid #cbd5e1;padding:8px 14px;border-radius:6px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-size:16px;font-weight:700;color:#0f172a;letter-spacing:0.05em;">${escapedPassword}</code>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="margin-bottom:28px;">
                <h2 style="margin:0 0 14px 0;font-size:16px;font-weight:700;color:#0f172a;">Next Steps</h2>
                <ol style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.8;">
                  <li style="margin-bottom:8px;">
                    Go to 
                    <a href="${escapedLoginUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600;text-decoration:underline;">
                      [Gmail Login]
                    </a>
                  </li>
                  <li style="margin-bottom:6px;">Use the credentials above to login</li>
                  <li style="margin-bottom:6px;">Create your own password</li>
                </ol>
              </div>

              <div style="border-top:1px solid #f1f5f9;padding-top:20px;font-size:14px;color:#334155;line-height:1.6;">
                <p style="margin:0 0 6px 0;">Have fun with your brand new ${escapedOrg} email,</p>
                <p style="margin:0;font-weight:700;color:#0f172a;">All the best!</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
              This is an automated administrative notification. Please keep your temporary credentials secure.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

	const text = [
		`Welcome to ${orgName}! Here’s your professional email`,
		``,
		`Email`,
		params.email,
		usernameText ? usernameText.trim() : null,
		``,
		`Password`,
		params.password,
		``,
		`Next Steps`,
		`Go to [Gmail Login] (${loginUrl})`,
		`Use the credentials above to login`,
		`Create your own password`,
		``,
		`Have fun with your brand new ${orgName} email,`,
		`All the best!`
	]
		.filter((line): line is string => line !== null)
		.join('\n');

	return { subject, html, text };
}

/**
 * Sends an email via the Resend REST API (https://resend.com/docs/api-reference/emails/send-email).
 * Never throws — returns { sent: false, error } on failure so callers can continue.
 */
export async function sendEmail(params: {
	to: string;
	subject: string;
	html: string;
	text: string;
}): Promise<SendResult> {
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.RESEND_FROM_EMAIL || 'YOUTHs <onboarding@resend.dev>';

	if (!apiKey) {
		return { sent: false, error: 'RESEND_API_KEY is not configured.' };
	}

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from,
				to: [params.to],
				subject: params.subject,
				html: params.html,
				text: params.text
			})
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}) as Record<string, unknown>);
			const message = (body as { message?: string }).message || `HTTP ${res.status}`;
			console.error('[email] Resend error:', message);
			return { sent: false, error: message };
		}

		return { sent: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[email] Failed to reach Resend:', message);
		return { sent: false, error: message };
	}
}

/**
 * Emails a newly created member/head their assigned login credentials.
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
