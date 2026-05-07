'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { slowTransition } from '@/lib/motion';

interface CatalogMotionProps {
  children: ReactNode;
}

const CatalogMotion = ({ children }: CatalogMotionProps) => (
  <MotionConfig transition={slowTransition({ duration: 0.3 })}>
    {children}
  </MotionConfig>
);

export default CatalogMotion;
