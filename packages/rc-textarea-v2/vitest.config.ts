import { defineConfig } from 'vitest/config';
import { webdriverio } from '@vitest/browser-webdriverio';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: webdriverio(),
      // https://vitest.dev/guide/browser/webdriverio
      instances: [
        { browser: 'chrome' },
        { browser: 'firefox' },
        // { browser: 'edge' },
      ],
    },
  },
});
