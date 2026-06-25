import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turso libSQL client works on the Node runtime; keep default server runtime.
  experimental: {},
};

export default nextConfig;
