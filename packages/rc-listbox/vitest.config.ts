import { defineConfig } from 'vitest/config';
import { webdriverio } from '@vitest/browser-webdriverio';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: webdriverio(),
      instances: [
        { browser: 'firefox' },
      ],
    },
  },
});
