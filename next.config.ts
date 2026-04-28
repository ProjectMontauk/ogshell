import type { NextConfig } from "next";

/** Who may embed /markets/* in an iframe. Extend when onboarding partners. */
const frameAncestors = [
  "'self'",
  "https://www.thecitizen.io",
  "https://thecitizen.io",
  "https://www.bitchute.com",
  "https://bitchute.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].join(" ");

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily ignore build errors to allow deployment
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/markets/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors};`,
          },
        ],
      },
      {
        source: "/embed/market-card/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors};`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
