import dotenv from "dotenv";

dotenv.config({
	path: "../../apps/web/.env",
});

async function seedSupplyOfficerData() {
	// Dynamic imports
	const { db } = await import("@BLMS/db");
	const { user } = await import("@BLMS/db/schema/auth");
	const { stations } = await import("@BLMS/db/schema/geo");
	const { requests, requestItems } = await import("@BLMS/db/schema/logistics");
	const { inventory, assets } = await import("@BLMS/db/schema/inventory");
	const { eq } = await import("drizzle-orm");

	console.log("🌱 Starting Supply Officer Data Seeding...");

	// 1. Get User and Station
	const supplyOfficerEmail = "supply_officer@blms.com";
	const stationName = "Koronadal City Fire Station";

	const targetUser = await db.query.user.findFirst({
		where: eq(user.email, supplyOfficerEmail),
	});

	if (!targetUser) {
		console.error(
			`❌ User ${supplyOfficerEmail} not found. update your seed-test-users.ts first.`,
		);
		process.exit(1);
	}

	const targetStation = await db.query.stations.findFirst({
		where: eq(stations.name, stationName),
	});

	if (!targetStation) {
		console.error(`❌ Station ${stationName} not found.`);
		process.exit(1);
	}

	console.log(`✅ Found User: ${targetUser.email} (${targetUser.id})`);
	console.log(`✅ Found Station: ${targetStation.name} (${targetStation.id})`);

	// 2. Seed Requests
	const requestsToCreate = [
		{
			status: "DRAFT",
			priority: "NORMAL",
			justification: "Monthly office supplies replenishment",
			items: [
				{
					itemName: "Bond Paper (A4)",
					quantity: 10,
					category: "Office Supplies",
				},
				{
					itemName: "Ballpoint Pens (Black)",
					quantity: 50,
					category: "Office Supplies",
				},
			],
		},
		{
			status: "SUBMITTED",
			priority: "HIGH",
			justification: "Emergency replacement for busted tires",
			items: [
				{
					itemName: "Fire Truck Tire 11R22.5",
					quantity: 2,
					category: "Vehicle Parts",
				},
			],
		},
		{
			status: "APPROVED",
			priority: "NORMAL",
			justification: "Quarterly PPE procurement",
			items: [
				{ itemName: "Safety Helmet", quantity: 5, category: "PPE" },
				{ itemName: "Fire Retardant Gloves", quantity: 10, category: "PPE" },
			],
		},
		{
			status: "VALIDATED",
			priority: "NORMAL",
			justification: "Replacement for broken nozzle",
			items: [
				{ itemName: "Fire Hose Nozzle", quantity: 1, category: "Equipment" },
			],
		},
	];

	console.log("Processing Requests...");
	for (const reqData of requestsToCreate) {
		// Use a fixed ID based on user and index to avoid duplicates on re-runs if possible,
		// or just create new ones. For simplicity in this seed, we'll create new ones
		// but you might want to clear old ones first if you want a clean slate.
		// For now, let's just insert.

		const requestId = crypto.randomUUID();
		// @ts-expect-error - enum type mismatch in seed often happens, safe to ignore for seed
		await db.insert(requests).values({
			id: requestId,
			stationId: targetStation.id,
			// @ts-expect-error - enum type match
			status: reqData.status,
			// @ts-expect-error - enum type match
			priority: reqData.priority,
			justification: reqData.justification,
			createdBy: targetUser.id,
		});

		for (const item of reqData.items) {
			await db.insert(requestItems).values({
				id: crypto.randomUUID(),
				requestId: requestId,
				itemName: item.itemName,
				quantity: item.quantity,
				category: item.category,
			});
		}
	}
	console.log(`✅ Seeded ${requestsToCreate.length} requests.`);

	// 3. Seed Inventory
	const inventoryItems = [
		{
			itemName: "Fire Hose (1.5 inch)",
			quantity: 20,
			unit: "roll",
			category: "Equipment",
		},
		{
			itemName: "Fire Hose (2.5 inch)",
			quantity: 15,
			unit: "roll",
			category: "Equipment",
		},
		{ itemName: "Fireman Axe", quantity: 8, unit: "pcs", category: "Tools" },
		{ itemName: "SCBA Tank", quantity: 12, unit: "pcs", category: "Equipment" },
		{
			itemName: "Bond Paper (A4)",
			quantity: 45,
			unit: "ream",
			category: "Office Supplies",
		},
	];

	console.log("Processing Inventory...");
	for (const item of inventoryItems) {
		// Check if item exists to avoid duplicate stacking on re-runs
		const existingItem = await db.query.inventory.findFirst({
			where: (inventory, { eq, and }) =>
				and(
					eq(inventory.stationId, targetStation.id),
					eq(inventory.itemName, item.itemName),
				),
		});

		if (!existingItem) {
			await db.insert(inventory).values({
				id: crypto.randomUUID(),
				stationId: targetStation.id,
				itemName: item.itemName,
				quantity: item.quantity,
				unit: item.unit,
				category: item.category,
			});
		} else {
			// Optional: reset quantity
			// await db.update(inventory).set({ quantity: item.quantity }).where(eq(inventory.id, existingItem.id));
		}
	}
	console.log("✅ Seeded inventory items.");

	// 4. Seed Assets
	const assetsItems = [
		{
			name: "Rosenbauer Fire Truck",
			category: "Vehicle",
			status: "GOOD",
			serial: "FT-001",
		},
		{
			name: "Isuzu Fire Truck",
			category: "Vehicle",
			status: "REPAIR",
			serial: "FT-002",
		},
		{
			name: "MacBook Air M1",
			category: "Electronics",
			status: "GOOD",
			serial: "MBA-001",
		},
	];

	console.log("Processing Assets...");
	for (const asset of assetsItems) {
		const existingAsset = await db.query.assets.findFirst({
			where: (assets, { eq, and }) =>
				and(
					eq(assets.stationId, targetStation.id),
					eq(assets.serialNumber, asset.serial),
				),
		});

		if (!existingAsset) {
			await db.insert(assets).values({
				id: crypto.randomUUID(),
				stationId: targetStation.id,
				name: asset.name,
				category: asset.category,
				// @ts-expect-error - enum match
				status: asset.status,
				serialNumber: asset.serial,
				acquiredAt: new Date(),
			});
		}
	}
	console.log("✅ Seeded assets.");

	console.log("✅ Supply Officer Data Seeding Completed!");
	process.exit(0);
}

seedSupplyOfficerData();
