import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-menubar': {
    markup:
      '<rc-menubar label="Application menu"><rc-menu-button><button slot="trigger" type="button">File</button><rc-menu label="File"><button type="button">New</button></rc-menu></rc-menu-button></rc-menubar>',
    morphPending: 'writes state attributes on its host or children, which a morph removes',
  },
} satisfies SsrFixtures;
