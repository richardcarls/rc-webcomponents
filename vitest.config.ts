import { defineConfig } from 'vitest/config';

import { createBrowserTestConfig } from './vitest.browser.config';

export default defineConfig({
  test: {
    reporters: [['default', { summary: true }]],
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['packages/*/src/**/*.unit.test.ts'],
          exclude: ['scripts/*.test.mjs'],
          maxWorkers: 2,
          sequence: { groupOrder: 0 },
        },
      },
      {
        test: createBrowserTestConfig(
          {
            name: 'browser-components',
            include: ['packages/*/src/**/*.test.ts'],
            exclude: [
              'packages/*/src/**/*.unit.test.ts',
              'packages/rc-virtual-scroller/src/**/*.geometry.test.ts',
              'packages/rc-bottom-sheet/src/**/*.test.ts',
              'packages/rc-splitter/src/**/*.test.ts',
            ],
            maxWorkers: 2,
            sequence: { groupOrder: 1 },
          },
          1,
        ),
      },
      {
        test: createBrowserTestConfig(
          {
            name: 'browser-geometry',
            include: [
              'packages/rc-virtual-scroller/src/**/*.geometry.test.ts',
              'packages/rc-bottom-sheet/src/**/*.test.ts',
              'packages/rc-splitter/src/**/*.test.ts',
            ],
            fileParallelism: false,
            sequence: { groupOrder: 2 },
          },
          2,
        ),
      },
      {
        test: createBrowserTestConfig(
          {
            name: 'browser-themes',
            include: [
              'packages/rc-theme-material/*.test.ts',
              'packages/rc-theme-substrate/*.test.ts',
              'packages/rc-theme-win31/*.test.ts',
            ],
            fileParallelism: false,
            sequence: { groupOrder: 3 },
          },
          3,
        ),
      },
    ],
  },
});
