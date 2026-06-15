import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the full airport dataset (read via fs at runtime) is bundled into
  // the IFC sync serverless function on Vercel.
  outputFileTracingIncludes: {
    "/api/ifc/sync": ["./lib/data/airports-full.json"],
  },
};

export default nextConfig;
