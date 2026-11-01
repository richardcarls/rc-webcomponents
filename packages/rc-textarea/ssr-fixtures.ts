import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-textarea': {
    markup: '<rc-textarea><textarea aria-label="Message">Hello</textarea></rc-textarea>',
    morphPending:
      'reflects default property values and writes state attributes, which a morph removes',
  },
} satisfies SsrFixtures;
