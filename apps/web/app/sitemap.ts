import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/api';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.WEB_URL ?? 'http://localhost:3000';
  const products = await getCatalog('?pageSize=50&sort=recent');
  return ['', '/explore', '/categories', '/privacy', '/terms']
    .map((path) => ({ url: `${base}${path}`, lastModified: new Date() }))
    .concat(
      products.data.map((s) => ({
        url: `${base}/saas/${s.slug}`,
        lastModified: new Date(s.updatedAt),
      })),
    );
}
