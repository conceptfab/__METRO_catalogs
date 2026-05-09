import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getCatalogList, getGlobalConfig } from '@/lib/catalog-loader';
import CatalogNav from '@/components/catalog/CatalogNav';
import CatalogMotion from '@/components/catalog/CatalogMotion';

const QX_HERO_IMAGE = '/catalogs/QX/hero/02_26_Metro_QX_HERO_1_R3-clean_noise_thumb.webp';
const QS_HERO_IMAGE = '/catalogs/QS/hero/04_26_Metro_QS_SOLO_B2_hero_noise.webp';

export const metadata: Metadata = {
  title: 'METRO – Catalogs',
  description:
    'Browse METRO office furniture catalogs: QX and QS desk systems, conference tables, and reception desks.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'METRO – Catalogs',
    description:
      'Browse METRO office furniture catalogs: QX and QS desk systems, conference tables, and reception desks.',
    url: '/',
    type: 'website',
  },
};

export default async function HomePage() {
  const [catalogs, globalConfig] = await Promise.all([
    getCatalogList(),
    getGlobalConfig(),
  ]);

  const qxCatalog = catalogs.find((c) => c.id === 'QX');
  const qsCatalog = catalogs.find((c) => c.id === 'QS');

  return (
    <div className="catalog-qx0 catalog-motion-slow">
      <CatalogMotion>
        <CatalogNav
          variant="qx0"
          logoOnly
          brandLabel={globalConfig.brandName}
          brandLogoSrc="/catalogs/QX/metro_logo.svg"
          backToCatalogListHref="/"
        />

        <main
          id="main-content"
          className="bg-surface-elevated pt-[44px] sm:pt-[56px] lg:pt-14"
        >
          {/* Section 1 — Operational office furniture */}
          <section className="mx-auto w-full max-w-[1440px] pt-12 lg:pt-[120px]">
            <h2 className="section_ID px-5 font-display uppercase sm:px-8 lg:px-0">
              Operational office furniture
            </h2>
            <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:mt-12 lg:grid-cols-5">
              <li className="aspect-[1/2]">
                {qxCatalog ? (
                  <Link
                    href={`/catalog/${qxCatalog.id}`}
                    className="group relative block h-full w-full overflow-hidden bg-background outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
                    aria-label={`Open ${qxCatalog.meta.title} catalog`}
                  >
                    <Image
                      src={QX_HERO_IMAGE}
                      alt=""
                      fill
                      priority
                      sizes="(min-width: 1024px) 85vw, (min-width: 640px) 132vw, 200vw"
                      className="home-tile-pan object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/55" />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[88px] font-black tracking-tighter text-background opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      QX
                    </span>
                  </Link>
                ) : (
                  <div className="h-full w-full bg-background" />
                )}
              </li>
              <li className="aspect-[1/2]">
                {qsCatalog ? (
                  <Link
                    href={`/catalog/${qsCatalog.id}`}
                    className="group relative block h-full w-full overflow-hidden bg-background outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
                    aria-label={`Open ${qsCatalog.meta.title} catalog`}
                  >
                    <Image
                      src={QS_HERO_IMAGE}
                      alt=""
                      fill
                      priority
                      sizes="(min-width: 1024px) 85vw, (min-width: 640px) 132vw, 200vw"
                      className="home-tile-pan-reverse object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/55" />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[88px] font-black tracking-tighter text-background opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      QS
                    </span>
                  </Link>
                ) : (
                  <div className="h-full w-full bg-background" />
                )}
              </li>
              {Array.from({ length: 3 }).map((_, index) => (
                <li
                  key={`op-placeholder-${index}`}
                  className="aspect-[1/2] border border-border bg-background/40"
                  aria-hidden="true"
                />
              ))}
            </ul>
          </section>

          {/* Section 2 — Conference tables */}
          <section className="mx-auto mt-16 w-full max-w-[1440px] lg:mt-[120px]">
            <h2 className="section_ID px-5 font-display uppercase sm:px-8 lg:px-0">
              Conference tables
            </h2>
            <div
              className="mt-8 aspect-[5/1] w-full border border-border bg-background/40 lg:mt-12"
              aria-hidden="true"
            />
          </section>

          {/* Section 3 — Reception desks */}
          <section className="mx-auto mt-16 w-full max-w-[1440px] pb-24 lg:mt-[120px] lg:pb-[160px]">
            <h2 className="section_ID px-5 font-display uppercase sm:px-8 lg:px-0">
              Reception desks
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-0 sm:grid-cols-2 lg:mt-12">
              {Array.from({ length: 2 }).map((_, index) => (
                <li
                  key={`reception-${index}`}
                  className="aspect-square border border-border bg-background/40"
                  aria-hidden="true"
                />
              ))}
            </ul>
          </section>
        </main>

        <footer className="bg-catalog-footer">
          <div className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 lg:px-0">
            <p className="font-display text-xs uppercase tracking-widest text-foreground/65">
              {globalConfig.footerText}
            </p>
          </div>
        </footer>
      </CatalogMotion>
    </div>
  );
}
