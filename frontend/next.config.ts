import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS || "localhost,192.168.18.70").split(","),

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
