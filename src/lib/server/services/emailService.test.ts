import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	renderCredentialsEmail,
	resolveOrgName,
	sendAccountCredentialsEmail
} from './emailService';

// Mock hoisted functions
const { mockSend, mockNodemailerSend } = vi.hoisted(() => ({
	mockSend: vi.fn(),
	mockNodemailerSend: vi.fn()
}));

vi.mock('resend', () => {
	return {
		Resend: class MockResend {
			emails = {
				send: mockSend
			};
		}
	};
});

vi.mock('nodemailer', () => {
	return {
		default: {
			createTransport: vi.fn().mockReturnValue({
				sendMail: mockNodemailerSend
			})
		}
	};
});

describe('Email Service - Credentials Template, Gmail SMTP & Resend SDK', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
		delete process.env.SMTP_USER;
		delete process.env.SMTP_PASS;
		delete process.env.GMAIL_USER;
		delete process.env.GMAIL_APP_PASSWORD;
		mockSend.mockReset();
		mockNodemailerSend.mockReset();
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.restoreAllMocks();
	});

	it('resolves organization name from params, env, or default', () => {
		expect(resolveOrgName('AIESEC')).toBe('AIESEC');

		process.env.ORGANIZATION_NAME = 'Custom Org';
		expect(resolveOrgName()).toBe('Custom Org');

		delete process.env.ORGANIZATION_NAME;
		process.env.RESEND_FROM_EMAIL = 'AIESEC <no-reply@aiesec.org>';
		expect(resolveOrgName()).toBe('AIESEC');

		delete process.env.RESEND_FROM_EMAIL;
		expect(resolveOrgName()).toBe('YOUTHs');
	});

	it('renders credentials email matching the required template format', () => {
		const result = renderCredentialsEmail({
			to: 'member@gmail.com',
			username: 'member_dev',
			email: 'member@gmail.com',
			password: 'TemporaryPassword123!',
			orgName: 'YOUTHs'
		});

		expect(result.subject).toBe('Your YOUTHs account has been created');

		// Check text content structure matching user's exact specification
		expect(result.text).toBe(
			[
				'Hello,',
				'',
				'Your account has been created.',
				'',
				'Username: member_dev',
				'Email: member@gmail.com',
				'Temporary password: TemporaryPassword123!',
				'Login page: https://youths-member.vercel.app/',
				'',
				'Please log in using these credentials and change your temporary password after logging in.',
				'',
				'Regards,',
				'YOUTHs'
			].join('\n')
		);

		// Check HTML content
		expect(result.html).toContain('Your YOUTHs account has been created');
		expect(result.html).toContain('member_dev');
		expect(result.html).toContain('member@gmail.com');
		expect(result.html).toContain('TemporaryPassword123!');
		expect(result.html).toContain('https://youths-member.vercel.app/');
		expect(result.html).toContain(
			'Please log in using these credentials and change your temporary password after logging in.'
		);
		expect(result.html).toContain('Regards,');
		expect(result.html).toContain('YOUTHs');
	});

	it('gracefully fails when RESEND_API_KEY is missing', async () => {
		delete process.env.RESEND_API_KEY;

		const result = await sendAccountCredentialsEmail({
			to: 'user@gmail.com',
			username: 'user_test',
			email: 'user@gmail.com',
			password: 'Password123!'
		});

		expect(result.sent).toBe(false);
		expect(result.error).toContain('RESEND_API_KEY is not configured');
		expect(mockSend).not.toHaveBeenCalled();
	});

	it('sends email successfully via official Resend SDK', async () => {
		process.env.RESEND_API_KEY = 're_test_key_123';
		process.env.RESEND_FROM_EMAIL = 'YOUTHs <onboarding@resend.dev>';

		mockSend.mockResolvedValue({
			data: { id: 'email_123' },
			error: null
		});

		const result = await sendAccountCredentialsEmail({
			to: 'newuser@gmail.com',
			username: 'newuser',
			email: 'newuser@gmail.com',
			password: 'TempPassword123!'
		});

		expect(result.sent).toBe(true);
		expect(mockSend).toHaveBeenCalledTimes(1);

		const callArgs = mockSend.mock.calls[0][0];
		expect(callArgs.from).toBe('YOUTHs <onboarding@resend.dev>');
		expect(callArgs.to).toEqual(['newuser@gmail.com']);
		expect(callArgs.subject).toBe('Your YOUTHs account has been created');
		expect(callArgs.text).toContain('Username: newuser');
		expect(callArgs.text).toContain('Email: newuser@gmail.com');
		expect(callArgs.text).toContain('Temporary password: TempPassword123!');
	});

	it('handles Resend API error cleanly without throwing', async () => {
		process.env.RESEND_API_KEY = 're_test_key_123';

		mockSend.mockResolvedValue({
			data: null,
			error: {
				message: 'You can only send testing emails to your own email address (dev@resend.dev).',
				name: 'validation_error'
			}
		});

		const result = await sendAccountCredentialsEmail({
			to: 'unverified@gmail.com',
			username: 'unverified',
			email: 'unverified@gmail.com',
			password: 'TempPassword123!'
		});

		expect(result.sent).toBe(false);
		expect(result.error).toContain('You can only send testing emails to your own email address');
	});

	it('sends email successfully via Gmail SMTP (Nodemailer)', async () => {
		process.env.SMTP_USER = 'la.yaung.htut.youths.9@gmail.com';
		process.env.SMTP_PASS = 'abcd efgh ijkl mnop';
		process.env.SMTP_FROM = 'YOUTHs <la.yaung.htut.youths.9@gmail.com>';

		mockNodemailerSend.mockResolvedValue({ messageId: '<test@gmail.com>' });

		const result = await sendAccountCredentialsEmail({
			to: 'Fullbringer932@gmail.com',
			username: 'fullbringer',
			email: 'Fullbringer932@gmail.com',
			password: 'TempPassword123!'
		});

		expect(result.sent).toBe(true);
		expect(mockNodemailerSend).toHaveBeenCalledTimes(1);
		const callArgs = mockNodemailerSend.mock.calls[0][0];
		expect(callArgs.from).toBe('YOUTHs <la.yaung.htut.youths.9@gmail.com>');
		expect(callArgs.to).toBe('Fullbringer932@gmail.com');
		expect(callArgs.subject).toBe('Your YOUTHs account has been created');
		expect(callArgs.text).toContain('Username: fullbringer');
		expect(callArgs.text).toContain('Email: Fullbringer932@gmail.com');
	});

	it('handles Gmail SMTP failure cleanly without throwing', async () => {
		process.env.SMTP_USER = 'la.yaung.htut.youths.9@gmail.com';
		process.env.SMTP_PASS = 'wrongpassword';

		mockNodemailerSend.mockRejectedValue(new Error('Invalid login: 535-5.7.8 Username and Password not accepted'));

		const result = await sendAccountCredentialsEmail({
			to: 'Fullbringer932@gmail.com',
			username: 'fullbringer',
			email: 'Fullbringer932@gmail.com',
			password: 'TempPassword123!'
		});

		expect(result.sent).toBe(false);
		expect(result.error).toContain('Invalid login');
	});

	it('renders custom email template with custom colors, titles and branding', () => {
		const customConfig = {
			subjectTemplate: 'Welcome {username} to {orgName} Hub',
			headerTitle: 'Official Onboarding - {orgName}',
			greetingText: 'Dear Executive Leader,',
			bodyText: 'We are delighted to welcome you aboard.',
			instructionsText: 'First login requires password rotation.',
			footerNote: 'Confidential corporate notice.',
			accentColor: '#10b981',
			logoUrl: 'https://example.com/brand-logo.png',
			showLogo: true,
			buttonText: 'Access {orgName} Portal',
			portalUrl: 'https://app.youths.org'
		};

		const { subject, html, text } = renderCredentialsEmail(
			{
				to: 'director@youths.org',
				email: 'director@youths.org',
				username: 'director',
				password: 'SuperSecret123!',
				orgName: 'YOUTHs'
			},
			customConfig
		);

		expect(subject).toBe('Welcome director to YOUTHs Hub');
		expect(html).toContain('Official Onboarding - YOUTHs');
		expect(html).toContain('Dear Executive Leader,');
		expect(html).toContain('We are delighted to welcome you aboard.');
		expect(html).toContain('First login requires password rotation.');
		expect(html).toContain('#10b981');
		expect(html).toContain('https://example.com/brand-logo.png');
		expect(html).toContain('Access YOUTHs Portal');
		expect(html).toContain('Confidential corporate notice.');

		expect(text).toContain('Dear Executive Leader,');
		expect(text).toContain('SuperSecret123!');
	});
});

