import * as Haptics from "expo-haptics";
import { cn } from "heroui-native";
import type React from "react";
import {
	type GestureResponderEvent,
	Pressable,
	type PressableProps,
	Text,
	View,
	type ViewProps,
} from "react-native";

interface ConsoleCardProps extends ViewProps {
	title?: string;
	headerRight?: React.ReactNode;
	variant?: "default" | "critical" | "warning" | "success";
}

export function ConsoleCard({
	children,
	title,
	headerRight,
	className,
	variant = "default",
	...props
}: ConsoleCardProps) {
	const borderColor =
		variant === "critical"
			? "border-red-600"
			: variant === "warning"
				? "border-amber-500"
				: variant === "success"
					? "border-emerald-500"
					: "border-white/10";

	return (
		<View
			className={cn(
				"mb-4 rounded-none border bg-slate-950/80 p-4",
				borderColor,
				className,
			)}
			{...props}
		>
			{title || headerRight ? (
				<View className="mb-3 flex-row items-center justify-between border-white/10 border-b pb-2">
					{title ? (
						<Text className="font-bold font-mono text-slate-300 text-xs uppercase tracking-wider">
							{title}
						</Text>
					) : (
						<View />
					)}
					{headerRight}
				</View>
			) : null}
			{children}
		</View>
	);
}

interface ConsoleButtonProps extends PressableProps {
	title: string;
	variant?: "primary" | "secondary" | "danger" | "success";
	isLoading?: boolean;
	className?: string;
}

export function ConsoleButton({
	title,
	variant = "primary",
	isLoading,
	className,
	onPress,
	disabled,
	...props
}: ConsoleButtonProps) {
	const handlePress = (e: GestureResponderEvent) => {
		if (disabled || isLoading) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
		if (onPress) {
			onPress(e);
		}
	};

	let bgClass = "bg-red-700 active:bg-red-800 border-red-600";
	let textClass = "text-white";

	if (variant === "secondary") {
		bgClass = "bg-slate-900 active:bg-slate-800 border-slate-700";
		textClass = "text-slate-300";
	} else if (variant === "danger") {
		bgClass = "bg-red-950 active:bg-red-900 border-red-800";
		textClass = "text-red-400";
	} else if (variant === "success") {
		bgClass = "bg-emerald-950 active:bg-emerald-900 border-emerald-800";
		textClass = "text-emerald-400";
	}

	return (
		<Pressable
			onPress={handlePress}
			disabled={disabled || isLoading}
			className={cn(
				"flex-row items-center justify-center rounded-none border px-4 py-3",
				bgClass,
				disabled && "opacity-50",
				className,
			)}
			{...props}
		>
			<Text
				className={cn(
					"font-bold font-mono text-xs uppercase tracking-widest",
					textClass,
				)}
			>
				{isLoading ? "PROCESSING..." : title}
			</Text>
		</Pressable>
	);
}

export function StatusBadge({ status }: { status: string }) {
	const norm = status?.toLowerCase() || "";
	let color = "text-amber-500";
	if (
		norm.includes("approve") ||
		norm.includes("nominal") ||
		norm.includes("success") ||
		norm.includes("dispatch") ||
		norm.includes("complete")
	) {
		color = "text-emerald-500";
	} else if (
		norm.includes("reject") ||
		norm.includes("fail") ||
		norm.includes("critical") ||
		norm.includes("cancel")
	) {
		color = "text-red-500";
	}

	return (
		<Text className={cn("font-bold font-mono text-xs uppercase", color)}>
			[{status}]
		</Text>
	);
}
