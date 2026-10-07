import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { AuditActions } from './auditService';

describe('Member Account Deletion & Cascading Cleanups', () => {
	beforeEach(() => {
		db.resetForTesting();
	});

	it('successfully removes a member account and all associated resources', async () => {
		// 1. Create a CEO user
		const ceo = await db.createUser({
			fullName: 'CEO Admin',
			username: 'ceo_admin',
			email: 'ceo@youths.org',
			passwordHash: 'hash',
			role: 'CEO',
			accountStatus: 'ACTIVE'
		});

		// 2. Create a Department
		const departments = await db.getDepartments();
		const deptId = departments[0]?.id || 'tech';

		// 3. Create a member who is also department head
		const member = await db.createUser({
			fullName: 'Test Member',
			username: 'test_member',
			email: 'member@youths.org',
			passwordHash: 'hash',
			role: 'HEAD',
			departmentId: deptId,
			accountStatus: 'ACTIVE'
		});

		// Assign head to department
		await db.updateDepartment(deptId, { headUserId: member.id });
		const updatedDept = await db.getDepartmentById(deptId);
		expect(updatedDept?.headUserId).toBe(member.id);

		// Create session for member
		const session = await db.createSession({
			id: 'session-member-1',
			userId: member.id,
			expiresAt: new Date(Date.now() + 3600000)
		});
		expect(await db.getSession(session.id)).not.toBeNull();

		// Create connection for member
		await db.upsertConnection({
			userId: member.id,
			connectionType: 'REST_SYNC',
			integrationStatus: 'CONNECTED'
		});
		expect(await db.getConnectionByUserId(member.id)).not.toBeNull();

		// Create a task assigned to member
		const assignedTask = await db.createTask({
			title: 'Task Assigned To Member',
			description: 'Do this work',
			createdBy: ceo.id,
			assignedTo: member.id,
			departmentId: deptId,
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000)
		});

		// Create a task created by member (assigned to ceo)
		const createdTask = await db.createTask({
			title: 'Task Created By Member',
			description: 'Work created by head',
			createdBy: member.id,
			assignedTo: ceo.id,
			departmentId: deptId,
			startDate: new Date(),
			deadline: new Date(Date.now() + 86400000)
		});

		// Create a task event by member
		await db.createTaskEvent({
			taskId: createdTask.id,
			actorId: member.id,
			actorRole: 'HEAD',
			eventType: 'CREATED',
			source: 'HEAD'
		});

		// 4. Delete the member with reassignment to CEO
		const deleted = await db.deleteUser(member.id, ceo.id);
		expect(deleted).toBe(true);

		// 5. Verify member is removed
		expect(await db.getUserById(member.id)).toBeNull();

		// 6. Verify session was removed
		expect(await db.getSession(session.id)).toBeNull();

		// 7. Verify connection was removed
		expect(await db.getConnectionByUserId(member.id)).toBeNull();

		// 8. Verify department head was cleared to null
		const deptAfter = await db.getDepartmentById(deptId);
		expect(deptAfter?.headUserId).toBeNull();

		// 9. Verify task assigned to member was deleted
		expect(await db.getTaskById(assignedTask.id)).toBeNull();

		// 10. Verify task created by member was reassigned to CEO
		const taskAfter = await db.getTaskById(createdTask.id);
		expect(taskAfter).not.toBeNull();
		expect(taskAfter?.createdBy).toBe(ceo.id);

		// 11. Verify task events actorId was reassigned to CEO
		const events = await db.getTaskEvents(createdTask.id);
		expect(events.length).toBeGreaterThan(0);
		expect(events[0].actorId).toBe(ceo.id);
	});

	it('returns false when attempting to delete a non-existent user', async () => {
		const result = await db.deleteUser('non-existent-id');
		expect(result).toBe(false);
	});

	it('includes USER_DELETE in AuditActions', () => {
		expect(AuditActions.USER_DELETE).toBe('USER_DELETE');
	});
});
