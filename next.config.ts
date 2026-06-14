import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-d394cde9-6bc7-4ec7-a8be-3da2678a6744.space-z.ai",
    ".space-z.ai",
    "space-z.ai",
  ],
};

export default nextConfig;
