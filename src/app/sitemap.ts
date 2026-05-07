import type { MetadataRoute } from 'next';
import { getCatalogList } from '@/lib/catalog-loader';
import { getSiteUrl } from '@/lib/site-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const catalogs = await getCatalogList();
  const lastModified = new Date();

  return [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...catalogs.map((catalog) => ({
      url: `${base}/catalog/${catalog.id}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
