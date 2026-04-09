import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production, vercel.json handles routing to the Python function
    // at the Edge level before Next.js is invoked.
    // This rewrite only runs in local development.
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    return [
      {
        source: "/api/py/:path*",
        destination: "http://127.0.0.1:8000/api/py/:path*",
      },
    ];
  },
};

export default nextConfig;
