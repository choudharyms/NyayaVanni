import { render } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConversationHistoryProvider } from './contexts/ConversationHistoryContext';
import ContactUs from './pages/ContactUs';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function renderWithProviders(ui) {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ConversationHistoryProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </ConversationHistoryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

describe('Accessibility: interactive controls have accessible names', () => {
  it('contact form buttons and inputs are labeled', () => {
    const { container } = renderWithProviders(<ContactUs />);

    const buttons = container.querySelectorAll('button');
    for (const button of buttons) {
      const name =
        button.getAttribute('aria-label') ||
        button.getAttribute('title') ||
        button.textContent.trim();
      expect(name, 'Button should have an accessible name').toBeTruthy();
    }

    const inputs = container.querySelectorAll('input, textarea, select');
    for (const input of inputs) {
      const labeled =
        input.getAttribute('aria-label') ||
        (input.id &&
          container.querySelector(`label[for="${input.id}"]`)) ||
        input.closest('label');
      expect(
        labeled,
        'Every form control should have an associated label'
      ).toBeTruthy();
    }
  });
});
