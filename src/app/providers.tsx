'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster as Sonner } from '@/components/ui/sonner';
import WebMcpProvider from '@/components/catalog/WebMcpProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <WebMcpProvider />
      <Sonner />
    </TooltipProvider>
  );
}
