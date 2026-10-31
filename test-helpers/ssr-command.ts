import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import type { BrowserCommand } from 'vitest/node';

const SCRIPT = fileURLToPath(new URL('../scripts/ssr-render.mjs', import.meta.url));
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Renders markup with Lit's server renderer in a separate Node process. */
export const renderOnServer: BrowserCommand<[markup: string]> = (_context, markup) =>
  execFileSync(process.execPath, [SCRIPT], { cwd: ROOT, input: markup, encoding: 'utf8' });

declare module 'vitest/browser' {
  interface BrowserCommands {
    renderOnServer: (markup: string) => Promise<string>;
  }
}
