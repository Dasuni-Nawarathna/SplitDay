import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import PWARegister from './PWARegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SplitDay – Group Expense Tracker',
  description: 'Track group expenses on trips and outings. No complex setup — just create an account, start an outing, and let SplitDay handle the math.',
  keywords: ['expense tracker', 'group expenses', 'trip expenses', 'split bills'],
  openGraph: {
    title: 'SplitDay – Group Expense Tracker',
    description: 'Track group expenses and settle debts in seconds.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="min-h-full bg-gray-950 text-white antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <PWARegister />
      </body>
    </html>
  );
}
