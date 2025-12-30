import { db } from "@BLMS/db";
import { auditLogs } from "@BLMS/db/schema/audit";
import crypto from "node:crypto";

export type AuditAction =
	| "USER_CREATE"
	| "USER_UPDATE"
	| "USER_DELETE"
	| "REQUEST_CREATE"
	| "REQUEST_VALIDATE"
	| "REQUEST_REJECT"
	| "REQUEST_CONSOLIDATE"
	| "REQUEST_APPROVE"
	| "REQUEST_FINAL_REJECT"
	| "REQUEST_SUBMIT"
	| "REQUEST_UPDATE"
	| "REQUEST_DELETE"
	| "INVENTORY_CREATE"
	| "INVENTORY_UPDATE"
	| "INVENTORY_DELETE"
	| "ASSET_CREATE"
	| "ASSET_UPDATE"
	| "ASSET_TRANSFER"
	| "LOGIN"
	| "LOGOUT"
	| "PASSWORD_CHANGE"
	| "STOCK_IN"
	| "STOCK_OUT";

export type AuditEntity =
	| "user"
	| "request"
	| "inventory"
	| "asset"
	| "session";

interface LogAuditParams {
	userId: string;
	action: AuditAction;
	entity: AuditEntity;
	entityId: string;
	details?: Record<string, unknown>;
}

/**
 * Log an audit event to the database
 */
export async function logAudit({
	userId,
	action,
	entity,
	entityId,
	details,
}: LogAuditParams): Promise<void> {
	try {
		await db.insert(auditLogs).values({
			id: crypto.randomUUID(),
			userId,
			action,
			entity,
			entityId,
			details: details ?? null,
			createdAt: new Date(),
		});
	} catch (error) {
		// Log to console but don't throw - audit logging shouldn't break main operations
		console.error("Failed to log audit event:", error);
	}
}
