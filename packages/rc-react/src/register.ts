'use client';

import { useEffect } from 'react';

import { elementLoaders, type RcElementTag } from './loaders.js';

export interface RcRegisterProps {
  /** The custom element tags this page renders directly, such as `rc-card`. */
  tags: readonly RcElementTag[];
}

/**
 * Registers rc-webcomponents elements that a page renders as plain tags, such
 * as from a React Server Component, once the page has hydrated.
 *
 * Render it once near the root with every tag the page uses. Each definition
 * loads as its own chunk, and only after hydration, so React matches the
 * server markup before any element upgrades and adds its own attributes.
 * The wrapper components from this package's subpaths register themselves and
 * do not need it.
 */
export function RcRegister({ tags }: RcRegisterProps): null {
  const key = [...new Set(tags)].sort().join(' ');

  useEffect(() => {
    for (const tag of key.split(' ')) {
      const load = elementLoaders[tag as RcElementTag];

      if (!load) {
        if (import.meta.env.DEV) {
          console.warn(`[rc-react] <RcRegister> has no definition for "${tag}".`);
        }

        continue;
      }

      load().catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.error(`[rc-react] <RcRegister> could not load "${tag}".`, error);
        }
      });
    }
  }, [key]);

  return null;
}
