import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { stations } from "./geo";

export const requestStatusEnum = pgEnum("request_status", [
	"DRAFT",
	"SUBMITTED",
	"VALIDATED",
	"REJECTED",
	"REVIEWED",
	"APPROVED",
]);

export const requestPriorityEnum = pgEnum("request_priority", [
	"LOW",
	"NORMAL",
	"HIGH",
	"CRITICAL",
]);

export const requests = pgTable("requests", {
	id: text("id").primaryKey(),
	stationId: text("station_id")
		.references(() => stations.id)
		.notNull(),
	status: requestStatusEnum("status").default("DRAFT").notNull(),
	priority: requestPriorityEnum("priority").default("NORMAL").notNull(),
	justification: text("justification"),

	createdBy: text("created_by")
		.references(() => user.id)
		.notNull(),
	submittedAt: timestamp("submitted_at"),

	validatedBy: text("validated_by").references(() => user.id),
	validatedAt: timestamp("validated_at"),

	reviewedBy: text("reviewed_by").references(() => user.id),
	reviewedAt: timestamp("reviewed_at"),

	approvedBy: text("approved_by").references(() => user.id),
	approvedAt: timestamp("approved_at"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const requestItems = pgTable("request_items", {
	id: text("id").primaryKey(),
	requestId: text("request_id")
		.references(() => requests.id, { onDelete: "cascade" })
		.notNull(),
	itemName: text("item_name").notNull(),
	quantity: integer("quantity").notNull(),
	category: text("category").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const approvals = pgTable("approvals", {
	id: text("id").primaryKey(),
	requestId: text("request_id")
		.references(() => requests.id, { onDelete: "cascade" })
		.notNull(),
	userId: text("user_id")
		.references(() => user.id)
		.notNull(),
	role: text("role").notNull(), // Snapshot of the role at the time of approval
	action: text("action").notNull(), // 'VALIDATE', 'REJECT', 'APPROVE', 'REVIEW'
	remarks: text("remarks"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const requestsRelations = relations(requests, ({ one, many }) => ({
	station: one(stations, {
		fields: [requests.stationId],
		references: [stations.id],
	}),
	creator: one(user, {
		fields: [requests.createdBy],
		references: [user.id],
		relationName: "created_requests",
	}),
	validator: one(user, {
		fields: [requests.validatedBy],
		references: [user.id],
		relationName: "validated_requests",
	}),
	reviewer: one(user, {
		fields: [requests.reviewedBy],
		references: [user.id],
		relationName: "reviewed_requests",
	}),
	approver: one(user, {
		fields: [requests.approvedBy],
		references: [user.id],
		relationName: "approved_requests",
	}),
	items: many(requestItems),
	approvals: many(approvals),
}));

export const requestItemsRelations = relations(requestItems, ({ one }) => ({
	request: one(requests, {
		fields: [requestItems.requestId],
		references: [requests.id],
	}),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
	request: one(requests, {
		fields: [approvals.requestId],
		references: [requests.id],
	}),
	user: one(user, {
		fields: [approvals.userId],
		references: [user.id],
	}),
}));
