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

const connectSources = [process.env.NEXT_PUBLIC_API_URL]
  .filter((url): url is string => Boolean(url))
  .map((url) => {
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  })
  .filter((origin): origin is string => Boolean(origin));

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self' data:",
            "img-src 'self' data: blob: https:",
            `connect-src 'self' ${connectSources.join(' ')}`.trim(),
            'upgrade-insecure-requests',
          ].join('; '),
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
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
