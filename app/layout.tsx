import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import PWARegister from './PWARegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SplitDay – Group Expense Tracker',
  description: 'Track group expenses on trips and outings. No complex setup — just create an account, start an outing, and let SplitDay handle the math with 1-click settle up.',
  keywords: ['expense tracker', 'group expenses', 'trip expenses', 'split bills', 'settle debts'],
  openGraph: {
    title: 'SplitDay – Group Expense Tracker',
    description: 'Track group expenses and settle debts in seconds with our new 1-click settle up feature.',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('splitday-theme');
                if (savedTheme === 'ocean' || savedTheme === 'forest') {
                  document.documentElement.setAttribute('data-theme', savedTheme);
                } else {
                  document.documentElement.setAttribute('data-theme', 'default');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-gray-950 text-white antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <PWARegister />
      </body>
    </html>
  );
}
