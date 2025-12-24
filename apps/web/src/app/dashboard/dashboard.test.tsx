import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "./dashboard";

// Mock child components to verify specialized rendering
vi.mock("./components/supply-officer-dashboard", () => ({
	default: () => (
		<div data-testid="supply-officer-dashboard">Supply Officer Dashboard</div>
	),
}));
vi.mock("./components/station-commander-dashboard", () => ({
	default: () => (
		<div data-testid="station-commander-dashboard">
			Station Commander Dashboard
		</div>
	),
}));
vi.mock("./components/rlm-dashboard", () => ({
	default: () => <div data-testid="rlm-dashboard">RLM Dashboard</div>,
}));
vi.mock("./components/regional-director-dashboard", () => ({
	default: () => (
		<div data-testid="regional-director-dashboard">
			Regional Director Dashboard
		</div>
	),
}));
vi.mock("./components/admin-dashboard", () => ({
	default: () => <div data-testid="admin-dashboard">Admin Dashboard</div>,
}));

describe("Dashboard Role Switching", () => {
	const createSession = (role: string) => ({
		user: {
			id: "1",
			email: "test@example.com",
			emailVerified: true,
			name: "Test User",
			createdAt: new Date(),
			updatedAt: new Date(),
			// biome-ignore lint/suspicious/noExplicitAny: allow testing invalid roles
			role: role as any,
			stationId: null,
			provinceId: null,
			image: null,
		},
		session: {
			id: "1",
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: "1",
			expiresAt: new Date(),
			token: "token",
			ipAddress: null,
			userAgent: null,
		},
	});

	it("renders Supply Officer dashboard", () => {
		render(<Dashboard session={createSession("supply-officer")} />);
		expect(screen.getByTestId("supply-officer-dashboard")).toBeDefined();
	});

	it("renders Station Commander dashboard", () => {
		render(<Dashboard session={createSession("station-commander")} />);
		expect(screen.getByTestId("station-commander-dashboard")).toBeDefined();
	});

	it("renders RLM dashboard", () => {
		render(<Dashboard session={createSession("regional-logistics-manager")} />);
		expect(screen.getByTestId("rlm-dashboard")).toBeDefined();
	});

	it("renders Regional Director dashboard", () => {
		render(<Dashboard session={createSession("regional-director")} />);
		expect(screen.getByTestId("regional-director-dashboard")).toBeDefined();
	});

	it("renders Admin dashboard", () => {
		render(<Dashboard session={createSession("regional-admin")} />);
		expect(screen.getByTestId("admin-dashboard")).toBeDefined();
	});

	it("renders fallback for unknown role", () => {
		render(<Dashboard session={createSession("unknown-role")} />);
		expect(screen.getByText(/Unknown Role/i)).toBeDefined();
	});
});
