import { expo } from '@better-auth/expo';
import { nextCookies } from 'better-auth/next-js';
import { db } from "@BLMS/db";
import * as schema from "@BLMS/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: schema,
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || "", "mybettertapp://", "exp://"],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies(), expo()]
});
