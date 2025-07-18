# AGENTS.md

WAI-ARIA compliant web components library built with Lit 3.x. Monorepo using Yarn workspaces with packages in `packages/`.

## Environment (Windows)

**Always use `yarn.cmd` instead of `yarn`** (and `npx.cmd` instead of `npx`). The Unix shim in `%APPDATA%\npm` is broken.

## Commands

```bash
yarn.cmd workspace @rcarls/<package> run dev           # Dev server with hot reload
yarn.cmd workspace @rcarls/<package> run build         # TypeScript check + Vite build
yarn.cmd workspace @rcarls/<package> run test:browser  # Run browser tests
yarn.cmd workspaces run build                          # Build all packages
```

## Browser test notes

Tests run in a real Firefox browser via WebDriverIO. Import pattern:

```ts
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { userEvent } from 'vitest/browser';
```

**Locator `.click()` vs. `dispatchEvent`** — The WebDriverIO locator's `.click()` method (e.g. `screen.getByRole('menu').click()`) simulates a user gesture and works correctly for most cases. However, it does **not** reliably reach native `addEventListener('click', ...)` handlers registered directly on the same element by a Lit directive. When testing directive-level click handlers, dispatch the event explicitly:

```ts
const node = await el.element();
node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
```

Clicking an inner child and letting the event bubble to a directive-decorated ancestor works fine with the locator's `.click()`.

**Programmatic focus** — Use `(await el.element()).focus()` to move focus without triggering click handlers. Avoid `el.click()` when the goal is only to focus, since it will also fire the directive's click listener.

## Packages

Dependencies listed as `→ dep1, dep2` (resolves to each dep's `dist/` output). **Rebuild a package before running tests in packages that depend on it.**

- **rc-common**: Shared directives (`KeyboardNavigationDirective`, `MouseMoveDirective`)
- **rc-menu**: Menu popup → rc-common
- **rc-menu-button**: Menu button → rc-common, rc-menu
- **rc-menubar**: Menubar → rc-common, rc-menu-button
- **rc-toolbar**: Toolbar → rc-common
- **rc-splitter**: Window splitter → rc-common
- **rc-textarea**: Enhanced textarea (standalone)
- **rc-textarea**: Enhanced textarea (standalone)
- **rc-virtual-canvas**: Virtual canvas (standalone)
