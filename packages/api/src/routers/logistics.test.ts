import { beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to define the mock procedure factory before vi.mock runs
const { createMockProcedure } = vi.hoisted(() => {
	const createMockProcedure = () => {
		const mockProcedure = {
			input: vi.fn(() => mockProcedure),
			handler: vi.fn(() => mockProcedure),
			use: vi.fn(() => mockProcedure),
			middleware: vi.fn(() => mockProcedure),
		};
		return mockProcedure;
	};
	return { createMockProcedure };
});

// Mock the index module to provide mock procedures
vi.mock("../index", () => ({
	publicProcedure: createMockProcedure(),
	protectedProcedure: createMockProcedure(),
	supplyOfficerProcedure: createMockProcedure(),
	stationCommanderProcedure: createMockProcedure(),
	rlmProcedure: createMockProcedure(),
	regionalDirectorProcedure: createMockProcedure(),
	adminProcedure: createMockProcedure(),
}));

// Mock the db module
vi.mock("@BLMS/db", () => ({
	db: {
		transaction: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		query: {
			requests: { findFirst: vi.fn(), findMany: vi.fn() },
		},
	},
}));

// Import after mocking
import { logisticsRouter } from "./logistics";

describe("Logistics Router Structure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should have create procedure", () => {
		expect(logisticsRouter).toHaveProperty("create");
	});

	it("should have validate procedure", () => {
		expect(logisticsRouter).toHaveProperty("validate");
	});

	it("should have consolidate procedure for RLM", () => {
		expect(logisticsRouter).toHaveProperty("consolidate");
	});

	it("should have finalApprove procedure for Regional Director", () => {
		expect(logisticsRouter).toHaveProperty("finalApprove");
	});
});
