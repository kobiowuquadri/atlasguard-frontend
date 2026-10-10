import type { NextConfig } from 'next';

/**
 * The dashboard talks to the AtlasGuard API through a same-origin proxy (`/api/*`), so the
 * session cookie is first-party and the API base URL never needs to reach the browser.
 */
const API_URL = (process.env.ATLASGUARD_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
