import dotenv from "dotenv";

dotenv.config({
	path: "../../apps/web/.env",
});

async function seedUsers() {
	// Dynamic imports to ensure dotenv loads first
	const { db } = await import("@BLMS/db");
	const { user } = await import("@BLMS/db/schema/auth");
	const { stations } = await import("@BLMS/db/schema/geo");
	const { eq } = await import("drizzle-orm");
	const { auth } = await import("./index");

	console.log("🌱 Starting User Seeding...");

	const usersToCreate = [
		{
			name: "Regional Admin",
			email: "admin@blms.com",
			password: "password123",
			role: "regional-admin",
			station: null,
		},
		{
			name: "Regional Director",
			email: "director@blms.com",
			password: "password123",
			role: "regional-director",
			station: null,
		},
		{
			name: "Regional Logistics Manager",
			email: "rlm@blms.com",
			password: "password123",
			role: "regional-logistics-manager",
			station: null,
		},
		{
			name: "Station Commander",
			email: "station_commander@blms.com",
			password: "password123",
			role: "station-commander",
			station: "Koronadal City Fire Station",
		},
		{
			name: "Supply Officer",
			email: "supply_officer@blms.com",
			password: "password123",
			role: "supply-officer",
			station: "Koronadal City Fire Station",
		},
	];

	for (const userData of usersToCreate) {
		try {
			console.log(`Processing ${userData.email}...`);

			// Check if user exists
			const existingUser = await db.query.user.findFirst({
				where: eq(user.email, userData.email),
			});

			if (existingUser) {
				console.log(`  ℹ️ User ${userData.email} already exists.`);
				// Ideally update role/station if needed, but for now skip
				continue;
			}

			// Create User using Better Auth
			// Note: signUpEmail usually requires a request context on server,
			// but api hooks might work if provided with dummy headers or if internal method exists.
			// Documentation for better-auth server-side usage suggests auth.api.signUpEmail
			// might fetch against the server URL if client, or wrap logic if server.
			// Since we are running this as a script, we rely on the direct DB adapter connection inside `auth`.

			const res = await auth.api.signUpEmail({
				body: {
					email: userData.email,
					password: userData.password,
					name: userData.name,
				},
			});

			if (!res?.user) {
				// Fallback: If signUpEmail fails in this context (e.g. headers missing),
				// we might need a trusted internal call.
				// However, let's try assuming it works or throw error.
				throw new Error("Failed to create user via Auth API");
			}

			console.log(`  ✅ Created user: ${userData.email}`);

			// Update Role and Station
			let stationId = null;
			let provinceId = null;

			if (userData.station) {
				const station = await db.query.stations.findFirst({
					where: eq(stations.name, userData.station),
				});
				if (station) {
					stationId = station.id;
					provinceId = station.provinceId;
				}
			}

			await db
				.update(user)
				.set({
					role: userData.role,
					stationId: stationId,
					provinceId: provinceId,
					mustChangePassword: false, // Test users shouldn't be forced immediately
				})
				.where(eq(user.email, userData.email));

			console.log(`  ✅ Updated role/station for: ${userData.email}`);
		} catch (error) {
			console.error(`  ❌ Failed to seed ${userData.email}:`, error);
		}
	}

	console.log("✅ User seeding completed!");
	process.exit(0);
}

seedUsers();
