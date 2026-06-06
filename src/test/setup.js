/**
 * Global test setup. Runs before every test file.
 *
 * - Brings in `@testing-library/jest-dom` matchers (`toBeInTheDocument`, etc).
 * - Stubs `window.matchMedia` because `next-themes` and a few components ask
 *   for it on mount and jsdom does not implement it.
 * - Mocks `import.meta.env.VITE_API_URL` so axios has a base.
 */
import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
