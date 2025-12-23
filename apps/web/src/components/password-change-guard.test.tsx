import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PasswordChangeGuard from "./password-change-guard";

// Mock auth-client
const mockUseSession = vi.fn();
vi.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: () => mockUseSession(),
	},
	useSession: () => mockUseSession(),
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => mockPathname(),
}));

// Mock sonner
vi.mock("sonner", () => ({
	toast: {
		warning: vi.fn(),
	},
}));

describe("PasswordChangeGuard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("redirects to /change-password if mustChangePassword is true", async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: { mustChangePassword: true },
				session: {},
			},
			isPending: false,
		});
		mockPathname.mockReturnValue("/dashboard");

		render(
			<PasswordChangeGuard>
				<div>Content</div>
			</PasswordChangeGuard>,
		);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("/change-password");
		});
	});

	it("does not redirect if mustChangePassword is false", async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: { mustChangePassword: false },
				session: {},
			},
			isPending: false,
		});
		mockPathname.mockReturnValue("/dashboard");

		render(
			<PasswordChangeGuard>
				<div>Content</div>
			</PasswordChangeGuard>,
		);

		await waitFor(() => {
			expect(mockPush).not.toHaveBeenCalled();
		});
	});

	it("does not redirect if already on /change-password", async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: { mustChangePassword: true },
				session: {},
			},
			isPending: false,
		});
		mockPathname.mockReturnValue("/change-password");

		render(
			<PasswordChangeGuard>
				<div>Content</div>
			</PasswordChangeGuard>,
		);

		await waitFor(() => {
			expect(mockPush).not.toHaveBeenCalled();
		});
	});

	it("does not redirect if isPending is true", async () => {
		mockUseSession.mockReturnValue({
			data: null,
			isPending: true,
		});
		mockPathname.mockReturnValue("/dashboard");

		render(
			<PasswordChangeGuard>
				<div>Content</div>
			</PasswordChangeGuard>,
		);

		await waitFor(() => {
			expect(mockPush).not.toHaveBeenCalled();
		});
	});
});
