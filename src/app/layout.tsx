import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { getSiteUrl } from '@/lib/site-url';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
  variable: '--font-lato',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'METRO – Catalogs',
  description:
    'METRO product catalogs. QX, QS, TS, VR, FM desk systems. FOTA conference furniture. MRC reception desks.',
  authors: [{ name: 'METRO' }],
  openGraph: {
    title: 'METRO – Catalogs',
    description: 'Product catalogs – browse by collection',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lato.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
