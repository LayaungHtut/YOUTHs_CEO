import { pgTable, text, timestamp, integer, boolean, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- DEPARTMENTS ---
export const departments = pgTable(
	'departments',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull().unique(),
		description: text('description').notNull(),
		headUserId: text('head_user_id'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('departments_name_idx').on(t.name)]
);

// --- USERS ---
export const users = pgTable(
	'users',
	{
		id: text('id').primaryKey(),
		fullName: text('full_name').notNull(),
		username: text('username').notNull().unique(),
		email: text('email').notNull().unique(),
		passwordHash: text('password_hash').notNull(),
		role: text('role', { enum: ['CEO', 'HEAD', 'MEMBER'] }).notNull().default('MEMBER'),
		departmentId: text('department_id').references(() => departments.id, { onDelete: 'set null' }),
		avatarUrl: text('avatar_url'),
		accountStatus: text('account_status', { enum: ['ACTIVE', 'SUSPENDED', 'INVITED'] })
			.notNull()
			.default('ACTIVE'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
		lastLoginAt: timestamp('last_login_at', { withTimezone: true })
	},
	(t) => [
		index('users_email_idx').on(t.email),
		index('users_username_idx').on(t.username),
		index('users_role_idx').on(t.role),
		index('users_dept_idx').on(t.departmentId)
	]
);

// --- SESSIONS ---
export const sessions = pgTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('sessions_user_id_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)]
);

// --- MEMBER DATABASE CONNECTIONS ---
export const memberDatabaseConnections = pgTable(
	'member_database_connections',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.unique()
			.references(() => users.id, { onDelete: 'cascade' }),
		connectionType: text('connection_type', { enum: ['REST_SYNC', 'DIRECT_NEON'] })
			.notNull()
			.default('REST_SYNC'),
		integrationStatus: text('integration_status', {
			enum: ['CONFIGURED', 'PENDING', 'CONNECTED', 'ERROR', 'REVOKED']
		})
			.notNull()
			.default('PENDING'),
		encryptedConnectionSecret: text('encrypted_connection_secret'),
		integrationToken: text('integration_token'), // Masked token prefix e.g. yt_sync_****
		tokenHash: text('token_hash'), // SHA-256 hash for secure verification
		permissions: text('permissions').default('["read:progress"]'), // JSON array of scopes
		lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
		lastSyncError: text('last_sync_error'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('member_db_user_idx').on(t.userId), index('member_db_token_hash_idx').on(t.tokenHash)]
);

// --- TASK WEEKS (Weekly distribution cycles) ---
export const taskWeeks = pgTable(
	'task_weeks',
	{
		id: text('id').primaryKey(),
		weekStart: timestamp('week_start', { withTimezone: true }).notNull(),
		weekEnd: timestamp('week_end', { withTimezone: true }).notNull(),
		distributionStatus: text('distribution_status', {
			enum: ['DRAFT', 'PROPOSED', 'PUBLISHED']
		})
			.notNull()
			.default('DRAFT'),
		generatedAt: timestamp('generated_at', { withTimezone: true }),
		publishedAt: timestamp('published_at', { withTimezone: true }),
		createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
		configurationSnapshot: text('configuration_snapshot') // JSON string
	},
	(t) => [index('task_weeks_dates_idx').on(t.weekStart, t.weekEnd)]
);

// --- TASKS ---
export const tasks = pgTable(
	'tasks',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		description: text('description').notNull(),
		createdBy: text('created_by')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		assignedTo: text('assigned_to')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		departmentId: text('department_id')
			.notNull()
			.references(() => departments.id, { onDelete: 'restrict' }),
		source: text('source', { enum: ['MANUAL', 'AI_WEEKLY', 'HEAD_ASSIGNMENT'] })
			.notNull()
			.default('MANUAL'),
		priority: text('priority', { enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
			.notNull()
			.default('MEDIUM'),
		status: text('status', {
			enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED']
		})
			.notNull()
			.default('PENDING'),
		weekId: text('week_id').references(() => taskWeeks.id, { onDelete: 'set null' }),
		startDate: timestamp('start_date', { withTimezone: true }).notNull(),
		deadline: timestamp('deadline', { withTimezone: true }).notNull(),
		originalDeadline: timestamp('original_deadline', { withTimezone: true }),
		originalAssigneeId: text('original_assignee_id'),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		estimatedEffort: text('estimated_effort'),
		pointsReward: integer('points_reward').notNull().default(10),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('tasks_assigned_to_idx').on(t.assignedTo),
		index('tasks_dept_idx').on(t.departmentId),
		index('tasks_status_idx').on(t.status),
		index('tasks_week_idx').on(t.weekId),
		index('tasks_deadline_idx').on(t.deadline)
	]
);

// --- TASK TEMPLATES ---
export const taskTemplates = pgTable(
	'task_templates',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		description: text('description').notNull(),
		departmentId: text('department_id')
			.notNull()
			.references(() => departments.id, { onDelete: 'cascade' }),
		estimatedEffort: text('estimated_effort').notNull().default('4-6 hours'),
		requiredSkills: text('required_skills').notNull().default('[]'), // JSON array of string skill tags
		priority: text('priority', { enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
			.notNull()
			.default('MEDIUM'),
		active: boolean('active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('task_templates_dept_idx').on(t.departmentId)]
);

// --- TASK EVENTS (Audit history for tasks) ---
export const taskEvents = pgTable(
	'task_events',
	{
		id: text('id').primaryKey(),
		taskId: text('task_id')
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		actorId: text('actor_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		actorRole: text('actor_role'),
		eventType: text('event_type').notNull(), // CREATED, STATUS_CHANGED, REASSIGNED, DEADLINE_CHANGED, CANCELLED
		source: text('source'), // CEO, HEAD, MEMBER, AI, SYSTEM
		reason: text('reason'),
		idempotencyKey: text('idempotency_key'),
		oldValue: text('old_value'), // JSON string
		newValue: text('new_value'), // JSON string
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('task_events_task_idx').on(t.taskId),
		index('task_events_created_idx').on(t.createdAt),
		index('task_events_idempotency_idx').on(t.idempotencyKey)
	]
);

// --- MEMBER PROGRESS SNAPSHOTS (Synchronized from Member Neon databases) ---
export const memberProgressSnapshots = pgTable(
	'member_progress_snapshots',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		weekId: text('week_id').references(() => taskWeeks.id, { onDelete: 'set null' }),
		tasksAssigned: integer('tasks_assigned').notNull().default(0),
		tasksCompleted: integer('tasks_completed').notNull().default(0),
		tasksOverdue: integer('tasks_overdue').notNull().default(0),
		completionPercentage: integer('completion_percentage').notNull().default(0),
		pointsBalance: integer('points_balance').notNull().default(100),
		lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).defaultNow().notNull(),
		source: text('source', { enum: ['API_SYNC', 'MANUAL_IMPORT', 'CEO_OVERRIDE'] })
			.notNull()
			.default('API_SYNC')
	},
	(t) => [index('progress_user_idx').on(t.userId), index('progress_week_idx').on(t.weekId)]
);

// --- POINTS LEDGER (Append-only transaction ledger) ---
export const pointsLedger = pgTable(
	'points_ledger',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
		amount: integer('amount').notNull(),
		transactionType: text('transaction_type', {
			enum: ['INITIAL_GRANT', 'TASK_COMPLETION', 'OVERDUE_PENALTY', 'MANUAL_ADJUSTMENT', 'BONUS']
		}).notNull(),
		description: text('description').notNull(),
		idempotencyKey: text('idempotency_key').notNull().unique(),
		createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('points_user_idx').on(t.userId),
		index('points_task_idx').on(t.taskId),
		index('points_idempotency_idx').on(t.idempotencyKey)
	]
);

// --- ACHIEVEMENTS ---
export const achievements = pgTable(
	'achievements',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull().unique(),
		description: text('description').notNull(),
		icon: text('icon').notNull().default('award'),
		category: text('category', { enum: ['TASKS', 'CONSISTENCY', 'DEPARTMENT', 'POINTS'] })
			.notNull()
			.default('TASKS'),
		criteria: text('criteria').notNull().default('{}'), // JSON specification
		active: boolean('active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('achievements_name_idx').on(t.name)]
);

// --- MEMBER ACHIEVEMENTS ---
export const memberAchievements = pgTable(
	'member_achievements',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		achievementId: text('achievement_id')
			.notNull()
			.references(() => achievements.id, { onDelete: 'cascade' }),
		unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
		metadata: text('metadata') // JSON string
	},
	(t) => [
		index('member_achievements_user_idx').on(t.userId),
		uniqueIndex('member_achievements_unique').on(t.userId, t.achievementId)
	]
);

// --- CONVERSATIONS ---
export const conversations = pgTable(
	'conversations',
	{
		id: text('id').primaryKey(),
		conversationType: text('conversation_type', { enum: ['DIRECT', 'DEPARTMENT'] })
			.notNull()
			.default('DIRECT'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	}
);

// --- CONVERSATION PARTICIPANTS ---
export const conversationParticipants = pgTable(
	'conversation_participants',
	{
		id: text('id').primaryKey(),
		conversationId: text('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('conv_part_conv_idx').on(t.conversationId),
		index('conv_part_user_idx').on(t.userId),
		uniqueIndex('conv_part_unique').on(t.conversationId, t.userId)
	]
);

// --- MESSAGES ---
export const messages = pgTable(
	'messages',
	{
		id: text('id').primaryKey(),
		conversationId: text('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),
		senderId: text('sender_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		messageType: text('message_type', { enum: ['TEXT', 'SYSTEM', 'FILE'] })
			.notNull()
			.default('TEXT'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		editedAt: timestamp('edited_at', { withTimezone: true }),
		editHistory: text('edit_history'), // JSON string array of { content, editedAt }
		deletedAt: timestamp('deleted_at', { withTimezone: true })
	},
	(t) => [
		index('messages_conv_idx').on(t.conversationId),
		index('messages_created_idx').on(t.createdAt),
		index('messages_conv_created_idx').on(t.conversationId, t.createdAt)
	]
);

// --- MESSAGE READ RECEIPTS ---
export const messageReadReceipts = pgTable(
	'message_read_receipts',
	{
		id: text('id').primaryKey(),
		messageId: text('message_id')
			.notNull()
			.references(() => messages.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		readAt: timestamp('read_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('read_receipts_msg_idx').on(t.messageId),
		uniqueIndex('read_receipts_unique').on(t.messageId, t.userId)
	]
);

// --- NOTIFICATIONS ---
export const notifications = pgTable(
	'notifications',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').notNull(), // MESSAGE, TASK_ASSIGNED, DEADLINE_CHANGED, TASK_CANCELLED, DISTRIBUTION_PUBLISHED, ACHIEVEMENT_UNLOCKED, ACCOUNT_UPDATE, INTEGRATION_ERROR
		title: text('title').notNull(),
		message: text('message').notNull(),
		referenceId: text('reference_id'),
		readAt: timestamp('read_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('notifications_user_idx').on(t.userId), index('notifications_read_idx').on(t.readAt)]
);

// --- AUDIT LOGS (Immutable administrative trail) ---
export const auditLogs = pgTable(
	'audit_logs',
	{
		id: text('id').primaryKey(),
		actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
		action: text('action').notNull(), // USER_CREATED, ROLE_PROMOTED, TASK_CREATED, etc.
		targetType: text('target_type').notNull(), // USER, DEPARTMENT, TASK, DISTRIBUTION, INTEGRATION, SETTINGS
		targetId: text('target_id'),
		metadata: text('metadata'), // JSON string
		ipHash: text('ip_hash'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('audit_actor_idx').on(t.actorId),
		index('audit_action_idx').on(t.action),
		index('audit_target_idx').on(t.targetType, t.targetId),
		index('audit_created_idx').on(t.createdAt)
	]
);

// --- ORGANIZATION SETTINGS ---
export const orgSettings = pgTable('org_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(), // JSON string
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' })
});

// --- RELATIONS ---
export const departmentsRelations = relations(departments, ({ one, many }) => ({
	headUser: one(users, {
		fields: [departments.headUserId],
		references: [users.id]
	}),
	members: many(users),
	tasks: many(tasks),
	templates: many(taskTemplates)
}));

export const usersRelations = relations(users, ({ one, many }) => ({
	department: one(departments, {
		fields: [users.departmentId],
		references: [departments.id]
	}),
	sessions: many(sessions),
	createdTasks: many(tasks, { relationName: 'tasksCreated' }),
	assignedTasks: many(tasks, { relationName: 'tasksAssigned' }),
	pointsTransactions: many(pointsLedger),
	achievements: many(memberAchievements),
	databaseConnection: one(memberDatabaseConnections, {
		fields: [users.id],
		references: [memberDatabaseConnections.userId]
	}),
	progressSnapshots: many(memberProgressSnapshots),
	notifications: many(notifications)
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
	creator: one(users, {
		fields: [tasks.createdBy],
		references: [users.id],
		relationName: 'tasksCreated'
	}),
	assignee: one(users, {
		fields: [tasks.assignedTo],
		references: [users.id],
		relationName: 'tasksAssigned'
	}),
	department: one(departments, {
		fields: [tasks.departmentId],
		references: [departments.id]
	}),
	week: one(taskWeeks, {
		fields: [tasks.weekId],
		references: [taskWeeks.id]
	}),
	events: many(taskEvents),
	pointsTransactions: many(pointsLedger)
}));

export const taskWeeksRelations = relations(taskWeeks, ({ one, many }) => ({
	creator: one(users, {
		fields: [taskWeeks.createdBy],
		references: [users.id]
	}),
	tasks: many(tasks),
	snapshots: many(memberProgressSnapshots)
}));

export const pointsLedgerRelations = relations(pointsLedger, ({ one }) => ({
	user: one(users, {
		fields: [pointsLedger.userId],
		references: [users.id]
	}),
	task: one(tasks, {
		fields: [pointsLedger.taskId],
		references: [tasks.id]
	}),
	creator: one(users, {
		fields: [pointsLedger.createdBy],
		references: [users.id]
	})
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
	unlockedMembers: many(memberAchievements)
}));

export const memberAchievementsRelations = relations(memberAchievements, ({ one }) => ({
	user: one(users, {
		fields: [memberAchievements.userId],
		references: [users.id]
	}),
	achievement: one(achievements, {
		fields: [memberAchievements.achievementId],
		references: [achievements.id]
	})
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
	participants: many(conversationParticipants),
	messages: many(messages)
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	sender: one(users, {
		fields: [messages.senderId],
		references: [users.id]
	}),
	readReceipts: many(messageReadReceipts)
}));
