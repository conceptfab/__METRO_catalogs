import type { NextConfig } from 'next';
import {
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from 'next/constants';

const DEFAULT_DIST_DIR = '.next';
const LOCAL_ISOLATED_PROD_DIST_DIR = '.next-build';

export default function nextConfig(phase: string): NextConfig {
  const isProdPhase =
    phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER;
  const isVercel = process.env.VERCEL === '1';
  const useLocalIsolatedProdDist =
    isProdPhase &&
    !isVercel &&
    process.env.NEXT_LOCAL_ISOLATED_DIST === '1';

  return {
    // Vercel expects production artifacts in `.next`.
    // Local isolated production output is opt-in:
    // NEXT_LOCAL_ISOLATED_DIST=1 npm run build
    distDir: useLocalIsolatedProdDist
      ? LOCAL_ISOLATED_PROD_DIST_DIR
      : DEFAULT_DIST_DIR,
  };
}
