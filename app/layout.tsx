import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import NotificationManager from '@/components/NotificationManager';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Ecooy - Gestão de Escalas',
  description: 'Sistema completo de gestão de escalas.',
  icons: {
    icon: [
      { url: 'https://i.ibb.co/3VsZL4Q/agendar-2.png', sizes: '16x16' },
      { url: 'https://i.ibb.co/S4MGrmZx/agendar-3.png', sizes: '32x32' },
    ],
    apple: [
      { url: 'https://i.ibb.co/0RdkwbvT/agendar-4.png', sizes: '128x128' },
    ],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-br" className={inter.variable}>
      <body suppressHydrationWarning className="font-sans bg-slate-50 text-slate-900">
        <NotificationManager />
        {children}
      </body>
    </html>
  );
}
