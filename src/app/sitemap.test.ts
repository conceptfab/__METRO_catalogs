import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/site-url', () => ({
  getSiteUrl: () => 'https://test.metro.example',
}));

vi.mock('@/lib/catalog-loader', () => ({
  getCatalogList: vi.fn(),
}));

import { getCatalogList } from '@/lib/catalog-loader';
import sitemap from './sitemap';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sitemap', () => {
  it('always includes the homepage', async () => {
    vi.mocked(getCatalogList).mockResolvedValue([]);
    const entries = await sitemap();
    expect(entries[0]).toMatchObject({
      url: 'https://test.metro.example/',
      changeFrequency: 'weekly',
      priority: 1,
    });
  });

  it('includes one entry per catalog', async () => {
    vi.mocked(getCatalogList).mockResolvedValue([
      { id: 'QX' } as any,
      { id: 'QS' } as any,
    ]);
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain('https://test.metro.example/catalog/QX');
    expect(urls).toContain('https://test.metro.example/catalog/QS');
    expect(entries.length).toBe(3); // home + 2 catalogs
  });

  it('catalog entries have priority 0.8 and weekly cadence', async () => {
    vi.mocked(getCatalogList).mockResolvedValue([{ id: 'QX' } as any]);
    const entries = await sitemap();
    const catalogEntry = entries.find((e) =>
      e.url === 'https://test.metro.example/catalog/QX',
    );
    expect(catalogEntry).toMatchObject({
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  it('lastModified is a Date', async () => {
    vi.mocked(getCatalogList).mockResolvedValue([]);
    const entries = await sitemap();
    expect(entries[0].lastModified).toBeInstanceOf(Date);
  });
});
