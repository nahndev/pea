import { Theme } from '@tomato/constants';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppHeader } from '@/shared/components/app-header';
import { THEME_INIT_SCRIPT } from '@/shared/lib/theme.constants';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Pea', template: '%s · Pea' },
  description: 'Performance analysis of your branches',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={Theme.TWILIGHT} className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-canvas font-sans">
        <Providers>
          <AppHeader />
          <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
