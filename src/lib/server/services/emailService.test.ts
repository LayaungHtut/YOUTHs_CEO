import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	renderCredentialsEmail,
	resolveOrgName,
	sendAccountCredentialsEmail,
	sendEmail
} from './emailService';

describe('Email Service - Credentials Template', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
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

	it('renders credentials email matching the user requested template', () => {
		const result = renderCredentialsEmail({
			to: 'layaunghtut5@gmail.com',
			email: 'layaunghtut@aiesec.net',
			password: 'NTMTVEBC',
			orgName: 'AIESEC'
		});

		expect(result.subject).toBe('Welcome to AIESEC! Here’s your professional email');

		// Check text content structure
		expect(result.text).toContain('Welcome to AIESEC! Here’s your professional email');
		expect(result.text).toContain('Email\nlayaunghtut@aiesec.net');
		expect(result.text).toContain('Password\nNTMTVEBC');
		expect(result.text).toContain('Next Steps');
		expect(result.text).toContain('Go to [Gmail Login]');
		expect(result.text).toContain('Use the credentials above to login');
		expect(result.text).toContain('Create your own password');
		expect(result.text).toContain('Have fun with your brand new AIESEC email,\nAll the best!');

		// Check HTML content
		expect(result.html).toContain('Welcome to AIESEC! Here’s your professional email');
		expect(result.html).toContain('layaunghtut@aiesec.net');
		expect(result.html).toContain('NTMTVEBC');
		expect(result.html).toContain('[Gmail Login]');
		expect(result.html).toContain('https://mail.google.com');
		expect(result.html).toContain('Have fun with your brand new AIESEC email,');
		expect(result.html).toContain('All the best!');
	});

	it('includes username if provided', () => {
		const result = renderCredentialsEmail({
			to: 'sumon@gmail.com',
			username: 'sumon_dev',
			email: 'sumon@youths.org',
			password: 'TempPassword123',
			orgName: 'YOUTHs'
		});

		expect(result.subject).toBe('Welcome to YOUTHs! Here’s your professional email');
		expect(result.text).toContain('Username\nsumon_dev');
		expect(result.html).toContain('sumon_dev');
	});

	it('gracefully fails when RESEND_API_KEY is missing', async () => {
		delete process.env.RESEND_API_KEY;

		const result = await sendAccountCredentialsEmail({
			to: 'user@example.com',
			email: 'user@youths.org',
			password: 'Password123'
		});

		expect(result.sent).toBe(false);
		expect(result.error).toContain('RESEND_API_KEY is not configured');
	});

	it('sends email successfully via Resend API mock', async () => {
		process.env.RESEND_API_KEY = 're_test_key_123';
		process.env.RESEND_FROM_EMAIL = 'YOUTHs <onboarding@resend.dev>';

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ id: 'email_123' })
		});
		vi.stubGlobal('fetch', fetchMock);

		const result = await sendAccountCredentialsEmail({
			to: 'user@example.com',
			email: 'user@youths.org',
			password: 'Password123'
		});

		expect(result.sent).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.resend.com/emails');
		expect(options.method).toBe('POST');
		const body = JSON.parse(options.body);
		expect(body.to).toEqual(['user@example.com']);
		expect(body.subject).toBe('Welcome to YOUTHs! Here’s your professional email');
		expect(body.text).toContain('Password\nPassword123');
	});
});

