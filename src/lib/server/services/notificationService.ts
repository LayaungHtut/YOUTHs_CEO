import { db } from '../db';
import type { NewNotification, Notification } from '../db/types';

export async function createNotification(notif: NewNotification): Promise<Notification> {
	return await db.createNotification(notif);
}

export async function getNotifications(userId: string, limit = 20): Promise<Notification[]> {
	return await db.getNotificationsForUser(userId, limit);
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
	return await db.markNotificationRead(id);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
	await db.markAllNotificationsRead(userId);
}

export async function getUnreadCount(userId: string): Promise<number> {
	return await db.getUnreadNotificationCount(userId);
}
