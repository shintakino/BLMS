import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const regions = pgTable("regions", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const provinces = pgTable("provinces", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	regionId: text("region_id")
		.references(() => regions.id)
		.notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const cities = pgTable("cities", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	provinceId: text("province_id")
		.references(() => provinces.id)
		.notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const stations = pgTable("stations", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	cityId: text("city_id")
		.references(() => cities.id)
		.notNull(),
	provinceId: text("province_id")
		.references(() => provinces.id)
		.notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Relations
export const regionsRelations = relations(regions, ({ many }) => ({
	provinces: many(provinces),
}));

export const provincesRelations = relations(provinces, ({ one, many }) => ({
	region: one(regions, {
		fields: [provinces.regionId],
		references: [regions.id],
	}),
	cities: many(cities),
	stations: many(stations),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
	province: one(provinces, {
		fields: [cities.provinceId],
		references: [provinces.id],
	}),
	stations: many(stations),
}));

export const stationsRelations = relations(stations, ({ one }) => ({
	city: one(cities, {
		fields: [stations.cityId],
		references: [cities.id],
	}),
	province: one(provinces, {
		fields: [stations.provinceId],
		references: [provinces.id],
	}),
}));
