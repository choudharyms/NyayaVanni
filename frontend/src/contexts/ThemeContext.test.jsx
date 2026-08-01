import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

function Probe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} data-testid="theme-probe">
      theme:{theme}
    </button>
  );
}

function renderProbe() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );
}

function mockMatchMedia(prefersDark) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('respects the system preference when no stored theme exists', () => {
    mockMatchMedia(true);
    renderProbe();
    expect(screen.getByTestId('theme-probe').textContent).toBe('theme:dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('prefers a stored manual preference over the system preference', () => {
    localStorage.setItem('nyaya_theme', 'light');
    mockMatchMedia(true);
    renderProbe();
    expect(screen.getByTestId('theme-probe').textContent).toBe('theme:light');
  });

  it('persists the theme after toggling', () => {
    mockMatchMedia(false);
    renderProbe();
    const probe = screen.getByTestId('theme-probe');
    expect(probe.textContent).toBe('theme:light');

    fireEvent.click(probe);
    expect(probe.textContent).toBe('theme:dark');
    expect(localStorage.getItem('nyaya_theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
