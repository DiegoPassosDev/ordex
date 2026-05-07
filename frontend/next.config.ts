import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  allowedDevOrigins: [
    '192.168.18.70',
    '192.168.56.1',
  ],
};

export default nextConfig;
