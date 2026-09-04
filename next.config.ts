import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Playwright run and local screenshots hit 127.0.0.1 rather than
  // localhost; dev-only resource requests from it are otherwise blocked.
  allowedDevOrigins: ["127.0.0.1"],
  // The dev overlay badge sits on top of the bottom-third primary action.
  devIndicators: false,
};

export default nextConfig;
