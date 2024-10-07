/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/realtime-api',
        destination: 'http://localhost:3001/api/realtime-api',
      },
    ];
  },
}

module.exports = nextConfig
