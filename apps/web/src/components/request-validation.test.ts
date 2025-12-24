import { describe, expect, it } from "vitest";
import { requestSchema } from "./request-form";

describe("Request Validation Logic (PRD FR-01)", () => {
	it("should accept valid request data", () => {
		const validData = {
			priority: "NORMAL",
			justification: "Critical supplies for station operation.",
			items: [{ itemName: "Fire Hose", quantity: 5, category: "Equipment" }],
		};
		const result = requestSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should reject empty justification", () => {
		const invalidData = {
			priority: "NORMAL",
			justification: "", // Too short
			items: [{ itemName: "Item", quantity: 1, category: "General" }],
		};
		const result = requestSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.justification).toBeDefined();
		}
	});

	it("should reject short justification (PRD requirement implied)", () => {
		const invalidData = {
			priority: "NORMAL",
			justification: "Short", // Min 10 chars per form
			items: [{ itemName: "Item", quantity: 1, category: "General" }],
		};
		const result = requestSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should require at least one item", () => {
		const invalidData = {
			priority: "NORMAL",
			justification: "Valid justification text here.",
			items: [],
		};
		const result = requestSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.items).toBeDefined();
		}
	});

	it("should enforce positive quantity", () => {
		const invalidData = {
			priority: "NORMAL",
			justification: "Valid justification text here.",
			items: [{ itemName: "Bad Item", quantity: 0, category: "General" }],
		};
		const result = requestSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});
