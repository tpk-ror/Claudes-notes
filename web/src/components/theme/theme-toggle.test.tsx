import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeToggle } from './theme-toggle';
import { useThemeStore, THEME_STORAGE_KEY } from '../../store/theme-store';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

describe('ThemeToggle component', () => {
  beforeEach(() => {
    // Reset store state
    useThemeStore.setState({
      mode: 'system',
      systemTheme: 'light',
    });

    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  describe('basic rendering', () => {
    it('renders with data-testid', () => {
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('renders as a button', () => {
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle').tagName).toBe('BUTTON');
    });

    it('applies custom className', () => {
      render(<ThemeToggle className="custom-class" />);
      expect(screen.getByTestId('theme-toggle')).toHaveClass('custom-class');
    });

    it('has accessible aria-label', () => {
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('theme')
      );
    });
  });

  describe('mode display', () => {
    it('displays data-mode attribute for current mode', () => {
      useThemeStore.setState({ mode: 'system' });
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toHaveAttribute('data-mode', 'system');
    });

    it('displays data-mode as light when mode is light', () => {
      useThemeStore.setState({ mode: 'light' });
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toHaveAttribute('data-mode', 'light');
    });

    it('displays data-mode as dark when mode is dark', () => {
      useThemeStore.setState({ mode: 'dark' });
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toHaveAttribute('data-mode', 'dark');
    });

    it('displays data-resolved-theme attribute', () => {
      useThemeStore.setState({ mode: 'system', systemTheme: 'light' });
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toHaveAttribute('data-resolved-theme', 'light');
    });

    it('displays resolved theme as dark when mode is dark', () => {
      useThemeStore.setState({ mode: 'dark' });
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toHaveAttribute('data-resolved-theme', 'dark');
    });
  });

  describe('icon rendering', () => {
    it('renders an icon inside the button', () => {
      render(<ThemeToggle />);
      const button = screen.getByTestId('theme-toggle');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('icon has aria-hidden for accessibility', () => {
      render(<ThemeToggle />);
      const button = screen.getByTestId('theme-toggle');
      const svg = button.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders monitor icon when mode is system', () => {
      useThemeStore.setState({ mode: 'system' });
      render(<ThemeToggle />);
      const button = screen.getByTestId('theme-toggle');
      const svg = button.querySelector('svg');
      // Monitor icon has a rect element
      expect(svg?.querySelector('rect')).toBeInTheDocument();
    });

    it('renders sun icon when resolved theme is light and mode is not system', () => {
      useThemeStore.setState({ mode: 'light' });
      render(<ThemeToggle />);
      const button = screen.getByTestId('theme-toggle');
      const svg = button.querySelector('svg');
      // Sun icon has a circle element
      expect(svg?.querySelector('circle')).toBeInTheDocument();
    });

    it('renders moon icon when resolved theme is dark and mode is not system', () => {
      useThemeStore.setState({ mode: 'dark' });
      render(<ThemeToggle />);
      const button = screen.getByTestId('theme-toggle');
      const svg = button.querySelector('svg');
      // Moon icon has a path but no circle or rect
      expect(svg?.querySelector('path')).toBeInTheDocument();
      expect(svg?.querySelector('circle')).not.toBeInTheDocument();
      expect(svg?.querySelector('rect')).not.toBeInTheDocument();
    });
  });

  describe('click behavior - mode cycling', () => {
    it('cycles from system to light on click', () => {
      useThemeStore.setState({ mode: 'system' });
      render(<ThemeToggle />);

      fireEvent.click(screen.getByTestId('theme-toggle'));

      expect(useThemeStore.getState().mode).toBe('light');
    });

    it('cycles from light to dark on click', () => {
      useThemeStore.setState({ mode: 'light' });
      render(<ThemeToggle />);

      fireEvent.click(screen.getByTestId('theme-toggle'));

      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('cycles from dark to system on click', () => {
      useThemeStore.setState({ mode: 'dark' });
      render(<ThemeToggle />);

      fireEvent.click(screen.getByTestId('theme-toggle'));

      expect(useThemeStore.getState().mode).toBe('system');
    });

    it('completes full cycle: system -> light -> dark -> system', () => {
      useThemeStore.setState({ mode: 'system' });
      render(<ThemeToggle />);
      const button = screen.getByTestId('theme-toggle');

      // system -> light
      fireEvent.click(button);
      expect(useThemeStore.getState().mode).toBe('light');

      // light -> dark
      fireEvent.click(button);
      expect(useThemeStore.getState().mode).toBe('dark');

      // dark -> system
      fireEvent.click(button);
      expect(useThemeStore.getState().mode).toBe('system');
    });
  });

  describe('localStorage persistence', () => {
    it('persists mode to localStorage on click', () => {
      useThemeStore.setState({ mode: 'system' });
      render(<ThemeToggle />);

      fireEvent.click(screen.getByTestId('theme-toggle'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light');
    });

    it('persists dark mode to localStorage', () => {
      useThemeStore.setState({ mode: 'light' });
      render(<ThemeToggle />);

      fireEvent.click(screen.getByTestId('theme-toggle'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
    });

    it('persists system mode to localStorage', () => {
      useThemeStore.setState({ mode: 'dark' });
      render(<ThemeToggle />);

      fireEvent.click(screen.getByTestId('theme-toggle'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'system');
    });
  });

  describe('button styling', () => {
    it('uses ghost variant styling', () => {
      render(<ThemeToggle />);
      // Ghost variant typically has no background by default
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('uses sm size styling', () => {
      render(<ThemeToggle />);
      const button = screen.getByTestId('theme-toggle');
      // SM size typically has smaller padding
      expect(button).toBeInTheDocument();
    });

    it('has gap-2 class for icon spacing', () => {
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toHaveClass('gap-2');
    });
  });

  describe('accessibility', () => {
    it('has screen reader text for current mode', () => {
      useThemeStore.setState({ mode: 'system' });
      render(<ThemeToggle />);
      expect(screen.getByText('System')).toHaveClass('sr-only');
    });

    it('updates screen reader text when mode is light', () => {
      useThemeStore.setState({ mode: 'light' });
      render(<ThemeToggle />);
      expect(screen.getByText('Light')).toHaveClass('sr-only');
    });

    it('updates screen reader text when mode is dark', () => {
      useThemeStore.setState({ mode: 'dark' });
      render(<ThemeToggle />);
      expect(screen.getByText('Dark')).toHaveClass('sr-only');
    });

    it('aria-label includes current mode', () => {
      useThemeStore.setState({ mode: 'light' });
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Light')
      );
    });

    it('aria-label indicates click action', () => {
      render(<ThemeToggle />);
      expect(screen.getByTestId('theme-toggle')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Click to change')
      );
    });
  });

  describe('reactivity', () => {
    it('updates display when store mode changes externally', () => {
      useThemeStore.setState({ mode: 'light' });
      render(<ThemeToggle />);

      expect(screen.getByTestId('theme-toggle')).toHaveAttribute('data-mode', 'light');

      act(() => {
        useThemeStore.setState({ mode: 'dark' });
      });

      expect(screen.getByTestId('theme-toggle')).toHaveAttribute('data-mode', 'dark');
    });

    it('updates resolved theme when systemTheme changes in system mode', () => {
      useThemeStore.setState({ mode: 'system', systemTheme: 'light' });
      render(<ThemeToggle />);

      expect(screen.getByTestId('theme-toggle')).toHaveAttribute('data-resolved-theme', 'light');

      act(() => {
        useThemeStore.setState({ systemTheme: 'dark' });
      });

      expect(screen.getByTestId('theme-toggle')).toHaveAttribute('data-resolved-theme', 'dark');
    });
  });
});
