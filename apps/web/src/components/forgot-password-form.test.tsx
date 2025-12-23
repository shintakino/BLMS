import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import ForgotPasswordForm from "./forgot-password-form";

// Mock the auth client
vi.mock("@/lib/auth-client", () => ({
	authClient: {
		requestPasswordReset: vi.fn(),
	},
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("ForgotPasswordForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("submits the form with email", async () => {
		render(<ForgotPasswordForm />);

		const emailInput = screen.getByLabelText(/email/i);
		const submitButton = screen.getByRole("button", {
			name: /Send Reset Link/i,
		});

		fireEvent.change(emailInput, { target: { value: "test@example.com" } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(authClient.requestPasswordReset).toHaveBeenCalledWith(
				{
					email: "test@example.com",
					redirectTo: "/reset-password",
				},
				expect.any(Object),
			);
		});
	});
});
