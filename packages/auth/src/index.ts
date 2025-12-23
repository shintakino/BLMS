import { db } from "@BLMS/db";
import * as schema from "@BLMS/db/schema/auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import nodemailer from "nodemailer";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: schema,
	}),
	user: {
		additionalFields: {
			mustChangePassword: {
				type: "boolean",
				required: false,
				defaultValue: false,
				input: false, // Cannot be set during registration (since we don't have open registration)
			},
			role: {
				type: "string",
				required: false,
				input: false,
			},
			stationId: {
				type: "string",
				required: false,
				input: false,
			},
			provinceId: {
				type: "string",
				required: false,
				input: false,
			},
		},
	},
	trustedOrigins: [process.env.CORS_ORIGIN || "", "mybettertapp://", "exp://"],
	emailAndPassword: {
		enabled: true,
		async sendResetPassword(data) {
			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASSWORD,
				},
			});

			await transporter.sendMail({
				from: process.env.SMTP_FROM || process.env.SMTP_USER,
				to: data.user.email,
				subject: "Reset your password",
				text: `Click the link to reset your password: ${data.url}`,
				html: `<a href="${data.url}">Reset Password</a>`,
			});
		},
	},
	plugins: [nextCookies(), expo()],
});
