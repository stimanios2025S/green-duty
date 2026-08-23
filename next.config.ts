import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["resend", "nodemailer", "@libsql/client"],
};

export default nextConfig;
