import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useThemeStore, THEME_STORAGE_KEY } from './theme-store';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock matchMedia
const mockMatchMedia = vi.fn();

describe('useThemeStore', () => {
  beforeEach(() => {
    // Reset store state
    useThemeStore.setState({
      mode: 'system',
      systemTheme: 'light',
    });

    // Setup mocks
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia });

    // Default matchMedia mock
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have mode as system by default', () => {
      expect(useThemeStore.getState().mode).toBe('system');
    });

    it('should have systemTheme as light by default', () => {
      expect(useThemeStore.getState().systemTheme).toBe('light');
    });
  });

  describe('THEME_STORAGE_KEY', () => {
    it('should be defined', () => {
      expect(THEME_STORAGE_KEY).toBe('claude-browser-theme');
    });
  });

  describe('setMode', () => {
    it('should set mode to light', () => {
      useThemeStore.getState().setMode('light');
      expect(useThemeStore.getState().mode).toBe('light');
    });

    it('should set mode to dark', () => {
      useThemeStore.getState().setMode('dark');
      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('should set mode to system', () => {
      useThemeStore.getState().setMode('dark');
      useThemeStore.getState().setMode('system');
      expect(useThemeStore.getState().mode).toBe('system');
    });

    it('should persist mode to localStorage', () => {
      useThemeStore.getState().setMode('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
    });

    it('should persist light mode to localStorage', () => {
      useThemeStore.getState().setMode('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light');
    });

    it('should persist system mode to localStorage', () => {
      useThemeStore.getState().setMode('system');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'system');
    });
  });

  describe('setSystemTheme', () => {
    it('should set systemTheme to dark', () => {
      useThemeStore.getState().setSystemTheme('dark');
      expect(useThemeStore.getState().systemTheme).toBe('dark');
    });

    it('should set systemTheme to light', () => {
      useThemeStore.getState().setSystemTheme('dark');
      useThemeStore.getState().setSystemTheme('light');
      expect(useThemeStore.getState().systemTheme).toBe('light');
    });
  });

  describe('getResolvedTheme', () => {
    it('should return light when mode is light', () => {
      useThemeStore.getState().setMode('light');
      expect(useThemeStore.getState().getResolvedTheme()).toBe('light');
    });

    it('should return dark when mode is dark', () => {
      useThemeStore.getState().setMode('dark');
      expect(useThemeStore.getState().getResolvedTheme()).toBe('dark');
    });

    it('should return systemTheme when mode is system (light)', () => {
      useThemeStore.getState().setMode('system');
      useThemeStore.getState().setSystemTheme('light');
      expect(useThemeStore.getState().getResolvedTheme()).toBe('light');
    });

    it('should return systemTheme when mode is system (dark)', () => {
      useThemeStore.getState().setMode('system');
      useThemeStore.getState().setSystemTheme('dark');
      expect(useThemeStore.getState().getResolvedTheme()).toBe('dark');
    });

    it('should update resolved theme when systemTheme changes in system mode', () => {
      useThemeStore.getState().setMode('system');
      useThemeStore.getState().setSystemTheme('light');
      expect(useThemeStore.getState().getResolvedTheme()).toBe('light');

      useThemeStore.getState().setSystemTheme('dark');
      expect(useThemeStore.getState().getResolvedTheme()).toBe('dark');
    });

    it('should not be affected by systemTheme when mode is explicit', () => {
      useThemeStore.getState().setMode('light');
      useThemeStore.getState().setSystemTheme('dark');
      expect(useThemeStore.getState().getResolvedTheme()).toBe('light');
    });
  });

  describe('reactivity', () => {
    it('should update when mode changes', () => {
      const { setMode } = useThemeStore.getState();
      setMode('dark');
      expect(useThemeStore.getState().mode).toBe('dark');
      setMode('light');
      expect(useThemeStore.getState().mode).toBe('light');
    });

    it('should update when systemTheme changes', () => {
      const { setSystemTheme } = useThemeStore.getState();
      setSystemTheme('dark');
      expect(useThemeStore.getState().systemTheme).toBe('dark');
      setSystemTheme('light');
      expect(useThemeStore.getState().systemTheme).toBe('light');
    });
  });
});
