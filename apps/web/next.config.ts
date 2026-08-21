import type { NextConfig } from 'next';

function remoteImagePattern(url: string, pathname: string) {
  const parsed = new URL(url);
  return {
    protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
    hostname: parsed.hostname,
    port: parsed.port,
    pathname,
  };
}

function apiImagePattern(url: string) {
  return remoteImagePattern(url, '/uploads/**');
}

function storageImagePattern(url: string) {
  const parsed = new URL(url);
  const basePath = parsed.pathname.replace(/\/$/, '');
  return remoteImagePattern(url, `${basePath || ''}/**`);
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

const storageImageUrls = [
  process.env.S3_PUBLIC_URL,
  process.env.NEXT_PUBLIC_UPLOADS_URL,
]
  .filter((url): url is string => Boolean(url))
  .map((url) => {
    try {
      return storageImagePattern(url);
    } catch {
      return null;
    }
  })
  .filter((pattern): pattern is ReturnType<typeof storageImagePattern> =>
    Boolean(pattern),
  );

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      ...apiImageUrls,
      ...storageImageUrls,
    ],
  },
  poweredByHeader: false,
};
export default nextConfig;
