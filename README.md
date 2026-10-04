# 🏛️ YOUTHs CEO Command Center

> **App 1 of the YOUTHs Ecosystem**: Central organization management, member administration, department oversight, AI weekly task distribution, performance tracking, decentralized database synchronization, and executive communications.

---

## 📋 Executive Overview

**YOUTHs** (*Youth Opportunities United Through Human Skills*) is an organized collective structured across five specialized departments:

1. **Software Development** — Engineering, web, infrastructure, and technical toolchain.
2. **Graphic Design** — Brand identities, visual assets, creative media, and UI/UX design.
3. **Games & Esports** — Competitive gaming events, tournament operations, and game design.
4. **Merchandise & Branding** — Physical and digital apparel, promotional items, and partner branding.
5. **Finance & Operations** — Budgeting, logistics, governance, compliance, and organizational workflows.

The digital ecosystem is designed around three distinct, synchronized applications:
* **App 1: CEO Web (This Repository)** — Master administrative command center.
* **App 2: Head Web** — Departmental management and member oversight.
* **App 3: Member Web** — Personal task management, progress tracking, and achievements.

---

## 🚀 Key Features

### 1. Executive Setup & Secure Authentication
* **Single CEO First-Run Setup**: Enforces an atomic first-run setup flow at `/setup`. Once initialized, the setup route is permanently locked and cannot be re-executed.
* **Argon2id Password Hashing**: Complies with modern OWASP password recommendations (using `@node-rs/argon2`).
* **Session Security**: Uses cryptographically secure random session tokens, stored in HTTP-only, `SameSite=Lax` cookies, with automatic inactivity expiration.
* **Role-Based Access Control (RBAC)**: Strictly enforced at the server hook and action levels for `CEO`, `HEAD`, and `MEMBER` roles.

### 2. Member & Department Management
* **Manual Member Provisioning**: CEO creates member accounts with pre-assigned department, role (`MEMBER` or `HEAD`), temporary credentials, and personal synchronization tokens.
* **Head Promotion**: CEO can promote members to department heads or rotate leadership dynamically.
* **Account Status Lifecycle**: Immediate suspension, reactivation, and password reset workflows.
* **Audit Trail**: Every administrative action is immutably logged with actor, target, timestamp, and metadata diffs.

### 3. Task Management & AI Weekly Distribution
* **Dual Task Views**: Interactive Kanban Board (Pending, In Progress, Completed, Overdue, Cancelled) and tabular List view with multi-faceted filtering.
* **Multi-Member Task Cloning**: CEO can broadcast a task to multiple members simultaneously; each assignee receives an independent tracking instance.
* **Monday–Saturday Task Cycle**: Weekly distribution schedule runs automatically every Monday, aiming for a 1 task/member baseline with Saturday deadlines.
* **OpenRouter AI Integration**: AI engine analyzes member department, skills, and historical completion metrics to draft balanced assignments.
* **Deterministic Fallback Engine**: If AI is offline or API keys are missing, the system gracefully falls back to deterministic skill-and-workload matching.
* **CEO Review & Override**: AI proposals remain in `DRAFT` status until the CEO reviews, edits, replaces, or publishes them.

### 4. Transparent Points Ledger & Achievements
* **Starting Balance**: Every new member begins with 100 points.
* **Predictable Rules**:
  * `+10` points on on-time task completion.
  * `-10` points on overdue tasks.
  * Optional manual CEO adjustments with audited reasons.
* **Append-Only Ledger**: Balances are calculated dynamically by aggregating immutable ledger transactions (`points_ledger`). Transactions use idempotency keys (`task_complete_<id>`, `task_overdue_<id>`) to eliminate double-crediting.
* **Achievement Engine**: Automatic evaluation of badges for first tasks completed, high point milestones (200+, 500+), speed runs, and perfect weekly completion streaks.

### 5. Decentralized Member Database Synchronization
* **Zero Credential Sharing**: Members maintain individual Neon PostgreSQL databases under the free plan. The CEO Command Center **never** collects, requests, or stores raw member database credentials or passwords.
* **Contract v1 REST API**: Members push read-only progress snapshots to `POST /api/sync/progress` authenticated by high-entropy, SHA-256 hashed Bearer tokens (`yt_sync_...`).
* **Strict Payload Validation**: Zod schema verifies task states, completion percentages, and timestamps.
* **Ownership Integrity Checks**: Rejects any synchronization attempt if a member tries to submit or alter tasks belonging to another user.
* **Manual Fallback**: CEO can import progress records using standard CSV or JSON file uploads from the `/integrations` interface.

### 6. Real-Time Communications & Persistent Chat History
* **Database-Backed Conversation History**: All direct-message conversations between the CEO and members or department heads are permanently recorded in the central Neon database.
* **Cursor-Based Pagination**: Seamlessly loads older messages when scrolling upward via `GET /api/chat/messages?conversationId=...&cursor=...&limit=...`.
* **Chronological Flow & Day Dividers**: Messages render in strictly chronological order with date boundary separators.
* **Auditable Message Edits**: In-place edits are tracked with full change histories (`editHistory` JSON array containing previous text and edit timestamps).
* **Soft-Deletion Placeholders**: Messages can be soft-deleted (`deletedAt`), displaying an auditable tombstone in the chat history rather than destructively erasing the message.
* **Unread Indicators & Read Receipts**: Real-time unread badges on the conversation sidebar; reading a conversation automatically updates `lastReadAt` via `POST /api/chat/read`.
* **Isolated Multi-Facet Search**: Comprehensive search (`GET /api/chat/search`) across message text, participants, sender, and date ranges. Strictly enforces permission boundaries so users can only search conversations they are authorized to access.
* **Connection Resiliency**: SSE live connection status indicator with automatic reconnection and failed delivery retry.

### 7. Persistent Task History & Organization Activity Center
* **Immutable Task Lifecycle Tracking**: Every lifecycle event is permanently recorded in `task_events` with unique event ID, task ID, actor ID, actor role, event type, previous/new value diffs, reason, and source (`CEO`, `HEAD`, `MEMBER`, `AI`, `SYSTEM`).
* **Idempotent Event Ingestion**: Event recording utilizes deduplication keys (`idempotencyKey`) to prevent duplicate entries under race conditions or retry events.
* **Task Detail Timeline**: Dedicated visual timeline on `/tasks/[id]` detailing creation, assignments, deadline shifts, status updates, and point awards.
* **Searchable Task History Portal**: Full organization task history at `/tasks/history` allowing the CEO to filter by member, department, status, source, priority, event type, and date range.
* **Member Task History**: Granular task history on member profile pages (`/members/[id]`) with filtering by Status, Year, Month, and Week, tracking original vs. current deadlines and net point adjustments.
* **Historical Weekly Distribution Audit**: The AI weekly task distribution console (`/tasks/distribution`) preserves immutable assignment snapshots per cycle week, enabling post-cycle comparisons between planned assignments and actual execution.
* **Organization Activity Center**: Executive activity feed (`/activity`) aggregating task events, administrative audits, achievement unlocks, and chat signals.
* **Strict Message Privacy Protection**: Activity center notifications for direct messaging display activity signals without ever revealing private message content (`(Content hidden for privacy)`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [SvelteKit 5](https://svelte.dev/) with Svelte 5 Runes (`$state`, `$derived`, `$effect`, `$props`) |
| **Language** | TypeScript (Strict mode enabled) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with custom dark slate / indigo command-center palette |
| **Icons** | [Lucide Icons](https://lucide.dev/) (`@lucide/svelte`) |
| **ORM & Database** | [Drizzle ORM](https://orm.drizzle.team/) & [Neon Serverless PostgreSQL](https://neon.tech/) |
| **Local / Test DB** | Relational In-Memory Store with full schema parity and ACID idempotency |
| **Authentication** | Argon2id (`@node-rs/argon2`) + Secure HTTP-only cookies |
| **Validation** | [Zod](https://zod.dev/) schema enforcement |
| **AI Integration** | [OpenRouter API](https://openrouter.ai/) with deterministic fallback engine |
| **Testing** | [Vitest](https://vitest.dev/) (Unit, Service, and Integration test suites) |

---

## 📂 Project Structure

```
d:/YOUTHsOrg/YOUTHs_CEO/
├── src/
│   ├── app.d.ts                     # SvelteKit Locals & Session types
│   ├── app.html                     # HTML root template with dark background
│   ├── hooks.server.ts              # Route guarding, auth session extraction, /setup lock
│   ├── lib/
│   │   ├── index.ts                 # Library public exports
│   │   └── server/
│   │       ├── auth/
│   │       │   ├── auth.test.ts     # Vitest authentication tests
│   │       │   ├── password.ts      # Argon2id hashing & OWASP validation
│   │       │   ├── permissions.ts   # Role-based access control guards
│   │       │   └── session.ts       # Secure cookie sessions
│   │       ├── db/
│   │       │   ├── index.ts         # Unified DB client export
│   │       │   ├── schema.ts        # Drizzle PostgreSQL schema (16 tables)
│   │       │   ├── seed-data.ts     # Departments, achievements & settings seeds
│   │       │   ├── store.ts         # Relational database store with cursor pagination & history
│   │       │   └── types.ts         # Domain types & interfaces
│   │       └── services/
│   │           ├── achievementService.ts       # Achievement unlocks & streak checks
│   │           ├── activityService.ts          # Aggregated organization activity & privacy guards
│   │           ├── aiTaskDistributionService.ts# OpenRouter + deterministic task engine
│   │           ├── auditService.ts             # Immutable administrative audit logging
│   │           ├── chatHistory.test.ts         # Chat persistence, pagination, audit & search tests
│   │           ├── chatService.ts              # Messaging, cursor queries & SSE event emitter
│   │           ├── notificationService.ts      # In-app notifications
│   │           ├── pointsService.ts            # Append-only points ledger engine
│   │           ├── progressSyncService.ts      # Neon member DB sync & token hashing
│   │           ├── settingsService.ts          # Organization settings & AI configuration
│   │           ├── taskHistory.test.ts         # Task event lifecycle, audit & privacy tests
│   │           └── taskService.ts              # Task management & lifecycle event recording
│   └── routes/
│       ├── +layout.server.ts        # Session & user load
│       ├── +layout.svelte           # Command center navigation & sidebar
│       ├── +error.svelte            # Error & access denied display
│       ├── +page.server.ts          # Executive dashboard metrics & tasks
│       ├── +page.svelte             # Overview dashboard
│       ├── setup/                   # First-run CEO setup
│       ├── login/                   # Secure sign-in
│       ├── logout/                  # Session termination
│       ├── members/                 # Member management & creation
│       │   └── [id]/                # Individual profile, ledger, sync & task history
│       ├── departments/             # 5 core departments & Head assignment
│       ├── tasks/                   # Kanban board & list view
│       │   ├── [id]/                # Task lifecycle detail & audit events timeline
│       │   ├── distribution/        # AI weekly task distribution cycle & historical snapshots
│       │   └── history/             # Searchable organization task history
│       ├── activity/                # Organization Activity Center (privacy-preserving)
│       ├── progress/                # Leaderboards & department comparisons
│       ├── messages/                # Real-time chat, pagination, search & SSE stream
│       ├── achievements/            # Badge registry & creation
│       ├── integrations/            # Member database sync dashboard & CSV import
│       ├── audit-logs/              # Immutable audit trail inspector
│       ├── settings/                # Organization, AI & points configuration
│       └── api/
│           ├── ai/test/             # OpenRouter connection diagnostic
│           ├── chat/delete/         # Soft deletion endpoint
│           ├── chat/edit/           # Message edit endpoint
│           ├── chat/messages/       # Cursor-based message pagination endpoint
│           ├── chat/read/           # Read receipt endpoint
│           ├── chat/search/         # Multi-facet message search endpoint
│           ├── chat/send/           # Direct message dispatch
│           ├── chat/stream/         # Server-Sent Events (SSE) live feed
│           └── sync/progress/       # Member Neon DB sync endpoint (Contract v1)
├── drizzle.config.ts                # Drizzle ORM configuration for Neon
├── package.json                     # Scripts & dependencies
├── tsconfig.json                    # Strict TypeScript configuration
└── vite.config.ts                   # Vite + SvelteKit + Tailwind v4 build setup
```

---

## ⚙️ Getting Started

### Prerequisites
* **Node.js** >= 18.x (tested on v24.x)
* **npm** >= 9.x
* *(Optional)* A free-tier [Neon PostgreSQL](https://neon.tech/) database URL.
* *(Optional)* An [OpenRouter API Key](https://openrouter.ai/) for LLM task generation.

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/youths-org/youths-ceo.git
cd youths-ceo
npm install
```

### 2. Environment Configuration
Copy the `.env.example` template:
```bash
cp .env.example .env
```
Fill in the appropriate configuration values:
```env
# Optional: Neon PostgreSQL connection string (falls back to memory store if omitted)
DATABASE_URL="postgresql://user:password@ep-youths.us-east-2.aws.neon.tech/youths_ceo?sslmode=require"

# Optional: OpenRouter API for AI weekly task distribution
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"

# Optional: Extra security secret for initial CEO setup
CEO_SETUP_SECRET=""
```

### 3. Database Migration (Optional for Neon DB)
When connecting to a remote Neon database instance:
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### 4. Running the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

The application includes comprehensive Vitest unit and integration test suites:

```bash
# Run all automated tests
npm run test

# Run Svelte and TypeScript diagnostic checks
npm run check

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Verified Test Suites (30/30 Tests Passing):
* ✅ `auth.test.ts` — Password validation, Argon2id hashing, session token expiration.
* ✅ `pointsService.test.ts` — Starting balance, on-time completion (+10), overdue penalties (-10), idempotency deduplication.
* ✅ `achievementService.test.ts` — Badge evaluation, criteria parsing, unlock notifications.
* ✅ `aiTaskDistributionService.test.ts` — Monday-Saturday cycle date calculation, 1 task/member distribution, deterministic fallback.
* ✅ `progressSyncService.test.ts` — Contract v1 schema validation, Bearer token hashing, anti-tampering ownership protection.
* ✅ `chatHistory.test.ts` — Persistent DM sessions, cursor pagination (scrolling up), date separators, edit history audit, soft deletion placeholders, permission-isolated search, and unread counts.
* ✅ `taskHistory.test.ts` — Permanent lifecycle event recording, actor role and source tracking, reassignment audit, deadline extensions, member task history filtering, idempotency deduplication, published cycle snapshot preservation, and activity feed chat privacy preservation.

---

## 🔒 Security Architecture

1. **First-Run Lock**: The `/setup` endpoint automatically inspects the database. As soon as a user with role `CEO` exists, all further setup requests are blocked with HTTP 403 Forbidden.
2. **Encrypted at Rest**: Member synchronization tokens are hashed using SHA-256 before storage. Plaintext tokens are shown once at creation time and never stored in plaintext.
3. **Decentralized Independence**: Member databases are never accessed directly via raw SQL or external connection pooling. Synchronization is purely push-based, read-only, and authenticated via scoped tokens.
4. **Chat & Task Privacy**: Chat message contents are strictly excluded from AI prompts and organization activity feeds. The Activity Center generates sanitized activity indicators without exposing message bodies.
5. **Audit Logging & Event Immutability**: Every sensitive administrative action and task transition is permanently recorded in `audit_logs` or `task_events`. Past events cannot be overwritten or altered.

---

## 📜 License & Ownership
Copyright © 2026 **YOUTHs (Youth Opportunities United Through Human Skills)**. All rights reserved.
Developed for internal executive governance and organizational management.
