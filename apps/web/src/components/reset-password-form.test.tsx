import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import ResetPasswordForm from "./reset-password-form";

// Mock the auth client
vi.mock("@/lib/auth-client", () => ({
	authClient: {
		resetPassword: vi.fn(),
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

describe("ResetPasswordForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("submits the form with matchin passwords", async () => {
		render(<ResetPasswordForm />);

		const newPasswordInput = screen.getByLabelText(/^New Password/i);
		const confirmPasswordInput = screen.getByLabelText(
			/^Confirm New Password/i,
		);
		const submitButton = screen.getByRole("button", {
			name: /Reset Password/i,
		});

		fireEvent.change(newPasswordInput, {
			target: { value: "new-password-123" },
		});
		fireEvent.change(confirmPasswordInput, {
			target: { value: "new-password-123" },
		});

		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(authClient.resetPassword).toHaveBeenCalledWith(
				{
					newPassword: "new-password-123",
				},
				expect.any(Object),
			);
		});
	});

	it("validates password mismatch", async () => {
		render(<ResetPasswordForm />);

		const newPasswordInput = screen.getByLabelText(/^New Password/i);
		const confirmPasswordInput = screen.getByLabelText(
			/^Confirm New Password/i,
		);
		const submitButton = screen.getByRole("button", {
			name: /Reset Password/i,
		});

		fireEvent.change(newPasswordInput, {
			target: { value: "new-password-123" },
		});
		fireEvent.change(confirmPasswordInput, { target: { value: "mismatch" } });
		fireEvent.blur(confirmPasswordInput);
		fireEvent.click(submitButton);

		const errorMessage = await screen.findByText("Passwords do not match");
		expect(errorMessage).toBeTruthy();

		expect(authClient.resetPassword).not.toHaveBeenCalled();
	});
});
