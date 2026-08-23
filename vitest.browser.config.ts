import { playwright } from '@vitest/browser-playwright';
import type { BrowserConfigOptions, InlineConfig } from 'vitest/node';

const BROWSER_NAMES = ['chromium', 'firefox', 'webkit'] as const;

type BrowserName = (typeof BROWSER_NAMES)[number];

function isBrowserName(value: string | undefined): value is BrowserName {
  return BROWSER_NAMES.some((browserName) => browserName === value);
}

function getRequestedBrowser(): BrowserName | undefined {
  if (isBrowserName(process.env.RC_TEST_BROWSER)) {
    return process.env.RC_TEST_BROWSER;
  }

  const projectArgument = process.argv.find((argument) => argument.startsWith('--project='));
  const projectName = projectArgument?.slice('--project='.length);

  return isBrowserName(projectName) ? projectName : undefined;
}

function getBrowserInstances(groupOrder?: number): BrowserConfigOptions['instances'] {
  const requestedBrowser = getRequestedBrowser();

  if (requestedBrowser) {
    return [{ browser: requestedBrowser }];
  }

  if (process.env.CI || process.env.RC_FULL_BROWSER_MATRIX) {
    return BROWSER_NAMES.map((browser, index) => ({
      browser,
      ...(groupOrder === undefined
        ? {}
        : { sequence: { groupOrder: groupOrder + index * BROWSER_NAMES.length } }),
    }));
  }

  return [{ browser: 'chromium' }];
}

/** Creates the shared Playwright-backed Vitest Browser Mode configuration. */
export function createBrowserTestConfig(
  overrides: InlineConfig = {},
  groupOrder?: number,
): InlineConfig {
  return {
    fileParallelism: true,
    isolate: true,
    ...overrides,
    exclude: ['**/*.unit.test.ts', 'scripts/*.test.mjs', ...(overrides.exclude ?? [])],
    browser: {
      enabled: true,
      provider: playwright({ launchOptions: { headless: true } }),
      headless: true,
      screenshotFailures: false,
      instances: getBrowserInstances(groupOrder),
    },
  };
}

export const browserTestConfig = createBrowserTestConfig();
