import { playwright } from '@vitest/browser-playwright';
import type { BrowserConfigOptions } from 'vitest/node';

const instances: BrowserConfigOptions['instances'] = [
  { browser: 'chromium' },
  { browser: 'firefox' },
];

if (process.env.CI) {
  instances.push({ browser: 'webkit' });
}

export const browserTestConfig = {
  browser: {
    enabled: true,
    provider: playwright({ launchOptions: { headless: true } }),
    headless: true,
    instances,
  },
  fileParallelism: true,
} satisfies { browser: BrowserConfigOptions; fileParallelism: boolean };
