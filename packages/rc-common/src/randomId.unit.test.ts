import { expect, test, vi } from 'vitest';

import { randomId } from './randomId.js';

test('generates a UUID when Web Crypto is unavailable', () => {
  vi.stubGlobal('crypto', undefined);

  try {
    expect(randomId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  } finally {
    vi.unstubAllGlobals();
  }
});
