import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

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
      <body className="min-h-full bg-gray-950 text-white antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
