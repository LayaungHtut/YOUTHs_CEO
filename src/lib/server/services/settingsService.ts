import { db } from '../db';
import { logAudit, AuditActions } from './auditService';

export async function getSetting<T = unknown>(key: string, defaultValue?: T): Promise<T> {
	const val = await db.getOrgSetting<T>(key);
	if (val === null || val === undefined) {
		return defaultValue as T;
	}
	return val;
}

export async function setSetting(key: string, value: unknown, actorId?: string) {
	const res = await db.setOrgSetting(key, value, actorId);
	await logAudit({
		actorId,
		action: AuditActions.SETTINGS_UPDATE,
		targetType: 'SETTINGS',
		targetId: key,
		metadata: { key, value }
	});
	return res;
}

export async function getAllSettings() {
	return await db.getAllOrgSettings();
}
