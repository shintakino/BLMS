import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RequestActions from "./request-actions";

// Mock dependencies
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

// Mock QueryClient
vi.mock("@tanstack/react-query", () => ({
	useQueryClient: vi.fn(),
	useMutation: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock("@/utils/orpc", () => ({
	orpc: {
		useUtils: vi.fn(() => ({ logistics: { invalidate: vi.fn() } })),
		logistics: {
			validate: { useMutation: vi.fn(() => ({ mutateAsync: vi.fn() })) },
			consolidate: { useMutation: vi.fn(() => ({ mutateAsync: vi.fn() })) },
			finalApprove: { useMutation: vi.fn(() => ({ mutateAsync: vi.fn() })) },
		},
	},
}));

describe("RequestActions", () => {
	it("renders Validate/Reject for Station Commander on SUBMITTED request", () => {
		render(
			<RequestActions
				requestId="1"
				currentStatus="SUBMITTED"
				userRole="station-commander"
			/>,
		);
		expect(screen.getByText("Validate")).toBeDefined();
		expect(screen.getByText("Reject")).toBeDefined();
	});

	it("does NOT render actions for Station Commander on wrong status", () => {
		render(
			<RequestActions
				requestId="1"
				currentStatus="VALIDATED"
				userRole="station-commander"
			/>,
		);
		expect(screen.queryByText("Validate")).toBeNull();
	});

	it("renders Review/Reject for RLM on VALIDATED request", () => {
		render(
			<RequestActions
				requestId="1"
				currentStatus="VALIDATED"
				userRole="regional-logistics-manager"
			/>,
		);
		expect(screen.getByText("Review & Consolidate")).toBeDefined();
		expect(screen.getByText("Return/Reject")).toBeDefined();
	});

	it("renders Approve/Disapprove for Regional Director on REVIEWED request", () => {
		render(
			<RequestActions
				requestId="1"
				currentStatus="REVIEWED"
				userRole="regional-director"
			/>,
		);
		expect(screen.getByText("Grant Final Approval")).toBeDefined();
		expect(screen.getByText("Disapprove")).toBeDefined();
	});
});
