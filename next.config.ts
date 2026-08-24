import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["resend", "nodemailer", "@libsql/client", "bcryptjs", "three"],
  transpilePackages: ["@designcodeio/threeui"],
};

export default nextConfig;
