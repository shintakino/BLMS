import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import SignInForm from "./sign-in-form";

// Mock the auth client
vi.mock("@/lib/auth-client", () => ({
	authClient: {
		signIn: {
			email: vi.fn(),
		},
		useSession: vi.fn(() => ({
			data: null,
			isPending: false,
		})),
	},
}));

// Mock useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("SignInForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("submits the form with email and password", async () => {
		render(<SignInForm />);

		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const submitButton = screen.getByRole("button", { name: /sign in/i });

		fireEvent.change(emailInput, { target: { value: "test@example.com" } });
		fireEvent.change(passwordInput, { target: { value: "password123" } });

		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(authClient.signIn.email).toHaveBeenCalledWith(
				{
					email: "test@example.com",
					password: "password123",
				},
				expect.any(Object),
			);
		});
	});
});
