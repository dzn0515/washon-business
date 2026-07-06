/** @type {import('next').NextConfig} */
const apiProxyTarget =
  process.env.API_PROXY_TARGET?.replace(/\/$/, '') || 'https://api.autoon.kr/api/v1';

const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1'],
  async rewrites() {
    const enableProxy =
      process.env.NODE_ENV === 'development' || process.env.ENABLE_API_PROXY === 'true';
    if (!enableProxy) return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ]
  },
};

export default nextConfig;
