import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the demo flag so a build that forgets the variable behaves like "0": demo chunks are not emitted.
  env: { NEXT_PUBLIC_PARTNERHUB_DEMO: process.env.NEXT_PUBLIC_PARTNERHUB_DEMO ?? "0" },
};

export default nextConfig;
