import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import {
	getWeeklyCycleDates,
	generateDeterministicAssignments,
	publishWeeklyDistribution,
	getOrCreateCurrentWeek
} from './aiTaskDistributionService';

describe('AI Weekly Task Distribution Service', () => {
	beforeEach(() => {
		db.resetForTesting();
	});

	it('computes weekly cycle dates starting Monday and ending Saturday', () => {
		const dates = getWeeklyCycleDates();
		expect(dates.weekStart.getDay()).toBe(1); // Monday
		expect(dates.weekEnd.getDay()).toBe(6); // Saturday
		expect(dates.weekEnd.getTime()).toBeGreaterThan(dates.weekStart.getTime());
	});

	it('generates deterministic assignments matching departments', async () => {
		// Create test members across departments
		const user1 = await db.createUser({
			fullName: 'Dev Lead',
			username: 'devlead',
			email: 'dev@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			departmentId: 'dept-software-dev',
			accountStatus: 'ACTIVE'
		});

		const user2 = await db.createUser({
			fullName: 'Design Specialist',
			username: 'designer',
			email: 'design@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			departmentId: 'dept-graphic-design',
			accountStatus: 'ACTIVE'
		});

		const templates = await db.getTaskTemplates();
		const proposal = await generateDeterministicAssignments([user1, user2], templates, 'week-test-1');

		expect(proposal.assignments.length).toBe(2);
		expect(proposal.unassignedMembers.length).toBe(0);

		const devAssignment = proposal.assignments.find((a) => a.memberId === user1.id);
		expect(devAssignment).toBeDefined();
		expect(devAssignment?.departmentId).toBe('dept-software-dev');

		const designAssignment = proposal.assignments.find((a) => a.memberId === user2.id);
		expect(designAssignment).toBeDefined();
		expect(designAssignment?.departmentId).toBe('dept-graphic-design');
	});

	it('publishes weekly distribution to authoritative tasks with notifications', async () => {
		const user = await db.createUser({
			fullName: 'Alex River',
			username: 'ariver',
			email: 'alex@youths.org',
			passwordHash: 'hash',
			role: 'MEMBER',
			departmentId: 'dept-software-dev',
			accountStatus: 'ACTIVE'
		});

		const week = await getOrCreateCurrentWeek('ceo-1');
		const templates = await db.getTaskTemplates();
		const proposal = await generateDeterministicAssignments([user], templates, week.id);

		await db.updateTaskWeek(week.id, {
			distributionStatus: 'PROPOSED',
			configurationSnapshot: JSON.stringify(proposal)
		});

		const published = await publishWeeklyDistribution(week.id, 'ceo-1');
		expect(published.length).toBe(1);
		expect(published[0].assignedTo).toBe(user.id);
		expect(published[0].source).toBe('AI_WEEKLY');

		const notifs = await db.getNotificationsForUser(user.id);
		expect(notifs.length).toBeGreaterThan(0);
		expect(notifs[0].type).toBe('TASK_ASSIGNED');
	});
});
