import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const auditLogs = pgTable("audit_logs", {
	id: text("id").primaryKey(),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	action: text("action").notNull(), // e.g., 'CREATE_REQUEST', 'APPROVE_REQUEST'
	entity: text("entity").notNull(), // e.g., 'request', 'inventory'
	entityId: text("entity_id").notNull(),
	details: jsonb("details"), // Store generic details about the change
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(user, {
		fields: [auditLogs.userId],
		references: [user.id],
	}),
}));
