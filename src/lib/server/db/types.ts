import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
	departments,
	users,
	sessions,
	memberDatabaseConnections,
	tasks,
	taskWeeks,
	taskTemplates,
	taskEvents,
	memberProgressSnapshots,
	pointsLedger,
	achievements,
	memberAchievements,
	conversations,
	conversationParticipants,
	messages,
	messageReadReceipts,
	notifications,
	auditLogs,
	orgSettings
} from './schema';

export type OptionalId<T> = Omit<T, 'id'> & { id?: string };

export type Department = InferSelectModel<typeof departments>;
export type NewDepartment = OptionalId<InferInsertModel<typeof departments>>;

export type User = InferSelectModel<typeof users>;
export type NewUser = OptionalId<InferInsertModel<typeof users>>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type MemberDatabaseConnection = InferSelectModel<typeof memberDatabaseConnections>;
export type NewMemberDatabaseConnection = OptionalId<InferInsertModel<typeof memberDatabaseConnections>>;

export type Task = InferSelectModel<typeof tasks>;
export type NewTask = OptionalId<InferInsertModel<typeof tasks>>;

export type TaskWeek = InferSelectModel<typeof taskWeeks>;
export type NewTaskWeek = OptionalId<InferInsertModel<typeof taskWeeks>>;

export type TaskTemplate = InferSelectModel<typeof taskTemplates>;
export type NewTaskTemplate = OptionalId<InferInsertModel<typeof taskTemplates>>;

export type TaskEvent = InferSelectModel<typeof taskEvents>;
export type NewTaskEvent = OptionalId<InferInsertModel<typeof taskEvents>>;

export type MemberProgressSnapshot = InferSelectModel<typeof memberProgressSnapshots>;
export type NewMemberProgressSnapshot = OptionalId<InferInsertModel<typeof memberProgressSnapshots>>;

export type PointsTransaction = InferSelectModel<typeof pointsLedger>;
export type NewPointsTransaction = OptionalId<InferInsertModel<typeof pointsLedger>>;

export type Achievement = InferSelectModel<typeof achievements>;
export type NewAchievement = OptionalId<InferInsertModel<typeof achievements>>;

export type MemberAchievement = InferSelectModel<typeof memberAchievements>;
export type NewMemberAchievement = OptionalId<InferInsertModel<typeof memberAchievements>>;

export type Conversation = InferSelectModel<typeof conversations>;
export type NewConversation = OptionalId<InferInsertModel<typeof conversations>>;

export type ConversationParticipant = InferSelectModel<typeof conversationParticipants>;
export type NewConversationParticipant = InferInsertModel<typeof conversationParticipants>;

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = OptionalId<InferInsertModel<typeof messages>>;

export type MessageReadReceipt = InferSelectModel<typeof messageReadReceipts>;
export type NewMessageReadReceipt = OptionalId<InferInsertModel<typeof messageReadReceipts>>;

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = OptionalId<InferInsertModel<typeof notifications>>;

export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = OptionalId<InferInsertModel<typeof auditLogs>>;

export type OrgSetting = InferSelectModel<typeof orgSettings>;
export type NewOrgSetting = InferInsertModel<typeof orgSettings>;

export type UserRole = 'CEO' | 'HEAD' | 'MEMBER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
export type TaskSource = 'MANUAL' | 'AI_WEEKLY' | 'HEAD_ASSIGNMENT';
export type PointsTransactionType =
	| 'INITIAL_GRANT'
	| 'TASK_COMPLETION'
	| 'OVERDUE_PENALTY'
	| 'MANUAL_ADJUSTMENT'
	| 'BONUS';
