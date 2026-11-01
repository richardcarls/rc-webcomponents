import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-textarea': {
    markup: '<rc-textarea><textarea aria-label="Message">Hello</textarea></rc-textarea>',
    pending:
      'the gutter mirrors a measured line height, which differs when measured over the ' +
      'server-rendered editor',
  },
} satisfies SsrFixtures;
