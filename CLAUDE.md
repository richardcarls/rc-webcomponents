# CLAUDE.md

WAI-ARIA compliant web components library built with Lit 3.x. Monorepo using Yarn 4.x Berry (PnP mode) with packages in `packages/`.

## Design principles

Four constraints guide every component. Not all packages fully satisfy all four today — treat them as the acceptance bar for new work and the lens for reviewing existing work.

**1. Progressive enhancement** — Build on native HTML. A component wraps or enhances a native element; it doesn't replace it. Feature-detect before using newer browser APIs; nothing throws when a feature is absent.

**2. Accessible by default** — Implement the WAI-ARIA APG pattern where one exists: correct `role`, `aria-*` states, full keyboard navigation, proper focus management (trap in modals, restore on close). Screen reader behavior is part of acceptance.

**3. Headless / UA styles, WCAG 2.1 by default** — Ship no color, font, or layout opinions. Where defaults are needed, use only [CSS System Colors](https://www.w3.org/TR/css-color-4/#css-system-colors) (`Canvas`, `CanvasText`, `ButtonFace`, `ButtonText`, `ButtonBorder`, `Field`, `FieldText`, `Highlight`, `HighlightText`, `AccentColor`, `AccentColorText`, `GrayText`, etc.) so light/dark mode and OS-level high-contrast themes come for free. Never use raw hex, `rgb()`, `hsl()`, or named colors (e.g. `black`, `white`) for foreground/background/border — wrap any unavoidable decorative values (drop shadows) in a CSS custom property with a system-color-compatible default. Components must also behave correctly under `forced-colors: active` (Windows High Contrast): rely on system colors rather than overriding them, and ensure interactive state is communicated via ARIA attributes and `outline` rather than color alone.

**4. Responsive and touch-friendly** — Use Pointer Events API (not mouse-only). No hardcoded breakpoints inside component logic. Keyboard step sizes are configurable (Shift = 10×). Set minimum dimensions conservatively.

## Commands

```bash
yarn workspace @rcarls/<package> run dev           # Dev server with hot reload
yarn workspace @rcarls/<package> run build         # TypeScript check + Vite build
yarn workspace @rcarls/<package> run test:browser  # Run browser tests
yarn workspaces run build                          # Build all packages
```

## Packages

Dependencies listed as `→ dep1, dep2` (resolves to each dep's `dist/` output). **Rebuild a dep before running tests in packages that depend on it.** Vite's HMR does not watch `node_modules` for dist changes — a dev server restart is required after rebuilding a dependency.

- **rc-common**: Shared controllers and directives — `DragController`, `ResizeController`, `AnchorController`, `KeyboardNavigationDirective`, `MouseMoveDirective`
- **rc-menu**: ARIA menu popup → rc-common
- **rc-menu-button**: Button that opens an ARIA menu → rc-common, rc-menu
- **rc-menubar**: ARIA menubar with roving tabindex → rc-common, rc-menu-button
- **rc-toolbar**: ARIA toolbar → rc-common
- **rc-splitter**: Resizable pane splitter → rc-common
- **rc-textarea**: Enhanced textarea — line decorations, gutter, plugin API (standalone)
- **rc-dialog**: Draggable/resizable `<dialog>` wrapper with event forwarding → rc-common
- **rc-virtual-canvas**: Virtualized canvas (standalone)

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

## Architecture notes

- All components use `LitElement` with `createRenderRoot() { return this; }` (light DOM) where slotted consumer markup must remain in the document — e.g. `<dialog>` for AT access, `<textarea>` for form wiring.
- Shared interaction behaviors live in `rc-common` as `ReactiveController` subclasses so they compose cleanly onto any `LitElement` host.
- Each package builds to ESM + UMD with declaration files. `sideEffects: false` enables tree-shaking when consumers import individual elements.
- `rc-dialog` intentionally exposes no CSS custom properties or parts. It wraps a native `<dialog>` with no shadow root — the consuming document has full unrestricted CSS access. Adding custom properties would add indirection without benefit.
