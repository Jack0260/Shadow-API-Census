import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme-provider';
import { CensusProvider } from '@/lib/census-context';
import { AppShell } from '@/components/app-shell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shadow API Census — API Attack Surface Discovery',
  description: 'Discover undocumented shadow APIs by comparing live traffic against your Swagger spec. Risk-score every endpoint, auto-generate OpenAPI specs, and block with one click.',
  openGraph: {
    title: 'Shadow API Census',
    description: 'Discover undocumented shadow APIs by comparing live traffic against your Swagger spec.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme')||'dark';if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}" }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <CensusProvider>
            <AppShell>{children}</AppShell>
          </CensusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
