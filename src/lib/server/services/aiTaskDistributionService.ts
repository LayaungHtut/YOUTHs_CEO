import { z } from 'zod';
import { db } from '../db';
import type { TaskWeek, User, TaskTemplate, Task } from '../db/types';
import { logAudit, AuditActions } from './auditService';
import { createNotification } from './notificationService';

// Schema for structured AI assignment proposal
export const AssignmentItemSchema = z.object({
	memberId: z.string(),
	templateId: z.string(),
	title: z.string(),
	description: z.string(),
	departmentId: z.string(),
	priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
	estimatedEffort: z.string(),
	reasoning: z.string()
});

export const DistributionProposalSchema = z.object({
	weekId: z.string(),
	assignments: z.array(AssignmentItemSchema),
	unassignedMembers: z.array(z.string()),
	generatedBy: z.enum(['OPENROUTER_AI', 'DETERMINISTIC_FALLBACK'])
});

export type AssignmentItem = z.infer<typeof AssignmentItemSchema>;
export type DistributionProposal = z.infer<typeof DistributionProposalSchema>;

export interface AIProviderConfig {
	apiKey?: string;
	model?: string;
	baseUrl?: string;
}

/**
 * Computes next Monday and Saturday dates for a weekly cycle
 */
export function getWeeklyCycleDates(referenceDate = new Date()): { weekStart: Date; weekEnd: Date } {
	const d = new Date(referenceDate);
	const day = d.getDay(); // 0 is Sunday, 1 is Monday, 6 is Saturday
	const diffToMonday = day === 0 ? -6 : 1 - day;

	const monday = new Date(d);
	monday.setDate(d.getDate() + diffToMonday);
	monday.setHours(0, 0, 0, 0);

	const saturday = new Date(monday);
	saturday.setDate(monday.getDate() + 5);
	saturday.setHours(23, 59, 59, 999);

	return { weekStart: monday, weekEnd: saturday };
}

/**
 * Deterministic fallback logic to match members with appropriate departmental templates
 */
export async function generateDeterministicAssignments(
	members: User[],
	templates: TaskTemplate[],
	weekId: string
): Promise<DistributionProposal> {
	const assignments: AssignmentItem[] = [];
	const unassignedMembers: string[] = [];

	// Map templates by department
	const deptTemplates = new Map<string, TaskTemplate[]>();
	for (const t of templates) {
		const list = deptTemplates.get(t.departmentId) || [];
		list.push(t);
		deptTemplates.set(t.departmentId, list);
	}

	for (let i = 0; i < members.length; i++) {
		const member = members[i];
		if (!member.departmentId) {
			unassignedMembers.push(member.id);
			continue;
		}

		const available = deptTemplates.get(member.departmentId) || [];
		if (available.length === 0) {
			unassignedMembers.push(member.id);
			continue;
		}

		// Distribute deterministically using round-robin among templates
		const template = available[i % available.length];
		assignments.push({
			memberId: member.id,
			templateId: template.id,
			title: template.title,
			description: template.description,
			departmentId: member.departmentId,
			priority: template.priority,
			estimatedEffort: template.estimatedEffort,
			reasoning: `Deterministic match for department skill requirements (${template.title}).`
		});
	}

	return {
		weekId,
		assignments,
		unassignedMembers,
		generatedBy: 'DETERMINISTIC_FALLBACK'
	};
}

/**
 * OpenRouter AI assignment engine
 */
export async function generateAIAssignments(
	members: User[],
	templates: TaskTemplate[],
	weekId: string,
	apiKey: string,
	model = 'anthropic/claude-3.5-sonnet'
): Promise<DistributionProposal> {
	if (!apiKey) {
		return await generateDeterministicAssignments(members, templates, weekId);
	}

	const prompt = `You are the AI Task Distribution Engine for YOUTHs organization.
Assign exactly 1 primary task to each active member based ONLY on their department and the available task templates.
Do NOT invent members, departments, or project templates.

Active Members:
${JSON.stringify(
	members.map((m) => ({
		id: m.id,
		name: m.fullName,
		departmentId: m.departmentId,
		role: m.role
	}))
)}

Available Templates:
${JSON.stringify(
	templates.map((t) => ({
		id: t.id,
		title: t.title,
		description: t.description,
		departmentId: t.departmentId,
		priority: t.priority,
		effort: t.estimatedEffort,
		skills: t.requiredSkills
	}))
)}

Respond with a strictly valid JSON object matching this schema:
{
  "weekId": "${weekId}",
  "assignments": [
    {
      "memberId": "uuid",
      "templateId": "uuid",
      "title": "template title",
      "description": "template description",
      "departmentId": "dept-id",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      "estimatedEffort": "e.g. 5 hours",
      "reasoning": "why this task fits the member"
    }
  ],
  "unassignedMembers": []
}`;

	try {
		const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
				'HTTP-Referer': 'https://youths-org.com',
				'X-Title': 'YOUTHs CEO Command Center'
			},
			body: JSON.stringify({
				model,
				messages: [
					{
						role: 'system',
						content:
							'You are an organizational task distribution assistant. Return only valid JSON without markdown wrapping.'
					},
					{ role: 'user', content: prompt }
				],
				temperature: 0.2,
				response_format: { type: 'json_object' }
			})
		});

		if (!res.ok) {
			console.warn('OpenRouter request failed, falling back to deterministic distribution');
			return await generateDeterministicAssignments(members, templates, weekId);
		}

		const data = await res.json();
		const rawContent = data.choices?.[0]?.message?.content;
		if (!rawContent) {
			return await generateDeterministicAssignments(members, templates, weekId);
		}

		const parsedJson = JSON.parse(rawContent.trim());
		const validated = DistributionProposalSchema.parse({
			...parsedJson,
			weekId,
			generatedBy: 'OPENROUTER_AI'
		});

		return validated;
	} catch (err) {
		console.warn('AI Distribution error, falling back to deterministic:', err);
		return await generateDeterministicAssignments(members, templates, weekId);
	}
}

/**
 * Initializes or fetches the current week distribution cycle
 */
export async function getOrCreateCurrentWeek(actorId?: string): Promise<TaskWeek> {
	const current = await db.getCurrentTaskWeek();
	if (current) return current;

	const { weekStart, weekEnd } = getWeeklyCycleDates();
	return await db.createTaskWeek({
		weekStart,
		weekEnd,
		distributionStatus: 'DRAFT',
		createdBy: actorId || null
	});
}

/**
 * Generates proposed task distribution for a given week
 */
export async function generateWeeklyDistribution(
	weekId: string,
	actorId: string
): Promise<DistributionProposal> {
	const week = await db.getTaskWeekById(weekId);
	if (!week) throw new Error('Week not found');

	// Collect eligible members (role MEMBER or HEAD, status ACTIVE)
	const allUsers = await db.getAllUsers({ accountStatus: 'ACTIVE' });
	const eligibleMembers = allUsers.filter((u) => u.role !== 'CEO');

	// Collect all active templates
	const templates = await db.getTaskTemplates();

	// Check AI provider setting
	const apiKeySetting = await db.getOrgSetting<{ value: string }>('ai.openrouter_api_key');
	const modelSetting = await db.getOrgSetting<{ value: string }>('ai.default_model');

	const proposal = await generateAIAssignments(
		eligibleMembers,
		templates,
		weekId,
		apiKeySetting?.value || process.env.OPENROUTER_API_KEY || '',
		modelSetting?.value || 'anthropic/claude-3.5-sonnet'
	);

	// Update week record with proposal snapshot
	await db.updateTaskWeek(weekId, {
		distributionStatus: 'PROPOSED',
		generatedAt: new Date(),
		configurationSnapshot: JSON.stringify(proposal)
	});

	await logAudit({
		actorId,
		action: AuditActions.DISTRIBUTION_GENERATE,
		targetType: 'DISTRIBUTION',
		targetId: weekId,
		metadata: {
			assignedCount: proposal.assignments.length,
			unassignedCount: proposal.unassignedMembers.length,
			generatedBy: proposal.generatedBy
		}
	});

	return proposal;
}

/**
 * Overrides or regenerates an individual assignment within a proposed week
 */
export async function overrideProposalAssignment(
	weekId: string,
	memberId: string,
	updates: Partial<AssignmentItem>,
	actorId: string
): Promise<DistributionProposal | null> {
	const week = await db.getTaskWeekById(weekId);
	if (!week || !week.configurationSnapshot) return null;

	const proposal = JSON.parse(week.configurationSnapshot) as DistributionProposal;
	const index = proposal.assignments.findIndex((a) => a.memberId === memberId);

	if (index >= 0) {
		proposal.assignments[index] = {
			...proposal.assignments[index],
			...updates
		};
	} else if (updates.templateId && updates.title) {
		proposal.assignments.push(updates as AssignmentItem);
		proposal.unassignedMembers = proposal.unassignedMembers.filter((id) => id !== memberId);
	}

	await db.updateTaskWeek(weekId, {
		configurationSnapshot: JSON.stringify(proposal)
	});

	await logAudit({
		actorId,
		action: AuditActions.DISTRIBUTION_OVERRIDE,
		targetType: 'DISTRIBUTION',
		targetId: weekId,
		metadata: { memberId, updates }
	});

	return proposal;
}

/**
 * Publishes the approved weekly task assignments to the official tasks table
 */
export async function publishWeeklyDistribution(
	weekId: string,
	actorId: string
): Promise<Task[]> {
	const week = await db.getTaskWeekById(weekId);
	if (!week) throw new Error('Week not found');
	if (!week.configurationSnapshot) throw new Error('No proposed distribution snapshot found to publish');

	const proposal = JSON.parse(week.configurationSnapshot) as DistributionProposal;
	const publishedTasks: Task[] = [];

	for (const item of proposal.assignments) {
		const task = await db.createTask({
			title: item.title,
			description: item.description,
			createdBy: actorId,
			assignedTo: item.memberId,
			departmentId: item.departmentId,
			source: 'AI_WEEKLY',
			priority: item.priority,
			status: 'PENDING',
			startDate: week.weekStart,
			deadline: week.weekEnd,
			estimatedEffort: item.estimatedEffort,
			pointsReward: 10,
			weekId: week.id
		});

		await db.createTaskEvent({
			taskId: task.id,
			actorId,
			eventType: 'CREATED',
			newValue: JSON.stringify({ source: 'AI_WEEKLY', weekId })
		});

		// Notify member
		await createNotification({
			userId: item.memberId,
			type: 'TASK_ASSIGNED',
			title: 'Weekly Task Published',
			message: `Your weekly task "${task.title}" is ready. Deadline is Saturday.`,
			referenceId: task.id
		});

		publishedTasks.push(task);
	}

	await db.updateTaskWeek(weekId, {
		distributionStatus: 'PUBLISHED',
		publishedAt: new Date()
	});

	await logAudit({
		actorId,
		action: AuditActions.DISTRIBUTION_PUBLISH,
		targetType: 'DISTRIBUTION',
		targetId: weekId,
		metadata: { tasksPublished: publishedTasks.length }
	});

	return publishedTasks;
}
