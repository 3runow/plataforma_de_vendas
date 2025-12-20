import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode to prevent double SDK initialization issues with Mercado Pago
  reactStrictMode: false,
  // Define explicit root to silence lockfile root warnings
  outputFileTracingRoot: path.join(__dirname),
  env: {
    NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY,
  },
  // Allow next/image to load external QR code images (and other external hosts if needed)
  images: {
    // simple allowlist by domain
    domains: ["api.qrserver.com"],
    // more precise pattern if needed
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        port: "",
        pathname: "/v1/create-qr-code/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
