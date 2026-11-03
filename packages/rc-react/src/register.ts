'use client';

import { useEffect } from 'react';

import { elementLoaders, type RCElementTag } from './loaders.js';

export interface RCRegisterProps {
  /** The custom element tags this page renders directly, such as `rc-card`. */
  tags: readonly RCElementTag[];
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
export function RCRegister({ tags }: RCRegisterProps): null {
  const key = [...new Set(tags)].sort().join(' ');

  useEffect(() => {
    for (const tag of key.split(' ')) {
      const load = elementLoaders[tag as RCElementTag];

      if (!load) {
        if (import.meta.env.DEV) {
          console.warn(`[rc-react] <RCRegister> has no definition for "${tag}".`);
        }

        continue;
      }

      load().catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.error(`[rc-react] <RCRegister> could not load "${tag}".`, error);
        }
      });
    }
  }, [key]);

  return null;
}
