import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Add this line
  allowedDevOrigins: ["http://localhost:3000", "http://0.0.0.0:3000"],
};

export default nextConfig;
