import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS || "localhost,192.168.18.70").split(","),

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
