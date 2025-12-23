import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import SignInForm from "./sign-in-form";

// Mock dependent components/hooks
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: vi.fn(() => ({ isPending: false })),
		signIn: {
			email: vi.fn(),
		},
	},
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("SignInForm", () => {
	const mockPush = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useRouter).mockReturnValue({
			push: mockPush,
		} as unknown as ReturnType<typeof useRouter>);
	});

	it("renders email and password inputs", () => {
		render(<SignInForm />);
		expect(screen.getByLabelText(/email/i)).toBeDefined();
		expect(screen.getByLabelText(/password/i)).toBeDefined();
		expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
	});

	it("validates empty inputs", async () => {
		render(<SignInForm />);

		const submitBtn = screen.getByRole("button", { name: /sign in/i });
		fireEvent.click(submitBtn);

		// Tanstack form validation might be async or immediate depending on config
		// Use waitFor to handle potential async validation state updates
		await waitFor(() => {
			// Check for HTML5 validation or UI error messages if displayed
			// Since our component maps field.state.meta.errors, we look for those
			// Note: The specific error messages defined in validators:
			// email: "Please enter a valid email address"
			// password: "Password is required"
			expect(
				screen.getByText(/Please enter a valid email address/i),
			).toBeDefined();
			expect(screen.getByText(/Password is required/i)).toBeDefined();
		});
	});

	it("calls authClient.signIn.email on valid submission", async () => {
		render(<SignInForm />);

		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const submitBtn = screen.getByRole("button", { name: /sign in/i });

		fireEvent.change(emailInput, { target: { value: "test@bfp.gov.ph" } });
		fireEvent.change(passwordInput, { target: { value: "password123" } });

		fireEvent.click(submitBtn);

		await waitFor(() => {
			expect(authClient.signIn.email).toHaveBeenCalledWith(
				{
					email: "test@bfp.gov.ph",
					password: "password123",
				},
				expect.any(Object), // The callbacks object
			);
		});
	});

	it("shows switch to sign up button if prop provided", () => {
		const onSwitch = vi.fn();
		render(<SignInForm onSwitchToSignUp={onSwitch} />);

		const switchBtn = screen.getByText(/sign up/i);
		expect(switchBtn).toBeDefined();

		fireEvent.click(switchBtn);
		expect(onSwitch).toHaveBeenCalled();
	});
});
