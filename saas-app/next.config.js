/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export disabled to support NextAuth.js API routes
  // For static deployment, use: output: 'export'
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_WORKER_URL: process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787',
  },
};

module.exports = nextConfig;
