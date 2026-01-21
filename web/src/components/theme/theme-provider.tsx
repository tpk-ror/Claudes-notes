'use client';

import { useEffect, type ReactNode } from 'react';
import { useThemeStore, type ResolvedTheme } from '../../store/theme-store';

export interface ThemeProviderProps {
  /** Children to render within the theme context */
  children: ReactNode;
  /** Optional default theme for SSR (defaults to 'light') */
  defaultTheme?: ResolvedTheme;
}

/**
 * ThemeProvider component that manages theme application.
 *
 * This component:
 * - Listens for system preference changes via matchMedia
 * - Applies the resolved theme class to the document element
 * - Handles hydration by applying theme on mount
 *
 * Usage:
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const mode = useThemeStore((state) => state.mode);
  const systemTheme = useThemeStore((state) => state.systemTheme);
  const setSystemTheme = useThemeStore((state) => state.setSystemTheme);
  const getResolvedTheme = useThemeStore((state) => state.getResolvedTheme);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    // Set initial system theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [setSystemTheme]);

  // Apply theme class to document element
  useEffect(() => {
    const resolvedTheme = getResolvedTheme();
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Add current theme class
    root.classList.add(resolvedTheme);

    // Update color-scheme meta for browser UI
    root.style.colorScheme = resolvedTheme;
  }, [mode, systemTheme, getResolvedTheme]);

  return <>{children}</>;
}
