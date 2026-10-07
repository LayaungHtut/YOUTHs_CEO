import crypto from 'node:crypto';
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
	NewMemberAchievement,
	Conversation,
	NewConversation,
	ConversationParticipant,
	Message,
	NewMessage,
	MessageReadReceipt,
	NewMessageReadReceipt,
	Notification,
	NewNotification,
	AuditLog,
	NewAuditLog,
	OrgSetting
} from './types';
import {
	INITIAL_DEPARTMENTS,
	INITIAL_ACHIEVEMENTS,
	INITIAL_TASK_TEMPLATES,
	DEFAULT_ORG_SETTINGS
} from './seed-data';

// In-memory relational database state for reliable local/test operation and fallback
export class DatabaseStore {
	private initialized = false;

	departments = new Map<string, Department>();
	users = new Map<string, User>();
	sessions = new Map<string, Session>();
	memberConnections = new Map<string, MemberDatabaseConnection>();
	tasks = new Map<string, Task>();
	taskWeeks = new Map<string, TaskWeek>();
	taskTemplates = new Map<string, TaskTemplate>();
	taskEvents = new Map<string, TaskEvent>();
	progressSnapshots = new Map<string, MemberProgressSnapshot>();
	pointsLedger = new Map<string, PointsTransaction>();
	achievements = new Map<string, Achievement>();
	memberAchievements = new Map<string, MemberAchievement>();
	conversations = new Map<string, Conversation>();
	conversationParticipants: ConversationParticipant[] = [];
	messages = new Map<string, Message>();
	messageReadReceipts = new Map<string, MessageReadReceipt>();
	notifications = new Map<string, Notification>();
	auditLogs = new Map<string, AuditLog>();
	orgSettings = new Map<string, OrgSetting>();

	constructor() {
		this.ensureInitialized();
	}

	public resetForTesting() {
		this.departments.clear();
		this.users.clear();
		this.sessions.clear();
		this.memberConnections.clear();
		this.tasks.clear();
		this.taskWeeks.clear();
		this.taskTemplates.clear();
		this.taskEvents.clear();
		this.progressSnapshots.clear();
		this.pointsLedger.clear();
		this.achievements.clear();
		this.memberAchievements.clear();
		this.conversations.clear();
		this.conversationParticipants = [];
		this.messages.clear();
		this.messageReadReceipts.clear();
		this.notifications.clear();
		this.auditLogs.clear();
		this.orgSettings.clear();
		this.initialized = false;
		this.ensureInitialized();
	}

	private ensureInitialized() {
		if (this.initialized) return;

		const now = new Date();

		// Seed initial departments
		for (const d of INITIAL_DEPARTMENTS) {
			this.departments.set(d.id, {
				id: d.id,
				name: d.name,
				description: d.description,
				headUserId: d.headUserId ?? null,
				createdAt: now,
				updatedAt: now
			});
		}

		// Seed initial achievements
		for (const a of INITIAL_ACHIEVEMENTS) {
			this.achievements.set(a.id, {
				id: a.id,
				name: a.name,
				description: a.description,
				icon: a.icon || 'award',
				category: a.category || 'TASKS',
				criteria: a.criteria || '{}',
				active: a.active ?? true,
				createdAt: now
			});
		}

		// Seed initial task templates
		for (const t of INITIAL_TASK_TEMPLATES) {
			this.taskTemplates.set(t.id, {
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
			});
		}

		// Seed default settings
		for (const [key, val] of Object.entries(DEFAULT_ORG_SETTINGS)) {
			this.orgSettings.set(key, {
				key,
				value: JSON.stringify(val),
				updatedAt: now,
				updatedBy: null
			});
		}

		this.initialized = true;
	}

	// --- DEPARTMENTS ---
	async getDepartments(): Promise<Department[]> {
		return Array.from(this.departments.values());
	}

	async getDepartmentById(id: string): Promise<Department | null> {
		return this.departments.get(id) || null;
	}

	async getDepartmentByName(name: string): Promise<Department | null> {
		for (const d of this.departments.values()) {
			if (d.name.toLowerCase() === name.toLowerCase()) return d;
		}
		return null;
	}

	async updateDepartment(
		id: string,
		updates: Partial<Pick<Department, 'description' | 'headUserId'>>
	): Promise<Department | null> {
		const existing = this.departments.get(id);
		if (!existing) return null;
		const updated: Department = {
			...existing,
			...updates,
			updatedAt: new Date()
		};
		this.departments.set(id, updated);
		return updated;
	}

	// --- USERS ---
	async getUserById(id: string): Promise<User | null> {
		return this.users.get(id) || null;
	}

	async getUserByEmail(email: string): Promise<User | null> {
		const lower = email.toLowerCase().trim();
		for (const u of this.users.values()) {
			if (u.email.toLowerCase() === lower) return u;
		}
		return null;
	}

	async getUserByUsername(username: string): Promise<User | null> {
		const lower = username.toLowerCase().trim();
		for (const u of this.users.values()) {
			if (u.username.toLowerCase() === lower) return u;
		}
		return null;
	}

	async getAllUsers(filters?: {
		departmentId?: string;
		role?: 'CEO' | 'HEAD' | 'MEMBER';
		accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
		search?: string;
	}): Promise<User[]> {
		let list = Array.from(this.users.values());
		if (filters?.departmentId) {
			list = list.filter((u) => u.departmentId === filters.departmentId);
		}
		if (filters?.role) {
			list = list.filter((u) => u.role === filters.role);
		}
		if (filters?.accountStatus) {
			list = list.filter((u) => u.accountStatus === filters.accountStatus);
		}
		if (filters?.search) {
			const s = filters.search.toLowerCase();
			list = list.filter(
				(u) =>
					u.fullName.toLowerCase().includes(s) ||
					u.username.toLowerCase().includes(s) ||
					u.email.toLowerCase().includes(s)
			);
		}
		return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}

	async createUser(user: NewUser): Promise<User> {
		const now = new Date();
		const id = user.id || crypto.randomUUID();
		const created: User = {
			...user,
			id,
			role: user.role || 'MEMBER',
			accountStatus: user.accountStatus || 'ACTIVE',
			avatarUrl: user.avatarUrl || null,
			departmentId: user.departmentId || null,
			lastLoginAt: user.lastLoginAt || null,
			mustChangePassword: user.mustChangePassword ?? false,
			createdAt: user.createdAt || now,
			updatedAt: user.updatedAt || now
		};
		this.users.set(id, created);
		return created;
	}

	async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
		const existing = this.users.get(id);
		if (!existing) return null;
		const updated: User = {
			...existing,
			...updates,
			updatedAt: new Date()
		};
		this.users.set(id, updated);
		return updated;
	}

	async deleteUser(id: string, reassignAdminId?: string): Promise<boolean> {
		if (!this.users.has(id)) return false;

		// 1. Remove sessions
		for (const [sId, sess] of this.sessions.entries()) {
			if (sess.userId === id) this.sessions.delete(sId);
		}

		// 2. Remove memberConnections
		for (const [cId, conn] of this.memberConnections.entries()) {
			if (conn.userId === id) this.memberConnections.delete(cId);
		}

		// 3. Clear department head assignment if user was head
		for (const [deptId, dept] of this.departments.entries()) {
			if (dept.headUserId === id) {
				this.departments.set(deptId, { ...dept, headUserId: null, updatedAt: new Date() });
			}
		}

		// 4. Tasks:
		// Delete tasks assigned to this user, and reassign tasks created by this user
		for (const [tId, task] of this.tasks.entries()) {
			if (task.assignedTo === id) {
				this.tasks.delete(tId);
			} else if (task.createdBy === id) {
				if (reassignAdminId) {
					this.tasks.set(tId, {
						...task,
						createdBy: reassignAdminId,
						updatedAt: new Date()
					});
				}
			}
		}

		// 5. Task events:
		for (const [eId, ev] of this.taskEvents.entries()) {
			if (ev.actorId === id) {
				if (reassignAdminId) {
					this.taskEvents.set(eId, { ...ev, actorId: reassignAdminId });
				} else {
					this.taskEvents.delete(eId);
				}
			}
		}

		// 6. Progress snapshots
		for (const [psId, ps] of this.progressSnapshots.entries()) {
			if (ps.userId === id) this.progressSnapshots.delete(psId);
		}

		// 7. Points ledger
		for (const [pId, p] of this.pointsLedger.entries()) {
			if (p.userId === id) {
				this.pointsLedger.delete(pId);
			} else if (p.createdBy === id) {
				this.pointsLedger.set(pId, { ...p, createdBy: null });
			}
		}

		// 8. Member achievements
		for (const [maId, ma] of this.memberAchievements.entries()) {
			if (ma.userId === id) this.memberAchievements.delete(maId);
		}

		// 9. Conversations & participants & messages
		this.conversationParticipants = this.conversationParticipants.filter((cp) => cp.userId !== id);
		for (const [mId, msg] of this.messages.entries()) {
			if (msg.senderId === id) this.messages.delete(mId);
		}
		for (const [rId, receipt] of this.messageReadReceipts.entries()) {
			if (receipt.userId === id) this.messageReadReceipts.delete(rId);
		}

		// 10. Notifications
		for (const [nId, notif] of this.notifications.entries()) {
			if (notif.userId === id) this.notifications.delete(nId);
		}

		// 11. Audit logs actorId -> null
		for (const [aId, log] of this.auditLogs.entries()) {
			if (log.actorId === id) {
				this.auditLogs.set(aId, { ...log, actorId: null });
			}
		}

		// 12. Delete user
		return this.users.delete(id);
	}

	async countCeoUsers(): Promise<number> {
		let count = 0;
		for (const u of this.users.values()) {
			if (u.role === 'CEO') count++;
		}
		return count;
	}

	// --- SESSIONS ---
	async createSession(session: NewSession): Promise<Session> {
		const created: Session = {
			id: session.id,
			userId: session.userId,
			expiresAt: session.expiresAt,
			createdAt: session.createdAt || new Date()
		};
		this.sessions.set(created.id, created);
		return created;
	}

	async getSession(id: string): Promise<Session | null> {
		const s = this.sessions.get(id);
		if (!s) return null;
		if (s.expiresAt.getTime() < Date.now()) {
			this.sessions.delete(id);
			return null;
		}
		return s;
	}

	async deleteSession(id: string): Promise<void> {
		this.sessions.delete(id);
	}

	// --- MEMBER DATABASE CONNECTIONS ---
	async getConnectionByUserId(userId: string): Promise<MemberDatabaseConnection | null> {
		for (const c of this.memberConnections.values()) {
			if (c.userId === userId) return c;
		}
		return null;
	}

	async getConnectionByTokenHash(tokenHash: string): Promise<MemberDatabaseConnection | null> {
		for (const c of this.memberConnections.values()) {
			if (c.tokenHash === tokenHash) return c;
		}
		return null;
	}

	async getAllConnections(): Promise<MemberDatabaseConnection[]> {
		return Array.from(this.memberConnections.values());
	}

	async upsertConnection(conn: NewMemberDatabaseConnection): Promise<MemberDatabaseConnection> {
		const now = new Date();
		let existing = await this.getConnectionByUserId(conn.userId);
		const id = existing?.id || conn.id || crypto.randomUUID();
		const updated: MemberDatabaseConnection = {
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
		};
		this.memberConnections.set(id, updated);
		return updated;
	}

	async revokeConnection(userId: string): Promise<boolean> {
		const conn = await this.getConnectionByUserId(userId);
		if (!conn) return false;
		conn.integrationStatus = 'REVOKED';
		conn.tokenHash = null;
		conn.integrationToken = null;
		conn.encryptedConnectionSecret = null;
		conn.updatedAt = new Date();
		this.memberConnections.set(conn.id, conn);
		return true;
	}

	// --- TASKS ---
	async getTaskById(id: string): Promise<Task | null> {
		return this.tasks.get(id) || null;
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
		let list = Array.from(this.tasks.values());
		if (filters?.departmentId) list = list.filter((t) => t.departmentId === filters.departmentId);
		if (filters?.assignedTo) list = list.filter((t) => t.assignedTo === filters.assignedTo);
		if (filters?.createdBy) list = list.filter((t) => t.createdBy === filters.createdBy);
		if (filters?.weekId) list = list.filter((t) => t.weekId === filters.weekId);
		if (filters?.status) list = list.filter((t) => t.status === filters.status);
		if (filters?.source) list = list.filter((t) => t.source === filters.source);
		if (filters?.priority) list = list.filter((t) => t.priority === filters.priority);
		if (filters?.search) {
			const s = filters.search.toLowerCase();
			list = list.filter(
				(t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)
			);
		}
		return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}

	async createTask(task: NewTask): Promise<Task> {
		const now = new Date();
		const id = task.id || crypto.randomUUID();
		const created: Task = {
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
		};
		this.tasks.set(id, created);
		return created;
	}

	async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
		const existing = this.tasks.get(id);
		if (!existing) return null;
		const updated: Task = {
			...existing,
			...updates,
			updatedAt: new Date()
		};
		this.tasks.set(id, updated);
		return updated;
	}

	async deleteTask(id: string): Promise<boolean> {
		return this.tasks.delete(id);
	}

	// --- TASK EVENTS ---
	async createTaskEvent(event: NewTaskEvent): Promise<TaskEvent> {
		if (event.idempotencyKey) {
			for (const ev of this.taskEvents.values()) {
				if (ev.idempotencyKey === event.idempotencyKey) {
					return ev;
				}
			}
		}

		const id = event.id || crypto.randomUUID();
		const created: TaskEvent = {
			...event,
			id,
			actorRole: event.actorRole || 'CEO',
			reason: event.reason || null,
			source: (event.source as any) || 'CEO',
			idempotencyKey: event.idempotencyKey || null,
			oldValue: event.oldValue || null,
			newValue: event.newValue || null,
			createdAt: event.createdAt || new Date()
		};
		this.taskEvents.set(id, created);
		return created;
	}

	async getTaskEvents(taskId: string, order: 'asc' | 'desc' = 'asc'): Promise<TaskEvent[]> {
		return Array.from(this.taskEvents.values())
			.filter((e) => e.taskId === taskId)
			.sort((a, b) =>
				order === 'asc'
					? a.createdAt.getTime() - b.createdAt.getTime()
					: b.createdAt.getTime() - a.createdAt.getTime()
			);
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
		let list = Array.from(this.taskEvents.values());

		if (filters?.eventType) {
			list = list.filter((e) => e.eventType === filters.eventType);
		}
		if (filters?.source) {
			list = list.filter((e) => e.source === filters.source);
		}
		if (filters?.startDate) {
			list = list.filter((e) => e.createdAt >= filters.startDate!);
		}
		if (filters?.endDate) {
			list = list.filter((e) => e.createdAt <= filters.endDate!);
		}

		const results: Array<TaskEvent & { task?: Task; actor?: User | null }> = [];
		for (const ev of list) {
			const task = this.tasks.get(ev.taskId);
			if (filters?.memberId && task?.assignedTo !== filters.memberId) continue;
			if (filters?.departmentId && task?.departmentId !== filters.departmentId) continue;
			if (filters?.priority && task?.priority !== filters.priority) continue;
			if (filters?.status && task?.status !== filters.status) continue;

			const actor = this.users.get(ev.actorId) || null;
			results.push({
				...ev,
				task,
				actor
			});
		}

		const isNewest = filters?.sort !== 'oldest';
		return results.sort((a, b) =>
			isNewest
				? b.createdAt.getTime() - a.createdAt.getTime()
				: a.createdAt.getTime() - b.createdAt.getTime()
		);
	}

	// --- TASK WEEKS ---
	async getTaskWeeks(): Promise<TaskWeek[]> {
		return Array.from(this.taskWeeks.values()).sort(
			(a, b) => b.weekStart.getTime() - a.weekStart.getTime()
		);
	}

	async getTaskWeekById(id: string): Promise<TaskWeek | null> {
		return this.taskWeeks.get(id) || null;
	}

	async getCurrentTaskWeek(): Promise<TaskWeek | null> {
		const now = new Date();
		for (const w of this.taskWeeks.values()) {
			if (w.weekStart <= now && w.weekEnd >= now) {
				return w;
			}
		}
		return null;
	}

	async createTaskWeek(week: NewTaskWeek): Promise<TaskWeek> {
		const id = week.id || crypto.randomUUID();
		const created: TaskWeek = {
			...week,
			id,
			distributionStatus: week.distributionStatus || 'DRAFT',
			generatedAt: week.generatedAt || null,
			publishedAt: week.publishedAt || null,
			createdBy: week.createdBy || null,
			configurationSnapshot: week.configurationSnapshot || null
		};
		this.taskWeeks.set(id, created);
		return created;
	}

	async updateTaskWeek(id: string, updates: Partial<TaskWeek>): Promise<TaskWeek | null> {
		const existing = this.taskWeeks.get(id);
		if (!existing) return null;
		const updated: TaskWeek = {
			...existing,
			...updates
		};
		this.taskWeeks.set(id, updated);
		return updated;
	}

	// --- TASK TEMPLATES ---
	async getTaskTemplates(departmentId?: string): Promise<TaskTemplate[]> {
		let list = Array.from(this.taskTemplates.values());
		if (departmentId) list = list.filter((t) => t.departmentId === departmentId);
		return list.sort((a, b) => a.title.localeCompare(b.title));
	}

	async createTaskTemplate(tmpl: NewTaskTemplate): Promise<TaskTemplate> {
		const now = new Date();
		const id = tmpl.id || crypto.randomUUID();
		const created: TaskTemplate = {
			...tmpl,
			id,
			estimatedEffort: tmpl.estimatedEffort || '4-6 hours',
			requiredSkills: tmpl.requiredSkills || '[]',
			priority: tmpl.priority || 'MEDIUM',
			active: tmpl.active ?? true,
			createdAt: now,
			updatedAt: now
		};
		this.taskTemplates.set(id, created);
		return created;
	}

	// --- MEMBER PROGRESS SNAPSHOTS ---
	async getSnapshotsByUserId(userId: string): Promise<MemberProgressSnapshot[]> {
		return Array.from(this.progressSnapshots.values())
			.filter((s) => s.userId === userId)
			.sort((a, b) => b.lastSyncedAt.getTime() - a.lastSyncedAt.getTime());
	}

	async getLatestSnapshot(userId: string): Promise<MemberProgressSnapshot | null> {
		const list = await this.getSnapshotsByUserId(userId);
		return list[0] || null;
	}

	async upsertSnapshot(snapshot: NewMemberProgressSnapshot): Promise<MemberProgressSnapshot> {
		const id = snapshot.id || crypto.randomUUID();
		const created: MemberProgressSnapshot = {
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
		};
		this.progressSnapshots.set(id, created);
		return created;
	}

	// --- POINTS LEDGER ---
	async getLedgerByUserId(userId: string): Promise<PointsTransaction[]> {
		return Array.from(this.pointsLedger.values())
			.filter((tx) => tx.userId === userId)
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}

	async getAllPointsLedgers(): Promise<PointsTransaction[]> {
		return Array.from(this.pointsLedger.values()).sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime()
		);
	}

	async getPointsTransactionByIdempotencyKey(key: string): Promise<PointsTransaction | null> {
		for (const tx of this.pointsLedger.values()) {
			if (tx.idempotencyKey === key) return tx;
		}
		return null;
	}

	async addPointsTransaction(tx: NewPointsTransaction): Promise<PointsTransaction> {
		// Enforce idempotency: if already processed, return existing
		const existing = await this.getPointsTransactionByIdempotencyKey(tx.idempotencyKey);
		if (existing) {
			return existing;
		}

		const id = tx.id || crypto.randomUUID();
		const created: PointsTransaction = {
			...tx,
			id,
			taskId: tx.taskId || null,
			createdBy: tx.createdBy || null,
			createdAt: tx.createdAt || new Date()
		};
		this.pointsLedger.set(id, created);
		return created;
	}

	async getUserPointsBalance(userId: string): Promise<number> {
		const transactions = await this.getLedgerByUserId(userId);
		return transactions.reduce((acc, curr) => acc + curr.amount, 0);
	}

	// --- ACHIEVEMENTS ---
	async getAchievements(onlyActive = true): Promise<Achievement[]> {
		let list = Array.from(this.achievements.values());
		if (onlyActive) list = list.filter((a) => a.active);
		return list.sort((a, b) => a.name.localeCompare(b.name));
	}

	async getAchievementById(id: string): Promise<Achievement | null> {
		return this.achievements.get(id) || null;
	}

	async createAchievement(achievement: NewAchievement): Promise<Achievement> {
		const id = achievement.id || crypto.randomUUID();
		const created: Achievement = {
			...achievement,
			id,
			icon: achievement.icon || 'award',
			category: achievement.category || 'TASKS',
			criteria: achievement.criteria || '{}',
			active: achievement.active ?? true,
			createdAt: new Date()
		};
		this.achievements.set(id, created);
		return created;
	}

	async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | null> {
		const existing = this.achievements.get(id);
		if (!existing) return null;
		const updated: Achievement = {
			...existing,
			...updates
		};
		this.achievements.set(id, updated);
		return updated;
	}

	async getMemberAchievements(userId: string): Promise<MemberAchievement[]> {
		return Array.from(this.memberAchievements.values())
			.filter((ma) => ma.userId === userId)
			.sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
	}

	async unlockAchievement(
		userId: string,
		achievementId: string,
		metadata?: string
	): Promise<MemberAchievement | null> {
		// Check if already unlocked
		for (const ma of this.memberAchievements.values()) {
			if (ma.userId === userId && ma.achievementId === achievementId) {
				return ma; // Already unlocked
			}
		}

		const id = crypto.randomUUID();
		const created: MemberAchievement = {
			id,
			userId,
			achievementId,
			unlockedAt: new Date(),
			metadata: metadata || null
		};
		this.memberAchievements.set(id, created);
		return created;
	}

	async getAllMemberAchievements(): Promise<MemberAchievement[]> {
		return Array.from(this.memberAchievements.values());
	}

	// --- CONVERSATIONS & MESSAGING ---
	async getConversationsForUser(userId: string): Promise<Conversation[]> {
		const joinedConvIds = new Set(
			this.conversationParticipants.filter((p) => p.userId === userId).map((p) => p.conversationId)
		);
		return Array.from(this.conversations.values())
			.filter((c) => joinedConvIds.has(c.id))
			.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
	}

	async getConversationById(id: string): Promise<Conversation | null> {
		return this.conversations.get(id) || null;
	}

	async getDirectConversation(userAId: string, userBId: string): Promise<Conversation | null> {
		for (const conv of this.conversations.values()) {
			if (conv.conversationType !== 'DIRECT') continue;
			const parts = this.conversationParticipants.filter((p) => p.conversationId === conv.id);
			if (parts.length === 2) {
				const ids = parts.map((p) => p.userId);
				if (ids.includes(userAId) && ids.includes(userBId)) {
					return conv;
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
		const conv: Conversation = {
			id,
			conversationType: type,
			createdAt: now,
			updatedAt: now
		};
		this.conversations.set(id, conv);

		for (const uId of participantIds) {
			this.conversationParticipants.push({
				id: crypto.randomUUID(),
				conversationId: id,
				userId: uId,
				joinedAt: now
			});
		}
		return conv;
	}

	async getConversationParticipants(conversationId: string): Promise<string[]> {
		return this.conversationParticipants
			.filter((p) => p.conversationId === conversationId)
			.map((p) => p.userId);
	}

	async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
		return Array.from(this.messages.values())
			.filter((m) => m.conversationId === conversationId)
			.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
			.slice(-limit);
	}

	async getMessagesPaginated(
		conversationId: string,
		limit = 30,
		cursor?: string,
		direction: 'before' | 'after' = 'before'
	): Promise<{ messages: Message[]; nextCursor?: string; hasMore: boolean }> {
		let list = Array.from(this.messages.values())
			.filter((m) => m.conversationId === conversationId)
			.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

		if (cursor) {
			const cursorIdx = list.findIndex((m) => m.id === cursor);
			if (cursorIdx !== -1) {
				if (direction === 'before') {
					list = list.slice(0, cursorIdx);
				} else {
					list = list.slice(cursorIdx + 1);
				}
			}
		}

		const hasMore = list.length > limit;
		const paginated = direction === 'before' ? list.slice(-limit) : list.slice(0, limit);
		const nextCursor = paginated.length > 0 ? paginated[0].id : undefined;

		return {
			messages: paginated,
			nextCursor,
			hasMore
		};
	}

	async getMessageById(id: string): Promise<Message | null> {
		return this.messages.get(id) || null;
	}

	async createMessage(msg: NewMessage): Promise<Message> {
		const now = new Date();
		const id = msg.id || crypto.randomUUID();
		const created: Message = {
			...msg,
			id,
			messageType: msg.messageType || 'TEXT',
			editHistory: '[]',
			createdAt: now,
			editedAt: null,
			deletedAt: null
		};
		this.messages.set(id, created);

		// Touch conversation updatedAt
		const conv = this.conversations.get(msg.conversationId);
		if (conv) {
			conv.updatedAt = now;
			this.conversations.set(conv.id, conv);
		}
		return created;
	}

	async updateMessage(id: string, content: string): Promise<Message | null> {
		const msg = this.messages.get(id);
		if (!msg) return null;

		let editHistoryArr: any[] = [];
		try {
			if (msg.editHistory) editHistoryArr = JSON.parse(msg.editHistory);
		} catch {}
		editHistoryArr.push({ content: msg.content, editedAt: new Date() });

		msg.content = content;
		msg.editedAt = new Date();
		msg.editHistory = JSON.stringify(editHistoryArr);
		this.messages.set(id, msg);
		return msg;
	}

	async deleteMessage(id: string): Promise<boolean> {
		const msg = this.messages.get(id);
		if (!msg) return false;
		msg.deletedAt = new Date();
		this.messages.set(id, msg);
		return true;
	}

	async markMessageRead(messageId: string, userId: string): Promise<MessageReadReceipt> {
		for (const r of this.messageReadReceipts.values()) {
			if (r.messageId === messageId && r.userId === userId) {
				return r;
			}
		}
		const id = crypto.randomUUID();
		const created: MessageReadReceipt = {
			id,
			messageId,
			userId,
			readAt: new Date()
		};
		this.messageReadReceipts.set(id, created);
		return created;
	}

	async markConversationRead(conversationId: string, userId: string): Promise<number> {
		let readCount = 0;
		const now = new Date();
		for (const m of this.messages.values()) {
			if (m.conversationId === conversationId && m.senderId !== userId) {
				let hasReceipt = false;
				for (const r of this.messageReadReceipts.values()) {
					if (r.messageId === m.id && r.userId === userId) {
						hasReceipt = true;
						break;
					}
				}
				if (!hasReceipt) {
					const rId = crypto.randomUUID();
					this.messageReadReceipts.set(rId, {
						id: rId,
						messageId: m.id,
						userId,
						readAt: now
					});
					readCount++;
				}
			}
		}
		return readCount;
	}

	async getUnreadCountForConversation(conversationId: string, userId: string): Promise<number> {
		let count = 0;
		for (const m of this.messages.values()) {
			if (m.conversationId === conversationId && m.senderId !== userId && !m.deletedAt) {
				let hasReceipt = false;
				for (const r of this.messageReadReceipts.values()) {
					if (r.messageId === m.id && r.userId === userId) {
						hasReceipt = true;
						break;
					}
				}
				if (!hasReceipt) count++;
			}
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
		const allowedConvIds = new Set(userConvs.map((c) => c.id));

		let matchingMessages = Array.from(this.messages.values()).filter((m) =>
			allowedConvIds.has(m.conversationId)
		);

		if (params.query) {
			const q = params.query.toLowerCase();
			matchingMessages = matchingMessages.filter((m) => m.content.toLowerCase().includes(q));
		}
		if (params.senderId) {
			matchingMessages = matchingMessages.filter((m) => m.senderId === params.senderId);
		}
		if (params.participantId) {
			const participantConvs = new Set(
				this.conversationParticipants
					.filter((p) => p.userId === params.participantId)
					.map((p) => p.conversationId)
			);
			matchingMessages = matchingMessages.filter((m) => participantConvs.has(m.conversationId));
		}
		if (params.startDate) {
			matchingMessages = matchingMessages.filter((m) => m.createdAt >= params.startDate!);
		}
		if (params.endDate) {
			matchingMessages = matchingMessages.filter((m) => m.createdAt <= params.endDate!);
		}

		matchingMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		const results: any[] = [];
		for (const msg of matchingMessages) {
			const conv = this.conversations.get(msg.conversationId)!;
			const sender = this.users.get(msg.senderId) || null;
			results.push({ message: msg, conversation: conv, sender });
		}
		return results;
	}

	// --- NOTIFICATIONS ---
	async getAllNotifications(): Promise<Notification[]> {
		return Array.from(this.notifications.values()).sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime()
		);
	}

	async getNotificationsForUser(userId: string, limit = 20): Promise<Notification[]> {
		return Array.from(this.notifications.values())
			.filter((n) => n.userId === userId)
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
			.slice(0, limit);
	}

	async createNotification(notif: NewNotification): Promise<Notification> {
		const id = notif.id || crypto.randomUUID();
		const created: Notification = {
			...notif,
			id,
			referenceId: notif.referenceId || null,
			readAt: notif.readAt || null,
			createdAt: notif.createdAt || new Date()
		};
		this.notifications.set(id, created);
		return created;
	}

	async markNotificationRead(id: string): Promise<boolean> {
		const notif = this.notifications.get(id);
		if (!notif) return false;
		notif.readAt = new Date();
		this.notifications.set(id, notif);
		return true;
	}

	async markAllNotificationsRead(userId: string): Promise<void> {
		const now = new Date();
		for (const n of this.notifications.values()) {
			if (n.userId === userId && !n.readAt) {
				n.readAt = now;
				this.notifications.set(n.id, n);
			}
		}
	}

	async getUnreadNotificationCount(userId: string): Promise<number> {
		let count = 0;
		for (const n of this.notifications.values()) {
			if (n.userId === userId && !n.readAt) count++;
		}
		return count;
	}

	// --- AUDIT LOGS ---
	async createAuditLog(log: NewAuditLog): Promise<AuditLog> {
		const id = log.id || crypto.randomUUID();
		const created: AuditLog = {
			...log,
			id,
			actorId: log.actorId || null,
			targetId: log.targetId || null,
			metadata: log.metadata || null,
			ipHash: log.ipHash || null,
			createdAt: log.createdAt || new Date()
		};
		this.auditLogs.set(id, created);
		return created;
	}

	async getAuditLogs(filters?: {
		actorId?: string;
		action?: string;
		targetType?: string;
		limit?: number;
		offset?: number;
	}): Promise<{ logs: AuditLog[]; total: number }> {
		let list = Array.from(this.auditLogs.values());
		if (filters?.actorId) list = list.filter((l) => l.actorId === filters.actorId);
		if (filters?.action) list = list.filter((l) => l.action.includes(filters.action!));
		if (filters?.targetType) list = list.filter((l) => l.targetType === filters.targetType);

		list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		const total = list.length;
		const offset = filters?.offset || 0;
		const limit = filters?.limit || 50;
		const paginated = list.slice(offset, offset + limit);
		return { logs: paginated, total };
	}

	// --- ORGANIZATION SETTINGS ---
	async getOrgSetting<T = unknown>(key: string): Promise<T | null> {
		const item = this.orgSettings.get(key);
		if (!item) return null;
		try {
			return JSON.parse(item.value) as T;
		} catch {
			return null;
		}
	}

	async setOrgSetting(key: string, value: unknown, updatedBy?: string): Promise<OrgSetting> {
		const record: OrgSetting = {
			key,
			value: JSON.stringify(value),
			updatedAt: new Date(),
			updatedBy: updatedBy || null
		};
		this.orgSettings.set(key, record);
		return record;
	}

	async getAllOrgSettings(): Promise<Record<string, unknown>> {
		const result: Record<string, unknown> = {};
		for (const [key, item] of this.orgSettings.entries()) {
			try {
				result[key] = JSON.parse(item.value);
			} catch {
				result[key] = item.value;
			}
		}
		return result;
	}
}

// Global singleton instance
export const dbStore = new DatabaseStore();
export const db = dbStore;
