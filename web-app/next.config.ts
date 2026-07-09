import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow opening the dev server via the machine's LAN IP as well as localhost.
  allowedDevOrigins: ["192.168.56.1"],
};

export default nextConfig;
