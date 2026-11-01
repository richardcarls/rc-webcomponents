import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-segmented-button': {
    markup:
      '<rc-segmented-button><fieldset><legend>Size</legend><label><input type="radio" name="size" value="s" checked> Small</label><label><input type="radio" name="size" value="l"> Large</label></fieldset></rc-segmented-button>',
  },
} satisfies SsrFixtures;
