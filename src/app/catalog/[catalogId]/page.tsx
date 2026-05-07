import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  loadCatalog,
  getGlobalConfig,
  getCatalogList,
  getCatalogFooterEntries,
} from '@/lib/catalog-loader';
import type { CatalogLayoutType } from '@/types/catalog';
import CatalogPageQX from '@/layouts/qx/CatalogPageQX';
import CatalogPageType2 from '@/layouts/type2/CatalogPageType2';
import CatalogPageType3 from '@/layouts/type3/CatalogPageType3';

const layoutMap: Record<
  CatalogLayoutType,
  typeof CatalogPageQX | typeof CatalogPageType2 | typeof CatalogPageType3
> = {
  qx: CatalogPageQX,
  type2: CatalogPageType2,
  type3: CatalogPageType3,
};

export async function generateStaticParams() {
  const catalogs = await getCatalogList();
  return catalogs.map((catalog) => ({
    catalogId: catalog.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ catalogId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const catalog = await loadCatalog(resolvedParams.catalogId);
  if (!catalog) return {};

  const { title, tagline } = catalog.meta;
  return {
    title: tagline ? `${title} — ${tagline}` : title,
  };
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ catalogId: string }>;
}) {
  const resolvedParams = await params;
  const [catalog, globalConfig, footerEntries] = await Promise.all([
    loadCatalog(resolvedParams.catalogId),
    getGlobalConfig(),
    getCatalogFooterEntries(),
  ]);

  if (!catalog) {
    notFound();
  }

  const LayoutComponent = layoutMap[catalog.meta.layoutType];
  return (
    <LayoutComponent
      catalog={catalog}
      globalConfig={globalConfig}
      footerEntries={footerEntries}
    />
  );
}
