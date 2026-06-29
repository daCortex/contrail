import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the full airport dataset (read via fs at runtime) is bundled into
  // the serverless functions that need it on Vercel.
  outputFileTracingIncludes: {
    "/api/ifc/sync": ["./lib/data/airports-full.json"],
    "/api/ifc/live": ["./lib/data/airports-full.json"],
    "/api/ifc/track": ["./lib/data/airports-full.json"],
    "/api/airports": ["./lib/data/airports-full.json"],
  },
};

export default nextConfig;
