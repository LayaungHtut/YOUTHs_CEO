import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/auth/permissions';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals.user, 'CEO');

	const users = await db.getAllUsers({ accountStatus: 'ACTIVE' });
	const eligibleMembers = users.filter((u) => u.role !== 'CEO');
	const departments = await db.getDepartments();
	const allTasks = await db.getTasks();
	const allLedgers = await db.getAllPointsLedgers();

	// Calculate leaderboard
	const leaderboard = await Promise.all(
		eligibleMembers.map(async (m) => {
			const mTasks = allTasks.filter((t) => t.assignedTo === m.id);
			const completed = mTasks.filter((t) => t.status === 'COMPLETED').length;
			const overdue = mTasks.filter((t) => t.status === 'OVERDUE').length;
			const onTime = mTasks.filter(
				(t) => t.status === 'COMPLETED' && t.completedAt && t.completedAt <= t.deadline
			).length;
			const balance = await db.getUserPointsBalance(m.id);
			const dept = departments.find((d) => d.id === m.departmentId);

			const rate = mTasks.length > 0 ? Math.round((completed / mTasks.length) * 100) : 0;

			return {
				id: m.id,
				fullName: m.fullName,
				username: m.username,
				role: m.role,
				departmentName: dept?.name || 'Unassigned',
				balance,
				totalTasks: mTasks.length,
				completedCount: completed,
				onTimeCount: onTime,
				overdueCount: overdue,
				completionRate: rate
			};
		})
	);

	leaderboard.sort((a, b) => b.balance - a.balance);

	// Calculate department aggregates
	const departmentAnalytics = departments.map((d) => {
		const deptTasks = allTasks.filter((t) => t.departmentId === d.id);
		const deptCompleted = deptTasks.filter((t) => t.status === 'COMPLETED').length;
		const deptOverdue = deptTasks.filter((t) => t.status === 'OVERDUE').length;
		const deptMembers = eligibleMembers.filter((m) => m.departmentId === d.id);

		return {
			id: d.id,
			name: d.name,
			memberCount: deptMembers.length,
			taskCount: deptTasks.length,
			completedCount: deptCompleted,
			overdueCount: deptOverdue,
			completionRate: deptTasks.length > 0 ? Math.round((deptCompleted / deptTasks.length) * 100) : 0
		};
	});

	// Points totals
	const totalEarned = allLedgers
		.filter((l) => l.amount > 0)
		.reduce((acc, curr) => acc + curr.amount, 0);

	const totalDeducted = allLedgers
		.filter((l) => l.amount < 0)
		.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

	return {
		leaderboard,
		departmentAnalytics,
		totalEarned,
		totalDeducted,
		totalTransactions: allLedgers.length
	};
};
