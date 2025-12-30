import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: false,
	transpilePackages: ["@BLMS/db", "@BLMS/auth", "@BLMS/api"],
};

export default nextConfig;
