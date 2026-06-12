import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { ActivityIndicator, View } from "react-native";
import { authClient } from "@/lib/auth-client";

export default function DrawerLayout() {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();

	if (isSessionPending) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	if (!session) {
		return <Redirect href="/login" />;
	}

	return (
		<Drawer
			screenOptions={{
				headerStyle: {
					backgroundColor: "#020617",
					borderBottomWidth: 1,
					borderBottomColor: "rgba(255, 255, 255, 0.1)",
				},
				headerTintColor: "#f8fafc",
				headerTitleStyle: {
					fontFamily: "Courier",
					fontWeight: "bold",
					fontSize: 13,
				},
				drawerStyle: {
					backgroundColor: "#020617",
					borderRightWidth: 1,
					borderRightColor: "rgba(255, 255, 255, 0.1)",
				},
				drawerActiveTintColor: "#ef4444",
				drawerInactiveTintColor: "#94a3b8",
				drawerLabelStyle: {
					fontFamily: "Courier",
					fontSize: 12,
					fontWeight: "bold",
				},
			}}
		>
			<Drawer.Screen
				name="index"
				options={{
					drawerItemStyle: { display: "none" },
				}}
			/>
			<Drawer.Screen
				name="dashboard"
				options={{
					headerTitle: "/// COMMAND CONSOLE",
					drawerLabel: "CONSOLE",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="terminal-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="inventory"
				options={{
					headerTitle: "/// INVENTORY AUDIT",
					drawerLabel: "INVENTORY",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="cube-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="transfers"
				options={{
					headerTitle: "/// REQUISITIONS & TRANSFERS",
					drawerLabel: "TRANSFERS",
					drawerIcon: ({ size, color }) => (
						<Ionicons
							name="swap-horizontal-outline"
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Drawer.Screen
				name="audit"
				options={{
					headerTitle: "/// SYSTEM AUDIT TRAIL",
					drawerLabel: "AUDIT LOGS",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="list-outline" size={size} color={color} />
					),
				}}
			/>
		</Drawer>
	);
}
