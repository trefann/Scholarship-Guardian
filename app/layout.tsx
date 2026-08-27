import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AppStateProvider } from './lib/app-state';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Scholarship Guardian',
  description: 'Understand potential scholarship matches, prepare evidence, and catch application issues before applying.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={geist.variable}><AppStateProvider>{children}</AppStateProvider></body></html>;
}
