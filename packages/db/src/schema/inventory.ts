import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { stations } from "./geo";

// Enums
export const assetStatusEnum = pgEnum("asset_status", [
	"GOOD",
	"REPAIR",
	"DISPOSED",
	"LOST",
]);

export const transferStatusEnum = pgEnum("transfer_status", [
	"PENDING",
	"APPROVED",
	"COMPLETED",
	"CANCELLED",
]);

// Tables
export const inventory = pgTable("inventory", {
	id: text("id").primaryKey(),
	stationId: text("station_id")
		.references(() => stations.id)
		.notNull(),
	itemName: text("item_name").notNull(),
	category: text("category").notNull(),
	quantity: integer("quantity").notNull().default(0),
	unit: text("unit").default("pcs"), // e.g., "pcs", "pairs", "liters"
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const assets = pgTable("assets", {
	id: text("id").primaryKey(),
	stationId: text("station_id")
		.references(() => stations.id)
		.notNull(),
	name: text("name").notNull(),
	serialNumber: text("serial_number").unique(),
	category: text("category").notNull(),
	status: assetStatusEnum("status").default("GOOD").notNull(),
	acquiredAt: timestamp("acquired_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const assetTransfers = pgTable("asset_transfers", {
	id: text("id").primaryKey(),
	assetId: text("asset_id")
		.references(() => assets.id)
		.notNull(),
	fromStationId: text("from_station_id")
		.references(() => stations.id)
		.notNull(),
	toStationId: text("to_station_id")
		.references(() => stations.id)
		.notNull(),
	status: transferStatusEnum("status").default("PENDING").notNull(),
	requestedBy: text("requested_by")
		.references(() => user.id)
		.notNull(),
	approvedBy: text("approved_by").references(() => user.id),
	remarks: text("remarks"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Relations
export const inventoryRelations = relations(inventory, ({ one }) => ({
	station: one(stations, {
		fields: [inventory.stationId],
		references: [stations.id],
	}),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
	station: one(stations, {
		fields: [assets.stationId],
		references: [stations.id],
	}),
	transfers: many(assetTransfers),
}));

export const assetTransfersRelations = relations(assetTransfers, ({ one }) => ({
	asset: one(assets, {
		fields: [assetTransfers.assetId],
		references: [assets.id],
	}),
	fromStation: one(stations, {
		fields: [assetTransfers.fromStationId],
		references: [stations.id],
		relationName: "from_station",
	}),
	toStation: one(stations, {
		fields: [assetTransfers.toStationId],
		references: [stations.id],
		relationName: "to_station",
	}),
	requester: one(user, {
		fields: [assetTransfers.requestedBy],
		references: [user.id],
		relationName: "transfer_requester",
	}),
	approver: one(user, {
		fields: [assetTransfers.approvedBy],
		references: [user.id],
		relationName: "transfer_approver",
	}),
}));
