'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'default' | 'ocean' | 'forest';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const savedTheme = localStorage.getItem('splitday-theme') as Theme;
    if (savedTheme && ['default', 'ocean', 'forest'].includes(savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('splitday-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // To avoid hydration mismatch, you could return null before mounted,
  // but since we aren't rendering different HTML based on theme (just passing it through),
  // rendering children is fine. We just won't apply the theme string to react components until mounted.
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {/* We use a script in layout to prevent FOUC, so this runs on client only to sync state */}
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
