import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["resend", "@libsql/client"],
};

export default nextConfig;
