import type { NextConfig } from 'next';
import {
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from 'next/constants';

const DEFAULT_DIST_DIR = '.next';
const LOCAL_ISOLATED_PROD_DIST_DIR = '.next-build';
const HOMEPAGE_AGENT_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"; profile="https://www.rfc-editor.org/info/rfc9727"',
  '</api/catalogs>; rel="service-desc"; type="application/json"',
].join(', ');

export default function nextConfig(phase: string): NextConfig {
  const isProdPhase =
    phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER;
  const isVercel = process.env.VERCEL === '1';
  const useLocalIsolatedProdDist =
    isProdPhase &&
    !isVercel &&
    process.env.NEXT_LOCAL_ISOLATED_DIST === '1';

  return {
    distDir: useLocalIsolatedProdDist
      ? LOCAL_ISOLATED_PROD_DIST_DIR
      : DEFAULT_DIST_DIR,
    experimental: {
      optimizePackageImports: ['lucide-react', 'framer-motion'],
    },
    images: {
      loader: 'custom',
      // Used by next/image to resolve pre-generated responsive variants.
      loaderFile: './src/lib/image-loader.ts',
    },
    compiler: {
      removeConsole: isProdPhase
        ? { exclude: ['error', 'warn'] }
        : false,
    },
    async headers() {
      return [
        {
          source: '/',
          headers: [
            {
              key: 'Link',
              value: HOMEPAGE_AGENT_LINKS,
            },
          ],
        },
      ];
    },
  };
}
