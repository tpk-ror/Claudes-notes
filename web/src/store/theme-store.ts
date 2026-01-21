import { create } from 'zustand';

/**
 * Theme mode options:
 * - 'light': Always use light theme
 * - 'dark': Always use dark theme
 * - 'system': Follow system preference
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Resolved theme that will be applied to the UI
 */
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  /** User-selected theme mode */
  mode: ThemeMode;
  /** System's preferred color scheme */
  systemTheme: ResolvedTheme;
}

interface ThemeActions {
  /** Set the theme mode (light, dark, or system) */
  setMode: (mode: ThemeMode) => void;
  /** Update the detected system theme */
  setSystemTheme: (theme: ResolvedTheme) => void;
  /** Get the resolved theme that should be applied */
  getResolvedTheme: () => ResolvedTheme;
}

export type ThemeStore = ThemeState & ThemeActions;

/**
 * Key used for localStorage persistence
 */
export const THEME_STORAGE_KEY = 'claude-browser-theme';

/**
 * Get the initial theme mode from localStorage or default to 'system'
 */
function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system';
  }
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/**
 * Get the system's preferred color scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: getInitialMode(),
  systemTheme: getSystemTheme(),

  setMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
    set({ mode });
  },

  setSystemTheme: (systemTheme) => set({ systemTheme }),

  getResolvedTheme: () => {
    const { mode, systemTheme } = get();
    if (mode === 'system') {
      return systemTheme;
    }
    return mode;
  },
}));
