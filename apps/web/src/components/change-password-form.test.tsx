import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import ChangePasswordForm from "./change-password-form";

// Mock the auth client
vi.mock("@/lib/auth-client", () => ({
	authClient: {
		changePassword: vi.fn(),
		useSession: vi.fn(() => ({
			data: { user: { id: "1", name: "Test User" } },
			isPending: false,
		})),
	},
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("ChangePasswordForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("submits the form with correct password data", async () => {
		render(<ChangePasswordForm />);

		const currentPasswordInput = screen.getByLabelText(/^Current Password/i);
		const newPasswordInput = screen.getByLabelText(/^New Password/i);
		const confirmPasswordInput = screen.getByLabelText(
			/^Confirm New Password/i,
		);
		const submitButton = screen.getByRole("button", {
			name: /Change Password/i,
		});

		fireEvent.change(currentPasswordInput, {
			target: { value: "old-password" },
		});
		fireEvent.change(newPasswordInput, {
			target: { value: "new-password-123" },
		});
		fireEvent.change(confirmPasswordInput, {
			target: { value: "new-password-123" },
		});

		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(authClient.changePassword).toHaveBeenCalledWith(
				{
					currentPassword: "old-password",
					newPassword: "new-password-123",
					revokeOtherSessions: true,
				},
				expect.any(Object),
			);
		});
	});

	it("shows validation error when passwords do not match", async () => {
		render(<ChangePasswordForm />);

		const currentPasswordInput = screen.getByLabelText(/^Current Password/i);
		const newPasswordInput = screen.getByLabelText(/^New Password/i);
		const confirmPasswordInput = screen.getByLabelText(
			/^Confirm New Password/i,
		);
		const submitButton = screen.getByRole("button", {
			name: /Change Password/i,
		});

		fireEvent.change(currentPasswordInput, {
			target: { value: "old-password" },
		});
		fireEvent.change(newPasswordInput, {
			target: { value: "new-password-123" },
		});
		fireEvent.change(confirmPasswordInput, { target: { value: "mismatch" } });

		// Trigger validation
		fireEvent.blur(confirmPasswordInput);
		fireEvent.click(submitButton);

		const errorMessage = await screen.findByText("Passwords do not match");
		expect(errorMessage).toBeTruthy();

		expect(authClient.changePassword).not.toHaveBeenCalled();
	});
});
