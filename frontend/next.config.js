/** @type {import('next').NextConfig} */
const localApi = process.env.API_URL || "http://127.0.0.1:8000";
const productionApi = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    const backend = productionApi || localApi;
    return [
      {
        source: "/api/:path*",
        destination: `${backend.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
