import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';
import {
	getOrCreateCurrentWeek,
	generateWeeklyDistribution,
	overrideProposalAssignment,
	publishWeeklyDistribution,
	type DistributionProposal
} from '$lib/server/services/aiTaskDistributionService';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals.user, 'CEO');

	const week = await getOrCreateCurrentWeek(locals.user!.id);
	const allUsers = await db.getAllUsers({ accountStatus: 'ACTIVE' });
	const eligibleMembers = allUsers.filter((u) => u.role !== 'CEO');
	const templates = await db.getTaskTemplates();
	const departments = await db.getDepartments();

	let proposal: DistributionProposal | null = null;
	if (week.configurationSnapshot) {
		try {
			proposal = JSON.parse(week.configurationSnapshot) as DistributionProposal;
		} catch {
			proposal = null;
		}
	}

	// Enrich proposal assignments with member and template details
	const enrichedAssignments = proposal?.assignments.map((a) => {
		const member = eligibleMembers.find((m) => m.id === a.memberId) || null;
		const dept = departments.find((d) => d.id === a.departmentId) || null;
		return {
			...a,
			memberName: member ? member.fullName : 'Unknown Member',
			memberRole: member ? member.role : '',
			departmentName: dept ? dept.name : 'Unknown Dept'
		};
	}) || [];

	return {
		week,
		proposal,
		assignments: enrichedAssignments,
		eligibleMembersCount: eligibleMembers.length,
		templatesCount: templates.length,
		departments
	};
};

export const actions: Actions = {
	generateDistribution: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const weekId = data.get('weekId') as string;

		if (!weekId) return fail(400, { error: 'Week ID is required' });

		try {
			const proposal = await generateWeeklyDistribution(weekId, locals.user!.id);
			return { success: true, count: proposal.assignments.length };
		} catch (err: any) {
			return fail(500, { error: err.message || 'Failed to generate weekly distribution' });
		}
	},

	overrideAssignment: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const weekId = data.get('weekId') as string;
		const memberId = data.get('memberId') as string;
		const title = (data.get('title') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		const priority = data.get('priority') as any;

		if (!weekId || !memberId || !title) {
			return fail(400, { error: 'Missing required override fields' });
		}

		await overrideProposalAssignment(
			weekId,
			memberId,
			{ title, description, priority },
			locals.user!.id
		);

		return { success: true };
	},

	removeAssignment: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const weekId = data.get('weekId') as string;
		const memberId = data.get('memberId') as string;

		const week = await db.getTaskWeekById(weekId);
		if (!week || !week.configurationSnapshot) return fail(404, { error: 'Week not found' });

		const proposal = JSON.parse(week.configurationSnapshot) as DistributionProposal;
		proposal.assignments = proposal.assignments.filter((a) => a.memberId !== memberId);
		proposal.unassignedMembers.push(memberId);

		await db.updateTaskWeek(weekId, {
			configurationSnapshot: JSON.stringify(proposal)
		});

		return { success: true };
	},

	publishDistribution: async ({ request, locals }) => {
		requireRole(locals.user, 'CEO');

		const data = await request.formData();
		const weekId = data.get('weekId') as string;

		if (!weekId) return fail(400, { error: 'Week ID is required' });

		try {
			const published = await publishWeeklyDistribution(weekId, locals.user!.id);
			return { success: true, publishedCount: published.length };
		} catch (err: any) {
			return fail(500, { error: err.message || 'Failed to publish distribution' });
		}
	}
};
