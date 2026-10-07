import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, and, or, sql, desc, asc, inArray, gte, lte } from 'drizzle-orm';
import * as schema from './schema';
import type {
	Department,
	NewDepartment,
	User,
	NewUser,
	Session,
	NewSession,
	MemberDatabaseConnection,
	NewMemberDatabaseConnection,
	Task,
	NewTask,
	TaskWeek,
	NewTaskWeek,
	TaskTemplate,
	NewTaskTemplate,
	TaskEvent,
	NewTaskEvent,
	MemberProgressSnapshot,
	NewMemberProgressSnapshot,
	PointsTransaction,
	NewPointsTransaction,
	Achievement,
	NewAchievement,
	MemberAchievement,
	Conversation,
	Message,
	NewMessage,
	MessageReadReceipt,
	Notification,
	NewNotification,
	AuditLog,
	NewAuditLog,
	OrgSetting
} from './types';
import { DEFAULT_ORG_SETTINGS, INITIAL_DEPARTMENTS, INITIAL_ACHIEVEMENTS, INITIAL_TASK_TEMPLATES } from './seed-data';

export class PostgresStore {
	private drizzle: NeonHttpDatabase<typeof schema>;
	private initialized = false;

	constructor(databaseUrl: string) {
		const client = neon(databaseUrl);
		this.drizzle = drizzle(client, { schema });
	}

	public async ensureInitialized(): Promise<void> {
		if (this.initialized) return;

		try {
			// Check if departments exist, if not seed initial departments
			const [deptCount] = await this.drizzle
				.select({ count: sql<number>`count(*)::int` })
				.from(schema.departments);
			if (Number(deptCount?.count || 0) === 0) {
				const now = new Date();
				for (const d of INITIAL_DEPARTMENTS) {
					await this.drizzle.insert(schema.departments).values({
						id: d.id,
						name: d.name,
						description: d.description,
						headUserId: d.headUserId ?? null,
						createdAt: now,
						updatedAt: now
					}).onConflictDoNothing();
				}
			}

			// Check if achievements exist, if not seed
			const [achCount] = await this.drizzle
				.select({ count: sql<number>`count(*)::int` })
				.from(schema.achievements);
			if (Number(achCount?.count || 0) === 0) {
				const now = new Date();
				for (const a of INITIAL_ACHIEVEMENTS) {
					await this.drizzle.insert(schema.achievements).values({
						id: a.id,
						name: a.name,
						description: a.description,
						icon: a.icon || 'award',
						category: a.category || 'TASKS',
						criteria: a.criteria || '{}',
						active: a.active ?? true,
						createdAt: now
					}).onConflictDoNothing();
				}
			}

			// Check if task templates exist, if not seed
			const [tmplCount] = await this.drizzle
				.select({ count: sql<number>`count(*)::int` })
				.from(schema.taskTemplates);
			if (Number(tmplCount?.count || 0) === 0) {
				const now = new Date();
				for (const t of INITIAL_TASK_TEMPLATES) {
					await this.drizzle.insert(schema.taskTemplates).values({
						id: t.id,
						title: t.title,
						description: t.description,
						departmentId: t.departmentId,
						priority: t.priority || 'MEDIUM',
						estimatedEffort: t.estimatedEffort || '4-6 hours',
						requiredSkills: t.requiredSkills || '[]',
						active: t.active ?? true,
						createdAt: now,
						updatedAt: now
					}).onConflictDoNothing();
				}
			}

			// Check if default org settings exist, if not seed
			const [settingsCount] = await this.drizzle
				.select({ count: sql<number>`count(*)::int` })
				.from(schema.orgSettings);
			if (Number(settingsCount?.count || 0) === 0) {
				const now = new Date();
				for (const [key, val] of Object.entries(DEFAULT_ORG_SETTINGS)) {
					await this.drizzle.insert(schema.orgSettings).values({
						key,
						value: JSON.stringify(val),
						updatedAt: now,
						updatedBy: null
					}).onConflictDoNothing();
				}
			}
		} catch (err) {
			console.warn('[PostgresStore] Initialization check warning:', err);
		}

		this.initialized = true;
	}

	public resetForTesting(): void {
		// No-op for safety in production PostgreSQL
	}

	// --- DEPARTMENTS ---
	async getDepartments(): Promise<Department[]> {
		return await this.drizzle.select().from(schema.departments).orderBy(asc(schema.departments.name));
	}

	async getDepartmentById(id: string): Promise<Department | null> {
		const [dept] = await this.drizzle
			.select()
			.from(schema.departments)
			.where(eq(schema.departments.id, id))
			.limit(1);
		return dept || null;
	}

	async getDepartmentByName(name: string): Promise<Department | null> {
		const [dept] = await this.drizzle
			.select()
			.from(schema.departments)
			.where(sql`lower(${schema.departments.name}) = lower(${name})`)
			.limit(1);
		return dept || null;
	}

	async updateDepartment(
		id: string,
		updates: Partial<Pick<Department, 'description' | 'headUserId'>>
	): Promise<Department | null> {
		const [updated] = await this.drizzle
			.update(schema.departments)
			.set({
				...updates,
				updatedAt: new Date()
			})
			.where(eq(schema.departments.id, id))
			.returning();
		return updated || null;
	}

	// --- USERS ---
	async getUserById(id: string): Promise<User | null> {
		const [u] = await this.drizzle
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, id))
			.limit(1);
		return u || null;
	}

	async getUserByEmail(email: string): Promise<User | null> {
		const lower = email.toLowerCase().trim();
		const [u] = await this.drizzle
			.select()
			.from(schema.users)
			.where(sql`lower(${schema.users.email}) = lower(${lower})`)
			.limit(1);
		return u || null;
	}

	async getUserByUsername(username: string): Promise<User | null> {
		const lower = username.toLowerCase().trim();
		const [u] = await this.drizzle
			.select()
			.from(schema.users)
			.where(sql`lower(${schema.users.username}) = lower(${lower})`)
			.limit(1);
		return u || null;
	}

	async getAllUsers(filters?: {
		departmentId?: string;
		role?: 'CEO' | 'HEAD' | 'MEMBER';
		accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
		search?: string;
	}): Promise<User[]> {
		const conditions: any[] = [];
		if (filters?.departmentId) {
			conditions.push(eq(schema.users.departmentId, filters.departmentId));
		}
		if (filters?.role) {
			conditions.push(eq(schema.users.role, filters.role));
		}
		if (filters?.accountStatus) {
			conditions.push(eq(schema.users.accountStatus, filters.accountStatus));
		}
		if (filters?.search) {
			const s = `%${filters.search.toLowerCase()}%`;
			conditions.push(
				or(
					sql`lower(${schema.users.fullName}) LIKE ${s}`,
					sql`lower(${schema.users.username}) LIKE ${s}`,
					sql`lower(${schema.users.email}) LIKE ${s}`
				)
			);
		}

		return await this.drizzle
			.select()
			.from(schema.users)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(schema.users.createdAt));
	}

	async createUser(user: NewUser): Promise<User> {
		const now = new Date();
		const id = user.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.users)
			.values({
				...user,
				id,
				role: user.role || 'MEMBER',
				accountStatus: user.accountStatus || 'ACTIVE',
				avatarUrl: user.avatarUrl || null,
				departmentId: user.departmentId || null,
				lastLoginAt: user.lastLoginAt || null,
				createdAt: user.createdAt || now,
				updatedAt: user.updatedAt || now
			})
			.returning();
		return created;
	}

	async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
		const [updated] = await this.drizzle
			.update(schema.users)
			.set({
				...updates,
				updatedAt: new Date()
			})
			.where(eq(schema.users.id, id))
			.returning();
		return updated || null;
	}

	async countCeoUsers(): Promise<number> {
		const [res] = await this.drizzle
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.users)
			.where(eq(schema.users.role, 'CEO'));
		return Number(res?.count || 0);
	}

	// --- SESSIONS ---
	async createSession(session: NewSession): Promise<Session> {
		const [created] = await this.drizzle
			.insert(schema.sessions)
			.values({
				id: session.id,
				userId: session.userId,
				expiresAt: session.expiresAt,
				createdAt: session.createdAt || new Date()
			})
			.returning();
		return created;
	}

	async getSession(id: string): Promise<Session | null> {
		const [s] = await this.drizzle
			.select()
			.from(schema.sessions)
			.where(eq(schema.sessions.id, id))
			.limit(1);
		if (!s) return null;
		if (s.expiresAt.getTime() < Date.now()) {
			await this.deleteSession(id);
			return null;
		}
		return s;
	}

	async deleteSession(id: string): Promise<void> {
		await this.drizzle.delete(schema.sessions).where(eq(schema.sessions.id, id));
	}

	// --- MEMBER DATABASE CONNECTIONS ---
	async getConnectionByUserId(userId: string): Promise<MemberDatabaseConnection | null> {
		const [c] = await this.drizzle
			.select()
			.from(schema.memberDatabaseConnections)
			.where(eq(schema.memberDatabaseConnections.userId, userId))
			.limit(1);
		return c || null;
	}

	async getConnectionByTokenHash(tokenHash: string): Promise<MemberDatabaseConnection | null> {
		const [c] = await this.drizzle
			.select()
			.from(schema.memberDatabaseConnections)
			.where(eq(schema.memberDatabaseConnections.tokenHash, tokenHash))
			.limit(1);
		return c || null;
	}

	async getAllConnections(): Promise<MemberDatabaseConnection[]> {
		return await this.drizzle.select().from(schema.memberDatabaseConnections);
	}

	async upsertConnection(conn: NewMemberDatabaseConnection): Promise<MemberDatabaseConnection> {
		const now = new Date();
		const existing = await this.getConnectionByUserId(conn.userId);
		const id = existing?.id || conn.id || crypto.randomUUID();

		const [updated] = await this.drizzle
			.insert(schema.memberDatabaseConnections)
			.values({
				...conn,
				id,
				connectionType: conn.connectionType || 'REST_SYNC',
				integrationStatus: conn.integrationStatus || 'PENDING',
				encryptedConnectionSecret: conn.encryptedConnectionSecret || null,
				integrationToken: conn.integrationToken || null,
				tokenHash: conn.tokenHash || null,
				permissions: conn.permissions || '["read:progress"]',
				lastSyncAt: conn.lastSyncAt || null,
				lastSyncError: conn.lastSyncError || null,
				createdAt: existing?.createdAt || now,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: schema.memberDatabaseConnections.userId,
				set: {
					...conn,
					updatedAt: now
				}
			})
			.returning();
		return updated;
	}

	async revokeConnection(userId: string): Promise<boolean> {
		const res = await this.drizzle
			.update(schema.memberDatabaseConnections)
			.set({
				integrationStatus: 'REVOKED',
				tokenHash: null,
				integrationToken: null,
				encryptedConnectionSecret: null,
				updatedAt: new Date()
			})
			.where(eq(schema.memberDatabaseConnections.userId, userId))
			.returning();
		return res.length > 0;
	}

	// --- TASKS ---
	async getTaskById(id: string): Promise<Task | null> {
		const [t] = await this.drizzle
			.select()
			.from(schema.tasks)
			.where(eq(schema.tasks.id, id))
			.limit(1);
		return t || null;
	}

	async getTasks(filters?: {
		departmentId?: string;
		assignedTo?: string;
		createdBy?: string;
		weekId?: string;
		status?: Task['status'];
		source?: Task['source'];
		priority?: Task['priority'];
		search?: string;
	}): Promise<Task[]> {
		const conditions: any[] = [];
		if (filters?.departmentId) conditions.push(eq(schema.tasks.departmentId, filters.departmentId));
		if (filters?.assignedTo) conditions.push(eq(schema.tasks.assignedTo, filters.assignedTo));
		if (filters?.createdBy) conditions.push(eq(schema.tasks.createdBy, filters.createdBy));
		if (filters?.weekId) conditions.push(eq(schema.tasks.weekId, filters.weekId));
		if (filters?.status) conditions.push(eq(schema.tasks.status, filters.status));
		if (filters?.source) conditions.push(eq(schema.tasks.source, filters.source));
		if (filters?.priority) conditions.push(eq(schema.tasks.priority, filters.priority));
		if (filters?.search) {
			const s = `%${filters.search.toLowerCase()}%`;
			conditions.push(
				or(
					sql`lower(${schema.tasks.title}) LIKE ${s}`,
					sql`lower(${schema.tasks.description}) LIKE ${s}`
				)
			);
		}

		return await this.drizzle
			.select()
			.from(schema.tasks)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(schema.tasks.createdAt));
	}

	async createTask(task: NewTask): Promise<Task> {
		const now = new Date();
		const id = task.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.tasks)
			.values({
				...task,
				id,
				source: task.source || 'MANUAL',
				priority: task.priority || 'MEDIUM',
				status: task.status || 'PENDING',
				originalDeadline: task.originalDeadline || task.deadline,
				originalAssigneeId: task.originalAssigneeId || task.assignedTo,
				weekId: task.weekId || null,
				completedAt: task.completedAt || null,
				estimatedEffort: task.estimatedEffort || null,
				pointsReward: task.pointsReward ?? 10,
				createdAt: task.createdAt || now,
				updatedAt: task.updatedAt || now
			})
			.returning();
		return created;
	}

	async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
		const [updated] = await this.drizzle
			.update(schema.tasks)
			.set({
				...updates,
				updatedAt: new Date()
			})
			.where(eq(schema.tasks.id, id))
			.returning();
		return updated || null;
	}

	async deleteTask(id: string): Promise<boolean> {
		const res = await this.drizzle
			.delete(schema.tasks)
			.where(eq(schema.tasks.id, id))
			.returning();
		return res.length > 0;
	}

	// --- TASK EVENTS ---
	async createTaskEvent(event: NewTaskEvent): Promise<TaskEvent> {
		if (event.idempotencyKey) {
			const [existing] = await this.drizzle
				.select()
				.from(schema.taskEvents)
				.where(eq(schema.taskEvents.idempotencyKey, event.idempotencyKey))
				.limit(1);
			if (existing) return existing;
		}

		const id = event.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.taskEvents)
			.values({
				...event,
				id,
				actorRole: event.actorRole || 'CEO',
				reason: event.reason || null,
				source: event.source || 'CEO',
				idempotencyKey: event.idempotencyKey || null,
				oldValue: event.oldValue || null,
				newValue: event.newValue || null,
				createdAt: event.createdAt || new Date()
			})
			.returning();
		return created;
	}

	async getTaskEvents(taskId: string, order: 'asc' | 'desc' = 'asc'): Promise<TaskEvent[]> {
		return await this.drizzle
			.select()
			.from(schema.taskEvents)
			.where(eq(schema.taskEvents.taskId, taskId))
			.orderBy(order === 'asc' ? asc(schema.taskEvents.createdAt) : desc(schema.taskEvents.createdAt));
	}

	async getAllTaskEvents(filters?: {
		memberId?: string;
		departmentId?: string;
		eventType?: string;
		source?: string;
		priority?: string;
		status?: string;
		startDate?: Date;
		endDate?: Date;
		sort?: 'newest' | 'oldest';
	}): Promise<Array<TaskEvent & { task?: Task; actor?: User | null }>> {
		const conditions: any[] = [];
		if (filters?.eventType) conditions.push(eq(schema.taskEvents.eventType, filters.eventType));
		if (filters?.source) conditions.push(eq(schema.taskEvents.source, filters.source));
		if (filters?.startDate) conditions.push(gte(schema.taskEvents.createdAt, filters.startDate));
		if (filters?.endDate) conditions.push(lte(schema.taskEvents.createdAt, filters.endDate));

		const events = await this.drizzle
			.select()
			.from(schema.taskEvents)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(filters?.sort === 'oldest' ? asc(schema.taskEvents.createdAt) : desc(schema.taskEvents.createdAt));

		const taskIds = Array.from(new Set(events.map((e) => e.taskId)));
		const actorIds = Array.from(new Set(events.map((e) => e.actorId)));

		const [tasksList, actorsList] = await Promise.all([
			taskIds.length > 0 ? this.drizzle.select().from(schema.tasks).where(inArray(schema.tasks.id, taskIds)) : [],
			actorIds.length > 0 ? this.drizzle.select().from(schema.users).where(inArray(schema.users.id, actorIds)) : []
		]);

		const taskMap = new Map<string, Task>();
		for (const t of tasksList) taskMap.set(t.id, t);
		const actorMap = new Map<string, User>();
		for (const a of actorsList) actorMap.set(a.id, a);

		const results: Array<TaskEvent & { task?: Task; actor?: User | null }> = [];
		for (const ev of events) {
			const task = taskMap.get(ev.taskId);
			if (filters?.memberId && task?.assignedTo !== filters.memberId) continue;
			if (filters?.departmentId && task?.departmentId !== filters.departmentId) continue;
			if (filters?.priority && task?.priority !== filters.priority) continue;
			if (filters?.status && task?.status !== filters.status) continue;

			results.push({
				...ev,
				task,
				actor: actorMap.get(ev.actorId) || null
			});
		}

		return results;
	}

	// --- TASK WEEKS ---
	async getTaskWeeks(): Promise<TaskWeek[]> {
		return await this.drizzle.select().from(schema.taskWeeks).orderBy(desc(schema.taskWeeks.weekStart));
	}

	async getTaskWeekById(id: string): Promise<TaskWeek | null> {
		const [w] = await this.drizzle
			.select()
			.from(schema.taskWeeks)
			.where(eq(schema.taskWeeks.id, id))
			.limit(1);
		return w || null;
	}

	async getCurrentTaskWeek(): Promise<TaskWeek | null> {
		const now = new Date();
		const [w] = await this.drizzle
			.select()
			.from(schema.taskWeeks)
			.where(and(lte(schema.taskWeeks.weekStart, now), gte(schema.taskWeeks.weekEnd, now)))
			.limit(1);
		return w || null;
	}

	async createTaskWeek(week: NewTaskWeek): Promise<TaskWeek> {
		const id = week.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.taskWeeks)
			.values({
				...week,
				id,
				distributionStatus: week.distributionStatus || 'DRAFT',
				generatedAt: week.generatedAt || null,
				publishedAt: week.publishedAt || null,
				createdBy: week.createdBy || null,
				configurationSnapshot: week.configurationSnapshot || null
			})
			.returning();
		return created;
	}

	async updateTaskWeek(id: string, updates: Partial<TaskWeek>): Promise<TaskWeek | null> {
		const [updated] = await this.drizzle
			.update(schema.taskWeeks)
			.set(updates)
			.where(eq(schema.taskWeeks.id, id))
			.returning();
		return updated || null;
	}

	// --- TASK TEMPLATES ---
	async getTaskTemplates(departmentId?: string): Promise<TaskTemplate[]> {
		return await this.drizzle
			.select()
			.from(schema.taskTemplates)
			.where(departmentId ? eq(schema.taskTemplates.departmentId, departmentId) : undefined)
			.orderBy(asc(schema.taskTemplates.title));
	}

	async createTaskTemplate(tmpl: NewTaskTemplate): Promise<TaskTemplate> {
		const now = new Date();
		const id = tmpl.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.taskTemplates)
			.values({
				...tmpl,
				id,
				estimatedEffort: tmpl.estimatedEffort || '4-6 hours',
				requiredSkills: tmpl.requiredSkills || '[]',
				priority: tmpl.priority || 'MEDIUM',
				active: tmpl.active ?? true,
				createdAt: now,
				updatedAt: now
			})
			.returning();
		return created;
	}

	// --- MEMBER PROGRESS SNAPSHOTS ---
	async getSnapshotsByUserId(userId: string): Promise<MemberProgressSnapshot[]> {
		return await this.drizzle
			.select()
			.from(schema.memberProgressSnapshots)
			.where(eq(schema.memberProgressSnapshots.userId, userId))
			.orderBy(desc(schema.memberProgressSnapshots.lastSyncedAt));
	}

	async getLatestSnapshot(userId: string): Promise<MemberProgressSnapshot | null> {
		const [s] = await this.drizzle
			.select()
			.from(schema.memberProgressSnapshots)
			.where(eq(schema.memberProgressSnapshots.userId, userId))
			.orderBy(desc(schema.memberProgressSnapshots.lastSyncedAt))
			.limit(1);
		return s || null;
	}

	async upsertSnapshot(snapshot: NewMemberProgressSnapshot): Promise<MemberProgressSnapshot> {
		const id = snapshot.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.memberProgressSnapshots)
			.values({
				...snapshot,
				id,
				weekId: snapshot.weekId || null,
				tasksAssigned: snapshot.tasksAssigned ?? 0,
				tasksCompleted: snapshot.tasksCompleted ?? 0,
				tasksOverdue: snapshot.tasksOverdue ?? 0,
				completionPercentage: snapshot.completionPercentage ?? 0,
				pointsBalance: snapshot.pointsBalance ?? 100,
				lastSyncedAt: snapshot.lastSyncedAt || new Date(),
				source: snapshot.source || 'API_SYNC'
			})
			.returning();
		return created;
	}

	// --- POINTS LEDGER ---
	async getLedgerByUserId(userId: string): Promise<PointsTransaction[]> {
		return await this.drizzle
			.select()
			.from(schema.pointsLedger)
			.where(eq(schema.pointsLedger.userId, userId))
			.orderBy(desc(schema.pointsLedger.createdAt));
	}

	async getAllPointsLedgers(): Promise<PointsTransaction[]> {
		return await this.drizzle
			.select()
			.from(schema.pointsLedger)
			.orderBy(desc(schema.pointsLedger.createdAt));
	}

	async getPointsTransactionByIdempotencyKey(key: string): Promise<PointsTransaction | null> {
		const [tx] = await this.drizzle
			.select()
			.from(schema.pointsLedger)
			.where(eq(schema.pointsLedger.idempotencyKey, key))
			.limit(1);
		return tx || null;
	}

	async addPointsTransaction(tx: NewPointsTransaction): Promise<PointsTransaction> {
		const existing = await this.getPointsTransactionByIdempotencyKey(tx.idempotencyKey);
		if (existing) {
			return existing;
		}

		const id = tx.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.pointsLedger)
			.values({
				...tx,
				id,
				taskId: tx.taskId || null,
				createdBy: tx.createdBy || null,
				createdAt: tx.createdAt || new Date()
			})
			.returning();
		return created;
	}

	async getUserPointsBalance(userId: string): Promise<number> {
		const [res] = await this.drizzle
			.select({ sum: sql<number>`coalesce(sum(${schema.pointsLedger.amount}), 0)::int` })
			.from(schema.pointsLedger)
			.where(eq(schema.pointsLedger.userId, userId));
		return Number(res?.sum || 0);
	}

	// --- ACHIEVEMENTS ---
	async getAchievements(onlyActive = true): Promise<Achievement[]> {
		return await this.drizzle
			.select()
			.from(schema.achievements)
			.where(onlyActive ? eq(schema.achievements.active, true) : undefined)
			.orderBy(asc(schema.achievements.name));
	}

	async getAchievementById(id: string): Promise<Achievement | null> {
		const [a] = await this.drizzle
			.select()
			.from(schema.achievements)
			.where(eq(schema.achievements.id, id))
			.limit(1);
		return a || null;
	}

	async createAchievement(achievement: NewAchievement): Promise<Achievement> {
		const id = achievement.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.achievements)
			.values({
				...achievement,
				id,
				icon: achievement.icon || 'award',
				category: achievement.category || 'TASKS',
				criteria: achievement.criteria || '{}',
				active: achievement.active ?? true,
				createdAt: new Date()
			})
			.returning();
		return created;
	}

	async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | null> {
		const [updated] = await this.drizzle
			.update(schema.achievements)
			.set(updates)
			.where(eq(schema.achievements.id, id))
			.returning();
		return updated || null;
	}

	async getMemberAchievements(userId: string): Promise<MemberAchievement[]> {
		return await this.drizzle
			.select()
			.from(schema.memberAchievements)
			.where(eq(schema.memberAchievements.userId, userId))
			.orderBy(desc(schema.memberAchievements.unlockedAt));
	}

	async unlockAchievement(
		userId: string,
		achievementId: string,
		metadata?: string
	): Promise<MemberAchievement | null> {
		const [existing] = await this.drizzle
			.select()
			.from(schema.memberAchievements)
			.where(and(eq(schema.memberAchievements.userId, userId), eq(schema.memberAchievements.achievementId, achievementId)))
			.limit(1);
		if (existing) {
			return existing;
		}

		const id = crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.memberAchievements)
			.values({
				id,
				userId,
				achievementId,
				unlockedAt: new Date(),
				metadata: metadata || null
			})
			.returning();
		return created;
	}

	async getAllMemberAchievements(): Promise<MemberAchievement[]> {
		return await this.drizzle.select().from(schema.memberAchievements);
	}

	// --- CONVERSATIONS & MESSAGING ---
	async getConversationsForUser(userId: string): Promise<Conversation[]> {
		const userParts = await this.drizzle
			.select({ conversationId: schema.conversationParticipants.conversationId })
			.from(schema.conversationParticipants)
			.where(eq(schema.conversationParticipants.userId, userId));
		if (userParts.length === 0) return [];
		const convIds = Array.from(new Set(userParts.map((p) => p.conversationId)));
		return await this.drizzle
			.select()
			.from(schema.conversations)
			.where(inArray(schema.conversations.id, convIds))
			.orderBy(desc(schema.conversations.updatedAt));
	}

	async getConversationById(id: string): Promise<Conversation | null> {
		const [c] = await this.drizzle
			.select()
			.from(schema.conversations)
			.where(eq(schema.conversations.id, id))
			.limit(1);
		return c || null;
	}

	async getDirectConversation(userAId: string, userBId: string): Promise<Conversation | null> {
		const convs = await this.drizzle
			.select({ id: schema.conversations.id })
			.from(schema.conversations)
			.where(eq(schema.conversations.conversationType, 'DIRECT'));

		for (const c of convs) {
			const parts = await this.drizzle
				.select({ userId: schema.conversationParticipants.userId })
				.from(schema.conversationParticipants)
				.where(eq(schema.conversationParticipants.conversationId, c.id));
			if (parts.length === 2) {
				const ids = parts.map((p) => p.userId);
				if (ids.includes(userAId) && ids.includes(userBId)) {
					const [found] = await this.drizzle
						.select()
						.from(schema.conversations)
						.where(eq(schema.conversations.id, c.id));
					return found || null;
				}
			}
		}
		return null;
	}

	async createConversation(
		type: 'DIRECT' | 'DEPARTMENT',
		participantIds: string[]
	): Promise<Conversation> {
		const now = new Date();
		const id = crypto.randomUUID();
		const [conv] = await this.drizzle
			.insert(schema.conversations)
			.values({
				id,
				conversationType: type,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		for (const uId of participantIds) {
			await this.drizzle.insert(schema.conversationParticipants).values({
				id: crypto.randomUUID(),
				conversationId: id,
				userId: uId,
				joinedAt: now
			});
		}
		return conv;
	}

	async getConversationParticipants(conversationId: string): Promise<string[]> {
		const parts = await this.drizzle
			.select({ userId: schema.conversationParticipants.userId })
			.from(schema.conversationParticipants)
			.where(eq(schema.conversationParticipants.conversationId, conversationId));
		return parts.map((p) => p.userId);
	}

	async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
		const msgs = await this.drizzle
			.select()
			.from(schema.messages)
			.where(eq(schema.messages.conversationId, conversationId))
			.orderBy(desc(schema.messages.createdAt))
			.limit(limit);
		return msgs.reverse();
	}

	async getMessagesPaginated(
		conversationId: string,
		limit = 30,
		cursor?: string,
		direction: 'before' | 'after' = 'before'
	): Promise<{ messages: Message[]; nextCursor?: string; hasMore: boolean }> {
		let cursorDate: Date | null = null;
		if (cursor) {
			const [cMsg] = await this.drizzle
				.select({ createdAt: schema.messages.createdAt })
				.from(schema.messages)
				.where(eq(schema.messages.id, cursor))
				.limit(1);
			if (cMsg) cursorDate = cMsg.createdAt;
		}

		const conditions = [eq(schema.messages.conversationId, conversationId)];
		if (cursorDate) {
			if (direction === 'before') {
				conditions.push(sql`${schema.messages.createdAt} < ${cursorDate}`);
			} else {
				conditions.push(sql`${schema.messages.createdAt} > ${cursorDate}`);
			}
		}

		const msgs = await this.drizzle
			.select()
			.from(schema.messages)
			.where(and(...conditions))
			.orderBy(direction === 'before' ? desc(schema.messages.createdAt) : asc(schema.messages.createdAt))
			.limit(limit + 1);

		const hasMore = msgs.length > limit;
		const sliced = msgs.slice(0, limit);
		const ordered = direction === 'before' ? sliced.reverse() : sliced;
		const nextCursor = ordered.length > 0 ? ordered[0].id : undefined;

		return {
			messages: ordered,
			nextCursor,
			hasMore
		};
	}

	async getMessageById(id: string): Promise<Message | null> {
		const [m] = await this.drizzle
			.select()
			.from(schema.messages)
			.where(eq(schema.messages.id, id))
			.limit(1);
		return m || null;
	}

	async createMessage(msg: NewMessage): Promise<Message> {
		const now = new Date();
		const id = msg.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.messages)
			.values({
				...msg,
				id,
				messageType: msg.messageType || 'TEXT',
				editHistory: '[]',
				createdAt: now,
				editedAt: null,
				deletedAt: null
			})
			.returning();

		await this.drizzle
			.update(schema.conversations)
			.set({ updatedAt: now })
			.where(eq(schema.conversations.id, msg.conversationId));

		return created;
	}

	async updateMessage(id: string, content: string): Promise<Message | null> {
		const [msg] = await this.drizzle
			.select()
			.from(schema.messages)
			.where(eq(schema.messages.id, id))
			.limit(1);
		if (!msg) return null;

		let editHistoryArr: any[] = [];
		try {
			if (msg.editHistory) editHistoryArr = JSON.parse(msg.editHistory);
		} catch {}
		editHistoryArr.push({ content: msg.content, editedAt: new Date() });

		const [updated] = await this.drizzle
			.update(schema.messages)
			.set({
				content,
				editedAt: new Date(),
				editHistory: JSON.stringify(editHistoryArr)
			})
			.where(eq(schema.messages.id, id))
			.returning();
		return updated || null;
	}

	async deleteMessage(id: string): Promise<boolean> {
		const [updated] = await this.drizzle
			.update(schema.messages)
			.set({ deletedAt: new Date() })
			.where(eq(schema.messages.id, id))
			.returning();
		return Boolean(updated);
	}

	async markMessageRead(messageId: string, userId: string): Promise<MessageReadReceipt> {
		const [existing] = await this.drizzle
			.select()
			.from(schema.messageReadReceipts)
			.where(and(eq(schema.messageReadReceipts.messageId, messageId), eq(schema.messageReadReceipts.userId, userId)))
			.limit(1);
		if (existing) {
			return existing;
		}

		const id = crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.messageReadReceipts)
			.values({
				id,
				messageId,
				userId,
				readAt: new Date()
			})
			.returning();
		return created;
	}

	async markConversationRead(conversationId: string, userId: string): Promise<number> {
		const otherMsgs = await this.drizzle
			.select({ id: schema.messages.id })
			.from(schema.messages)
			.where(and(
				eq(schema.messages.conversationId, conversationId),
				sql`${schema.messages.senderId} != ${userId}`
			));

		let readCount = 0;
		const now = new Date();
		for (const m of otherMsgs) {
			const [receipt] = await this.drizzle
				.select({ id: schema.messageReadReceipts.id })
				.from(schema.messageReadReceipts)
				.where(and(eq(schema.messageReadReceipts.messageId, m.id), eq(schema.messageReadReceipts.userId, userId)))
				.limit(1);
			if (!receipt) {
				await this.drizzle.insert(schema.messageReadReceipts).values({
					id: crypto.randomUUID(),
					messageId: m.id,
					userId,
					readAt: now
				});
				readCount++;
			}
		}
		return readCount;
	}

	async getUnreadCountForConversation(conversationId: string, userId: string): Promise<number> {
		const otherMsgs = await this.drizzle
			.select({ id: schema.messages.id })
			.from(schema.messages)
			.where(and(
				eq(schema.messages.conversationId, conversationId),
				sql`${schema.messages.senderId} != ${userId}`,
				sql`${schema.messages.deletedAt} is null`
			));
		if (otherMsgs.length === 0) return 0;

		let count = 0;
		for (const m of otherMsgs) {
			const [receipt] = await this.drizzle
				.select({ id: schema.messageReadReceipts.id })
				.from(schema.messageReadReceipts)
				.where(and(eq(schema.messageReadReceipts.messageId, m.id), eq(schema.messageReadReceipts.userId, userId)))
				.limit(1);
			if (!receipt) count++;
		}
		return count;
	}

	async searchMessages(params: {
		currentUserId: string;
		query?: string;
		participantId?: string;
		senderId?: string;
		startDate?: Date;
		endDate?: Date;
	}): Promise<Array<{ message: Message; conversation: Conversation; sender: User | null }>> {
		const userConvs = await this.getConversationsForUser(params.currentUserId);
		if (userConvs.length === 0) return [];
		const allowedConvIds = userConvs.map((c) => c.id);

		const conditions = [inArray(schema.messages.conversationId, allowedConvIds)];
		if (params.query) {
			conditions.push(sql`lower(${schema.messages.content}) LIKE ${'%' + params.query.toLowerCase() + '%'}`);
		}
		if (params.senderId) {
			conditions.push(eq(schema.messages.senderId, params.senderId));
		}
		if (params.participantId) {
			const participantConvs = await this.getConversationsForUser(params.participantId);
			const matchedConvIds = participantConvs.map((c) => c.id).filter((id) => allowedConvIds.includes(id));
			if (matchedConvIds.length === 0) return [];
			conditions.push(inArray(schema.messages.conversationId, matchedConvIds));
		}
		if (params.startDate) {
			conditions.push(gte(schema.messages.createdAt, params.startDate));
		}
		if (params.endDate) {
			conditions.push(lte(schema.messages.createdAt, params.endDate));
		}

		const msgs = await this.drizzle
			.select()
			.from(schema.messages)
			.where(and(...conditions))
			.orderBy(desc(schema.messages.createdAt));

		const convMap = new Map<string, Conversation>();
		for (const c of userConvs) convMap.set(c.id, c);
		const senderIds = Array.from(new Set(msgs.map((m) => m.senderId)));
		const senders = senderIds.length > 0
			? await this.drizzle.select().from(schema.users).where(inArray(schema.users.id, senderIds))
			: [];
		const senderMap = new Map<string, User>();
		for (const s of senders) senderMap.set(s.id, s);

		return msgs.map((m) => ({
			message: m,
			conversation: convMap.get(m.conversationId)!,
			sender: senderMap.get(m.senderId) || null
		}));
	}

	// --- NOTIFICATIONS ---
	async getAllNotifications(): Promise<Notification[]> {
		return await this.drizzle
			.select()
			.from(schema.notifications)
			.orderBy(desc(schema.notifications.createdAt));
	}

	async getNotificationsForUser(userId: string, limit = 20): Promise<Notification[]> {
		return await this.drizzle
			.select()
			.from(schema.notifications)
			.where(eq(schema.notifications.userId, userId))
			.orderBy(desc(schema.notifications.createdAt))
			.limit(limit);
	}

	async createNotification(notif: NewNotification): Promise<Notification> {
		const id = notif.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.notifications)
			.values({
				...notif,
				id,
				referenceId: notif.referenceId || null,
				readAt: notif.readAt || null,
				createdAt: notif.createdAt || new Date()
			})
			.returning();
		return created;
	}

	async markNotificationRead(id: string): Promise<boolean> {
		const [updated] = await this.drizzle
			.update(schema.notifications)
			.set({ readAt: new Date() })
			.where(eq(schema.notifications.id, id))
			.returning();
		return Boolean(updated);
	}

	async markAllNotificationsRead(userId: string): Promise<void> {
		await this.drizzle
			.update(schema.notifications)
			.set({ readAt: new Date() })
			.where(and(eq(schema.notifications.userId, userId), sql`${schema.notifications.readAt} is null`));
	}

	async getUnreadNotificationCount(userId: string): Promise<number> {
		const [res] = await this.drizzle
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.notifications)
			.where(and(eq(schema.notifications.userId, userId), sql`${schema.notifications.readAt} is null`));
		return Number(res?.count || 0);
	}

	// --- AUDIT LOGS ---
	async createAuditLog(log: NewAuditLog): Promise<AuditLog> {
		const id = log.id || crypto.randomUUID();
		const [created] = await this.drizzle
			.insert(schema.auditLogs)
			.values({
				...log,
				id,
				actorId: log.actorId || null,
				targetId: log.targetId || null,
				metadata: log.metadata || null,
				ipHash: log.ipHash || null,
				createdAt: log.createdAt || new Date()
			})
			.returning();
		return created;
	}

	async getAuditLogs(filters?: {
		actorId?: string;
		action?: string;
		targetType?: string;
		limit?: number;
		offset?: number;
	}): Promise<{ logs: AuditLog[]; total: number }> {
		const conditions: any[] = [];
		if (filters?.actorId) {
			conditions.push(eq(schema.auditLogs.actorId, filters.actorId));
		}
		if (filters?.action) {
			const s = `%${filters.action.toLowerCase()}%`;
			conditions.push(sql`lower(${schema.auditLogs.action}) LIKE ${s}`);
		}
		if (filters?.targetType) {
			conditions.push(eq(schema.auditLogs.targetType, filters.targetType));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;
		const [countRes] = await this.drizzle
			.select({ total: sql<number>`count(*)::int` })
			.from(schema.auditLogs)
			.where(where);
		const total = Number(countRes?.total || 0);

		const limit = filters?.limit || 50;
		const offset = filters?.offset || 0;
		const logs = await this.drizzle
			.select()
			.from(schema.auditLogs)
			.where(where)
			.orderBy(desc(schema.auditLogs.createdAt))
			.limit(limit)
			.offset(offset);

		return { logs, total };
	}

	// --- ORGANIZATION SETTINGS ---
	async getOrgSetting<T = unknown>(key: string): Promise<T | null> {
		const [item] = await this.drizzle
			.select()
			.from(schema.orgSettings)
			.where(eq(schema.orgSettings.key, key))
			.limit(1);
		if (!item) return null;
		try {
			return JSON.parse(item.value) as T;
		} catch {
			return null;
		}
	}

	async setOrgSetting(key: string, value: unknown, updatedBy?: string): Promise<OrgSetting> {
		const [record] = await this.drizzle
			.insert(schema.orgSettings)
			.values({
				key,
				value: JSON.stringify(value),
				updatedAt: new Date(),
				updatedBy: updatedBy || null
			})
			.onConflictDoUpdate({
				target: schema.orgSettings.key,
				set: {
					value: JSON.stringify(value),
					updatedAt: new Date(),
					updatedBy: updatedBy || null
				}
			})
			.returning();
		return record;
	}

	async getAllOrgSettings(): Promise<Record<string, unknown>> {
		const list = await this.drizzle.select().from(schema.orgSettings);
		const result: Record<string, unknown> = {};
		for (const item of list) {
			try {
				result[item.key] = JSON.parse(item.value);
			} catch {
				result[item.key] = item.value;
			}
		}
		return result;
	}
}
