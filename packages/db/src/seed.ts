import { eq } from "drizzle-orm";
import stationsData from "../../../bfp_stations.json";
import { db } from "./index";

import { cities, provinces, regions, stations } from "./schema/geo";

async function seed() {
	console.log("🌱 Starting seeding...");

	try {
		// 1. Seed Region
		const regionData = stationsData.region;
		const existingRegion = await db.query.regions.findFirst({
			where: eq(regions.name, regionData.name),
		});

		let regionId = existingRegion?.id;
		if (!existingRegion) {
			const insertedRegions = await db
				.insert(regions)
				.values({
					id: crypto.randomUUID(),
					name: regionData.name,
				})
				.returning();

			if (!insertedRegions[0]) throw new Error("Failed to insert region");
			regionId = insertedRegions[0].id; // Safe access
			console.log(`✅ Region seeded: ${regionData.name}`);
		} else {
			console.log(`ℹ️ Region already exists: ${regionData.name}`);
		}

		// 2. Seed Provinces
		for (const prov of regionData.provinces) {
			const existingProv = await db.query.provinces.findFirst({
				where: eq(provinces.name, prov.name),
			});

			let provinceId = existingProv?.id;
			if (!existingProv) {
				const insertedProvs = await db
					.insert(provinces)
					.values({
						id: crypto.randomUUID(),
						name: prov.name,
						regionId:
							regionId ??
							(() => {
								throw new Error("Region ID missing");
							})(),
					})
					.returning();

				if (!insertedProvs[0])
					throw new Error(`Failed to insert province ${prov.name}`);
				provinceId = insertedProvs[0].id;
				console.log(`  ✅ Province seeded: ${prov.name}`);
			} else {
				console.log(`  ℹ️ Province already exists: ${prov.name}`);
			}

			// 3. Seed Cities & Stations
			if (prov.cities) {
				for (const city of prov.cities) {
					if (!provinceId)
						throw new Error(`Province ID missing for ${prov.name}`);
					await seedCityAndStations(city.name, city.stations, provinceId);
				}
			}

			// 4. Seed Municipalities & Stations
			if (prov.municipalities) {
				for (const mun of prov.municipalities) {
					if (!provinceId)
						throw new Error(`Province ID missing for ${prov.name}`);
					await seedCityAndStations(mun.name, mun.stations, provinceId);
				}
			}
		}

		console.log("✅ Seeding completed successfully!");
	} catch (error) {
		console.error("❌ Seeding failed:", error);
		process.exit(1);
	} finally {
		process.exit(0);
	}
}

async function seedCityAndStations(
	cityName: string,
	stationNames: string[],
	provinceId: string,
) {
	const existingCity = await db.query.cities.findFirst({
		where: eq(cities.name, cityName),
	});

	let cityId = existingCity?.id;
	if (!existingCity) {
		const insertedCities = await db
			.insert(cities)
			.values({
				id: crypto.randomUUID(),
				name: cityName,
				provinceId: provinceId,
			})
			.returning();

		if (!insertedCities[0])
			throw new Error(`Failed to insert city ${cityName}`);
		cityId = insertedCities[0].id;
		console.log(`    ✅ City/Mun seeded: ${cityName}`);
	}

	for (const stationName of stationNames) {
		const existingStation = await db.query.stations.findFirst({
			where: eq(stations.name, stationName),
		});

		if (!existingStation) {
			await db.insert(stations).values({
				id: crypto.randomUUID(),
				name: stationName,
				cityId:
					cityId ??
					(() => {
						throw new Error("City ID missing");
					})(),
				provinceId: provinceId,
			});
			console.log(`      ✅ Station seeded: ${stationName}`);
		}
	}
}

seed();
