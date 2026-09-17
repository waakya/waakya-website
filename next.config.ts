import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Playwright run and local screenshots hit 127.0.0.1 rather than
  // localhost; dev-only resource requests from it are otherwise blocked.
  allowedDevOrigins: ["127.0.0.1"],
  // The dev overlay badge sits on top of the bottom-third primary action.
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nobody frames the sign-in or invite pages.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Proof photos use the camera; nothing needs the microphone or location in Phase 1.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      {
        // Invite tokens stay on this site.
        source: "/join/:token",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
