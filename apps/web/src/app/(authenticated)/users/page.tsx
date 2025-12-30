"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	AlertTriangle,
	Copy,
	Loader2,
	MoreHorizontal,
	Plus,
	Trash2,
	UserCog,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import UserForm from "@/components/admin/user-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { client } from "@/utils/orpc";

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: complex user type
	const [editingUser, setEditingUser] = useState<any>(null);
	// biome-ignore lint/suspicious/noExplicitAny: complex user type
	const [deletingUser, setDeletingUser] = useState<any>(null);

	const {
		data: users,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["admin", "listUsers"],
		queryFn: () => client.admin.listUsers({}),
	});

	const { mutate: deleteUser, isPending: isDeleting } = useMutation({
		mutationFn: (id: string) => client.admin.deleteUser({ id }),
		onSuccess: () => {
			toast.success("User deleted successfully");
			setDeletingUser(null);
			refetch();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete user");
		},
	});

	// Fetch stations to map IDs to names
	const { data: stations } = useQuery({
		queryKey: ["admin", "listStations"],
		queryFn: () => client.admin.listStations({}),
	});

	// Create a map for quick lookup
	const stationMap = new Map(stations?.map((s) => [s.id, s.name]) ?? []);

	// Client-side filtering
	const filteredUsers = useMemo(() => {
		if (!users) return [];
		return users.filter(
			(user) =>
				user.name?.toLowerCase().includes(search.toLowerCase()) ||
				user.email.toLowerCase().includes(search.toLowerCase()) ||
				user.role?.toLowerCase().includes(search.toLowerCase()),
		);
	}, [users, search]);

	// Pagination logic
	const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
	const paginatedUsers = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredUsers, currentPage]);

	// Reset to page 1 when search changes
	const handleSearchChange = (value: string) => {
		setSearch(value);
		setCurrentPage(1);
	};

	const handleSuccess = () => {
		setIsCreateOpen(false);
		setEditingUser(null);
		refetch();
	};

	// Generate page numbers to display
	const getPageNumbers = () => {
		const pages: (number | "ellipsis")[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (currentPage > 3) pages.push("ellipsis");
			for (
				let i = Math.max(2, currentPage - 1);
				i <= Math.min(totalPages - 1, currentPage + 1);
				i++
			) {
				pages.push(i);
			}
			if (currentPage < totalPages - 2) pages.push("ellipsis");
			pages.push(totalPages);
		}
		return pages;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight">User Management</h2>
					<p className="text-muted-foreground">
						Manage system access and roles.
					</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Add User
				</Button>
			</div>

			{/* Search */}
			<div className="flex w-full max-w-sm items-center space-x-2">
				<Input
					placeholder="Search users..."
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
					className="h-9"
				/>
			</div>

			{/* Table */}
			<div className="rounded-md border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Station/Location</TableHead>
							<TableHead>Created At</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center">
									<Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
								</TableCell>
							</TableRow>
						) : paginatedUsers.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-24 text-center text-muted-foreground"
								>
									No users found.
								</TableCell>
							</TableRow>
						) : (
							paginatedUsers.map((user) => (
								<TableRow key={user.id}>
									<TableCell className="font-medium">
										{user.name || "N/A"}
									</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<Badge variant="outline" className="capitalize">
											{user.role?.replace(/-/g, " ") || "No Role"}
										</Badge>
									</TableCell>
									<TableCell>
										{user.stationId ? (
											<span className="text-sm">
												{stationMap.get(user.stationId) || user.stationId}
											</span>
										) : user.provinceId ? (
											<span className="text-muted-foreground text-sm">
												Regional
											</span>
										) : (
											<span className="text-muted-foreground">-</span>
										)}
									</TableCell>
									<TableCell className="text-muted-foreground text-xs">
										{format(new Date(user.createdAt), "MMM d, yyyy")}
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center whitespace-nowrap rounded-md font-medium text-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
												<span className="sr-only">Open menu</span>
												<MoreHorizontal className="h-4 w-4" />
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuGroup>
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuItem
														onClick={() => {
															navigator.clipboard.writeText(user.id);
															toast.success("User ID copied to clipboard");
														}}
													>
														<Copy className="mr-2 h-4 w-4" />
														Copy ID
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => setEditingUser(user)}
													>
														<UserCog className="mr-2 h-4 w-4" />
														Edit Details
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => setDeletingUser(user)}
														className="appearance-none text-destructive focus:text-destructive"
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Delete Account
													</DropdownMenuItem>
												</DropdownMenuGroup>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
						{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
						{filteredUsers.length} users
					</p>
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									className={
										currentPage === 1
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
								/>
							</PaginationItem>
							{getPageNumbers().map((page, idx) => (
								<PaginationItem
									key={page === "ellipsis" ? `ellipsis-${idx}` : page}
								>
									{page === "ellipsis" ? (
										<span className="px-2">...</span>
									) : (
										<PaginationLink
											onClick={() => setCurrentPage(page)}
											isActive={currentPage === page}
											className="cursor-pointer"
										>
											{page}
										</PaginationLink>
									)}
								</PaginationItem>
							))}
							<PaginationItem>
								<PaginationNext
									onClick={() =>
										setCurrentPage((p) => Math.min(totalPages, p + 1))
									}
									className={
										currentPage === totalPages
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}

			{/* Create Dialog */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New User</DialogTitle>
						<DialogDescription>
							Create a new account. The user will use these credentials to log
							in.
						</DialogDescription>
					</DialogHeader>
					<UserForm
						onSuccess={handleSuccess}
						onCancel={() => setIsCreateOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog
				open={!!editingUser}
				onOpenChange={(open) => !open && setEditingUser(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit User</DialogTitle>
						<DialogDescription>Update role or assignment.</DialogDescription>
					</DialogHeader>
					{editingUser && (
						<UserForm
							user={editingUser}
							onSuccess={handleSuccess}
							onCancel={() => setEditingUser(null)}
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={!!deletingUser}
				onOpenChange={(open) => !open && setDeletingUser(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-destructive">
							<AlertTriangle className="h-5 w-5" />
							Delete User
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete the user{" "}
							<strong>{deletingUser?.name}</strong>? This action cannot be
							undone and will remove all their access and data.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeletingUser(null)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => deletingUser && deleteUser(deletingUser.id)}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete User"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
