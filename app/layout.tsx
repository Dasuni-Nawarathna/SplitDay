import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SplitDay – Group Expense Tracker',
  description:
    'SplitDay helps you track group expenses on trips and outings without any sign-up. Generate a room, add expenses, and let SplitDay calculate who owes who.',
  keywords: ['expense tracker', 'group expenses', 'trip expenses', 'split bills'],
  openGraph: {
    title: 'SplitDay – Group Expense Tracker',
    description: 'Track group expenses and settle debts in seconds.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
