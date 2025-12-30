import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Parse DATABASE_URL to check if it's a cloud provider
const connectionString = process.env.DATABASE_URL || "";

// Global type definition for caching the pool
// Use a unique key to prevent collisions with other libraries
const globalForDb = globalThis as unknown as {
	blmsPgPool: Pool | undefined;
};

// Create a connection pool with configuration optimized for cloud databases
const pool =
	globalForDb.blmsPgPool ??
	new Pool({
		connectionString,
		// Connection pool settings
		max: 20, // Increased to 20 to handle Drizzle Studio + Dev Server concurrency
		min: 1, // Minimum connections to keep ready
		idleTimeoutMillis: 60000, // Close idle connections after 60 seconds
		connectionTimeoutMillis: 30000, // Wait up to 30 seconds for a connection
		// Keep connections alive for cloud databases that may close idle connections
		keepAlive: true,
		keepAliveInitialDelayMillis: 5000,
		// SSL configuration for cloud databases
		ssl:
			connectionString.includes("supabase") ||
			connectionString.includes("neon") ||
			connectionString.includes("sslmode=require")
				? { rejectUnauthorized: false }
				: undefined,
	});

// Handle pool errors and logs efficiently
// We check against globalForDb.blmsPgPool to ensure we only attach listeners once
if (!globalForDb.blmsPgPool) {
	// Handle pool errors safely
	if (!globalForDb.blmsPgPool) {
		pool.on("error", (err) => {
			console.error("Unexpected database pool error:", err);
		});
	}

	if (process.env.NODE_ENV === "development") {
		pool.on("connect", () => {
			// console.log("Database pool: New client connected");
		});
		pool.on("remove", () => {
			// console.log("Database pool: Client removed");
		});
	}
}

// Save the pool to the global object in development
if (process.env.NODE_ENV !== "production") {
	globalForDb.blmsPgPool = pool;
}

export const db = drizzle(pool, { schema });

// Export pool for manual connection management if needed
export { pool };
