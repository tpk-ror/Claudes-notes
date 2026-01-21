import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from './theme-provider';
import { useThemeStore } from '../../store/theme-store';

// Mock matchMedia
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
let mockMatches = false;
let mediaQueryCallback: ((event: MediaQueryListEvent) => void) | null = null;

const mockMatchMedia = vi.fn().mockImplementation(() => ({
  matches: mockMatches,
  addEventListener: (type: string, callback: (event: MediaQueryListEvent) => void) => {
    mockAddEventListener(type, callback);
    if (type === 'change') {
      mediaQueryCallback = callback;
    }
  },
  removeEventListener: mockRemoveEventListener,
}));

describe('ThemeProvider component', () => {
  beforeEach(() => {
    // Reset store state
    useThemeStore.setState({
      mode: 'system',
      systemTheme: 'light',
    });

    // Reset document classes
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.style.colorScheme = '';

    // Reset mocks
    mockMatches = false;
    mediaQueryCallback = null;
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();

    // Setup matchMedia mock
    Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia, writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Hello</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ThemeProvider>
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('system preference detection', () => {
    it('listens for system theme changes on mount', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('sets initial system theme to light when prefers-color-scheme is light', () => {
      mockMatches = false;

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(useThemeStore.getState().systemTheme).toBe('light');
    });

    it('sets initial system theme to dark when prefers-color-scheme is dark', () => {
      mockMatches = true;

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(useThemeStore.getState().systemTheme).toBe('dark');
    });

    it('updates system theme when prefers-color-scheme changes to dark', () => {
      mockMatches = false;

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(useThemeStore.getState().systemTheme).toBe('light');

      // Simulate system preference change
      act(() => {
        if (mediaQueryCallback) {
          mediaQueryCallback({ matches: true } as MediaQueryListEvent);
        }
      });

      expect(useThemeStore.getState().systemTheme).toBe('dark');
    });

    it('updates system theme when prefers-color-scheme changes to light', () => {
      mockMatches = true;

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(useThemeStore.getState().systemTheme).toBe('dark');

      // Simulate system preference change
      act(() => {
        if (mediaQueryCallback) {
          mediaQueryCallback({ matches: false } as MediaQueryListEvent);
        }
      });

      expect(useThemeStore.getState().systemTheme).toBe('light');
    });

    it('removes event listener on unmount', () => {
      const { unmount } = render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('theme class application', () => {
    it('applies light class when resolved theme is light', () => {
      useThemeStore.setState({ mode: 'light' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('applies dark class when resolved theme is dark', () => {
      useThemeStore.setState({ mode: 'dark' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('removes previous theme class when theme changes', () => {
      useThemeStore.setState({ mode: 'light' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);

      act(() => {
        useThemeStore.getState().setMode('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('applies system theme when mode is system and system prefers light', () => {
      mockMatches = false;
      useThemeStore.setState({ mode: 'system', systemTheme: 'light' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('applies system theme when mode is system and system prefers dark', () => {
      mockMatches = true;
      useThemeStore.setState({ mode: 'system', systemTheme: 'dark' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      // The provider will detect dark preference and apply it
      expect(useThemeStore.getState().systemTheme).toBe('dark');
    });
  });

  describe('color-scheme CSS property', () => {
    it('sets colorScheme to light when resolved theme is light', () => {
      useThemeStore.setState({ mode: 'light' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.style.colorScheme).toBe('light');
    });

    it('sets colorScheme to dark when resolved theme is dark', () => {
      useThemeStore.setState({ mode: 'dark' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('updates colorScheme when theme changes', () => {
      useThemeStore.setState({ mode: 'light' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.style.colorScheme).toBe('light');

      act(() => {
        useThemeStore.getState().setMode('dark');
      });

      expect(document.documentElement.style.colorScheme).toBe('dark');
    });
  });

  describe('reactivity', () => {
    it('updates theme when mode changes from light to dark', () => {
      useThemeStore.setState({ mode: 'light' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);

      act(() => {
        useThemeStore.getState().setMode('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('updates theme when system preference changes in system mode', () => {
      mockMatches = false;
      useThemeStore.setState({ mode: 'system' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);

      act(() => {
        if (mediaQueryCallback) {
          mediaQueryCallback({ matches: true } as MediaQueryListEvent);
        }
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('does not change theme when system preference changes in explicit mode', () => {
      mockMatches = false;
      useThemeStore.setState({ mode: 'light' });

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);

      act(() => {
        if (mediaQueryCallback) {
          mediaQueryCallback({ matches: true } as MediaQueryListEvent);
        }
      });

      // Theme should still be light because mode is explicitly set
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });
  });
});
