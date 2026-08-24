import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    const isDev = process.env.NODE_ENV !== "production";
    // Locally use localhost:4000, in production (Vercel) automatically use Render!
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || (isDev ? "http://localhost:4000" : "https://workshop-reservation.onrender.com");
    
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;