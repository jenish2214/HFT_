/** @type {import('next').NextConfig} */
const apiUrl = process.env.API_URL || "http://127.0.0.1:8000";

const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    // Production (Vercel) talks to Render API via NEXT_PUBLIC_API_URL in the browser
    if (process.env.VERCEL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
