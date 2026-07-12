/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // API proxy handled by app/api/[...path]/route.ts (returns 503 when backend is down).
};

module.exports = nextConfig;
