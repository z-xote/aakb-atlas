import type { NextConfig } from "next";

const scriptSource = process.env.NODE_ENV === "development"
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

// Clerk's Development instance Frontend API, plus its bot and abuse checks.
const clerkFrontendApi = "https://*.clerk.accounts.dev";
const clerkScripts = `${clerkFrontendApi} https://challenges.cloudflare.com https://*.protect.clerk.com`;
const clerkConnect = `${clerkFrontendApi} https://*.protect.clerk.com:* https://clerk-telemetry.com https://*.clerk-telemetry.com`;
const clerkFrames = "https://challenges.cloudflare.com https://*.protect.clerk.com";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/login", destination: "/sign-in", permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; ${scriptSource} ${clerkScripts}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' ${clerkConnect}; frame-src 'self' ${clerkFrames}; font-src 'self' data:; media-src 'self' blob:; worker-src 'self' blob:`,
          },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
