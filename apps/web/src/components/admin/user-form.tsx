"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

interface UserFormProps {
	user?: {
		id: string;
		name: string | null;
		email: string;
		role: string | null;
		stationId: string | null;
		provinceId: string | null;
	};
	onSuccess: () => void;
	onCancel: () => void;
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
	const isEdit = !!user;
	const [isSubmitting, setIsSubmitting] = useState(false);

	// State for form fields
	const [name, setName] = useState(user?.name || "");
	const [email, setEmail] = useState(user?.email || "");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [role, setRole] = useState(user?.role || "");
	const [stationId, setStationId] = useState(user?.stationId || "");

	// Station search state
	const [stationSearchOpen, setStationSearchOpen] = useState(false);
	const [stationSearch, setStationSearch] = useState("");

	const { data: stations } = useQuery({
		queryKey: ["admin", "listStations"],
		queryFn: () => client.admin.listStations({}),
	});

	const isStationRole =
		role === "supply-officer" || role === "station-commander";

	// Filter stations based on search
	const filteredStations = useMemo(() => {
		if (!stations) return [];
		if (!stationSearch) return stations;
		return stations.filter((s) =>
			s.name.toLowerCase().includes(stationSearch.toLowerCase()),
		);
	}, [stations, stationSearch]);

	// Get selected station name for display
	const selectedStation = stations?.find((s) => s.id === stationId);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (isEdit) {
				await client.admin.updateUser({
					id: user.id,
					role: role || undefined,
					stationId: stationId || null,
				});
				toast.success("User updated");
			} else {
				if (!password) {
					toast.error("Password is required for new users");
					setIsSubmitting(false);
					return;
				}
				if (password !== confirmPassword) {
					toast.error("Passwords do not match");
					setIsSubmitting(false);
					return;
				}
				await client.admin.createUser({
					name,
					email,
					password,
					role,
					stationId: stationId || undefined,
				});
				toast.success("User created");
			}
			onSuccess();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Unknown error";
			toast.error(isEdit ? "Failed to update user" : "Failed to create user", {
				description: message,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid gap-4 py-4">
				{/* Name */}
				<div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
					<Label htmlFor="name" className="text-left sm:text-right">
						Name
					</Label>
					<div className="sm:col-span-3">
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={isEdit}
							required={!isEdit}
						/>
					</div>
				</div>

				{/* Email */}
				<div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
					<Label htmlFor="email" className="text-left sm:text-right">
						Email
					</Label>
					<div className="sm:col-span-3">
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={isEdit}
							required={!isEdit}
						/>
					</div>
				</div>

				{/* Password (only for new users) */}
				{!isEdit && (
					<>
						<div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
							<Label htmlFor="password" className="text-left sm:text-right">
								Password
							</Label>
							<div className="sm:col-span-3">
								<Input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									minLength={8}
									placeholder="Min 8 characters"
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
							<Label
								htmlFor="confirmPassword"
								className="text-left sm:text-right"
							>
								Confirm
							</Label>
							<div className="sm:col-span-3">
								<Input
									id="confirmPassword"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
									placeholder="Confirm password"
								/>
								{confirmPassword && password !== confirmPassword && (
									<p className="mt-1 text-red-500 text-xs">
										Passwords do not match
									</p>
								)}
							</div>
						</div>
					</>
				)}

				{/* Role */}
				<div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
					<Label htmlFor="role" className="text-left sm:text-right">
						Role
					</Label>
					<div className="sm:col-span-3">
						<Select value={role} onValueChange={(val) => setRole(val ?? "")}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="supply-officer">Supply Officer</SelectItem>
								<SelectItem value="station-commander">
									Station Commander
								</SelectItem>
								<SelectItem value="regional-logistics-manager">
									Regional Logistics Manager
								</SelectItem>
								<SelectItem value="regional-director">
									Regional Director
								</SelectItem>
								<SelectItem value="regional-admin">Regional Admin</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Station (only for station roles) - Searchable */}
				{isStationRole && (
					<div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
						<Label htmlFor="station" className="text-left sm:text-right">
							Station
						</Label>
						<div className="sm:col-span-3">
							<Popover
								open={stationSearchOpen}
								onOpenChange={setStationSearchOpen}
							>
								<PopoverTrigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring">
									<span
										className={cn(!selectedStation && "text-muted-foreground")}
									>
										{selectedStation?.name || "Select station..."}
									</span>
									<ChevronsUpDown className="h-4 w-4 opacity-50" />
								</PopoverTrigger>
								<PopoverContent className="w-[300px] p-0" align="start">
									<div className="p-2">
										<Input
											placeholder="Search stations..."
											value={stationSearch}
											onChange={(e) => setStationSearch(e.target.value)}
											className="h-9"
										/>
									</div>
									<div className="max-h-[200px] overflow-y-auto">
										{filteredStations.length === 0 ? (
											<div className="py-6 text-center text-muted-foreground text-sm">
												No station found.
											</div>
										) : (
											filteredStations.map((s) => (
												<button
													type="button"
													key={s.id}
													className={cn(
														"relative flex w-full cursor-pointer select-none items-center border-0 px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
														stationId === s.id && "bg-accent",
													)}
													onClick={() => {
														setStationId(s.id);
														setStationSearchOpen(false);
														setStationSearch("");
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															setStationId(s.id);
															setStationSearchOpen(false);
															setStationSearch("");
														}
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															stationId === s.id ? "opacity-100" : "opacity-0",
														)}
													/>
													{s.name}
												</button>
											))
										)}
									</div>
								</PopoverContent>
							</Popover>
						</div>
					</div>
				)}
			</div>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{isEdit ? "Save Changes" : "Create User"}
				</Button>
			</div>
		</form>
	);
}
