import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  allowedDevOrigins: ["192.168.18.70", "192.168.56.1"],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://192.168.18.70:3001/:path*",
      },
    ];
  },
};

export default nextConfig;
