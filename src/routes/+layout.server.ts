import { db } from '$lib/server/db';
import { getNotifications, getUnreadCount } from '$lib/server/services/notificationService';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = locals.user;
	if (!user) {
		return {
			user: null,
			unreadNotifications: 0,
			notifications: [],
			path: url.pathname
		};
	}
	const unreadNotifications = await getUnreadCount(user.id);
	const notifications = await getNotifications(user.id, 5);
	return {
		user: {
			id: user.id,
			fullName: user.fullName,
			username: user.username,
			email: user.email,
			role: user.role,
			avatarUrl: user.avatarUrl,
			departmentId: user.departmentId
		},
		unreadNotifications,
		notifications,
		path: url.pathname
	};
};

