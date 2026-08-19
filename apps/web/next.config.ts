import type { NextConfig } from 'next';

function apiImagePattern(url: string) {
  const parsed = new URL(url);
  return {
    protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: '/uploads/**',
  };
}

const apiImageUrls = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  process.env.API_URL,
  process.env.NEXT_PUBLIC_API_URL,
]
  .filter((url): url is string => Boolean(url))
  .map((url) => {
    try {
      return apiImagePattern(url);
    } catch {
      return null;
    }
  })
  .filter((pattern): pattern is ReturnType<typeof apiImagePattern> =>
    Boolean(pattern),
  );

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      ...apiImageUrls,
    ],
  },
  poweredByHeader: false,
};
export default nextConfig;
