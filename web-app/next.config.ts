import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow opening the dev server via the machine's LAN IP as well as localhost.
  allowedDevOrigins: ["192.168.56.1"],

  // The student & driver login moved from /portal/login to /login.
  // Keeps old bookmarks and links in already-sent emails working.
  async redirects() {
    return [
      { source: "/portal/login", destination: "/login", permanent: true },
      { source: "/portal", destination: "/login", permanent: false },
    ];
  },
};

export default nextConfig;
