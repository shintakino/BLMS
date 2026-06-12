import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { ConsoleButton, ConsoleCard } from "@/components/console-ui";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/orpc";

export default function LoginScreen() {
	const router = useRouter();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// If already authenticated, redirect to index
	useEffect(() => {
		if (session?.user) {
			router.replace("/(drawer)");
		}
	}, [session, router]);

	const handleLogin = async () => {
		if (!email || !password) {
			setError("EMAIL AND PASSWORD REQUIRED");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await authClient.signIn.email(
				{
					email: email.trim(),
					password,
				},
				{
					onSuccess: () => {
						queryClient.refetchQueries();
						router.replace("/(drawer)");
					},
					onError: (ctx) => {
						setError(ctx.error.message?.toUpperCase() || "ACCESS DENIED");
					},
					onFinished: () => {
						setIsLoading(false);
					},
				},
			);
		} catch {
			setError("AUTHENTICATION SYSTEM ERROR");
			setIsLoading(false);
		}
	};

	if (isSessionPending) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-slate-950"
		>
			<View className="absolute inset-0 z-0">
				<Image
					source={require("../assets/images/firemanSignIn.png")}
					style={{
						width: "100%",
						height: "100%",
						position: "absolute",
						opacity: 0.35,
					}}
					resizeMode="cover"
				/>
				<View className="absolute inset-0 bg-slate-950/70" />
			</View>

			<ScrollView
				contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
				className="z-10 flex-1 px-6 py-12"
			>
				<View className="mx-auto w-full max-w-md space-y-6">
					{/* Logo & Command header */}
					<View className="flex-row items-center gap-4 border-white/10 border-b pb-6">
						<Image
							source={require("../assets/images/bfpRegion12Logo.png")}
							style={{ width: 48, height: 48 }}
							resizeMode="contain"
						/>
						<View>
							<Text className="font-extrabold font-mono text-lg text-white tracking-wider">
								COMMAND ACCESS
							</Text>
							<Text className="font-mono text-[10px] text-slate-500 tracking-widest">
								BRLMS SECURE TERMINAL PORTAL
							</Text>
						</View>
					</View>

					{/* Warning Banner */}
					<View className="border border-red-800 bg-red-950/20 p-4">
						<Text className="font-mono text-[10px] text-red-400 uppercase leading-snug">
							[NOTICE]: SYSTEM MONITORING CURRENTLY ONLINE. ATTEMPTS TO ALTER
							SECURITY POLICIES OR UNAUTHORIZED DATA MANIPULATION WILL TRIGGER
							COMPLIANCE LOGGING.
						</Text>
					</View>

					{/* Login Form Card */}
					<ConsoleCard title="SECURITY CRITICAL LOG IN">
						{error ? (
							<View className="mb-4 border border-red-600 bg-red-950/40 p-3">
								<Text className="font-mono text-red-400 text-xs uppercase">
									ERROR: {error}
								</Text>
							</View>
						) : null}

						<Text className="mb-1 font-mono text-[10px] text-slate-400 uppercase">
							OPERATIONAL EMAIL:
						</Text>
						<TextInput
							className="mb-4 rounded-none border border-white/10 bg-slate-950/60 p-3 font-mono text-sm text-white"
							placeholder="EMAIL@BFP.GOV.PH"
							placeholderTextColor="rgba(255,255,255,0.3)"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							editable={!isLoading}
						/>

						<Text className="mb-1 font-mono text-[10px] text-slate-400 uppercase">
							SECURE PASSPHRASE:
						</Text>
						<TextInput
							className="mb-6 rounded-none border border-white/10 bg-slate-950/60 p-3 font-mono text-sm text-white"
							placeholder="••••••••"
							placeholderTextColor="rgba(255,255,255,0.3)"
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							autoCapitalize="none"
							autoCorrect={false}
							editable={!isLoading}
						/>

						<ConsoleButton
							title={isLoading ? "AUTHENTICATING..." : "ESTABLISH CONNECTION"}
							onPress={handleLogin}
							isLoading={isLoading}
						/>
					</ConsoleCard>

					{/* Footer info */}
					<Text className="text-center font-mono text-[9px] text-slate-500 uppercase tracking-widest">
						Bureau of Fire Protection Region XII Logistics Office
					</Text>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
