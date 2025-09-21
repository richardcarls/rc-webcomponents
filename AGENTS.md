# AGENTS.md

This is the authoritative project context for AI coding agents working in this repository.

`rc-webcomponents` is a WAI-ARIA compliant web components library built with Lit
3.x. It is a Yarn 4.x Berry monorepo with packages in `packages/`.

## Agent context policy

Keep shared AI-agent instructions in `AGENTS.md`. Treat tool-specific files as
adapters, not second sources of truth.

| File or directory | Purpose |
| --- | --- |
| `README.md` | Human-facing overview, package list, and public usage guidance. |
| `AGENTS.md` | Shared agent-facing project rules, commands, architecture constraints, and gotchas. |
| `CLAUDE.md` | Claude Code adapter only. It must import `AGENTS.md` and contain only Claude-specific notes. |
| `GEMINI.md` | Gemini CLI adapter only. It must point to `AGENTS.md` and contain only Gemini-specific notes. |
| `.github/copilot-instructions.md` | GitHub Copilot adapter only. It must point to `AGENTS.md`. |
| `.cursor/rules/*.mdc` | Cursor adapter rules only. They must point to `AGENTS.md`. |
| `.agents/` | Project-local reusable agent assets. Load these on demand. |

When adding support for another AI coding tool, make the tool's native context
file point back to `AGENTS.md` where the tool supports imports. If the tool
cannot import another file, keep the native file short and include a clear
instruction to read `AGENTS.md` before doing project work.

Do not duplicate package lists, commands, architecture rules, or testing notes
across agent files. Update `AGENTS.md` first, then adjust adapters only when the
adapter mechanism changes.

## Design principles

Four constraints guide every component. Not all packages fully satisfy all four
today; treat them as the acceptance bar for new work and the lens for reviewing
existing work.

### Progressive enhancement

Build on native HTML and browser behavior. A component wraps or enhances a native
element; it does not replace it. Feature-detect newer browser APIs before using
them, and do not throw when a feature is absent.

### Accessible by default

Implement the WAI-ARIA Authoring Practices Guide pattern where one exists:

- Correct `role`, `aria-*` states, and DOM structure.
- Full keyboard navigation; no interaction should require a pointer.
- Proper focus management, including trapping focus in modals, restoring focus on
  close, and avoiding accidental focus loss to `<body>`.
- Screen reader behavior is part of acceptance.

### Headless and UA-styled

Ship no visual design opinions beyond what is structurally necessary for correct
layout or behavior. Colors, fonts, borders, and spacing belong to the consumer.

Where defaults are needed, prefer browser UA styles and CSS system colors such
as `Canvas`, `CanvasText`, `ButtonFace`, `ButtonText`, `ButtonBorder`, `Field`,
`FieldText`, `Highlight`, `HighlightText`, `AccentColor`, `AccentColorText`,
and `GrayText`. Components must behave correctly under `forced-colors: active`;
interactive state must be communicated through ARIA attributes, focus, and
outlines rather than color alone.

Runtime geometry is the narrow exception: values derived from measurement or
user interaction, such as splitter pane sizes or virtual-canvas placeholder
dimensions, may be written as inline styles. Decorative styles belong in static
CSS or CSS custom properties.

### Responsive and touch-friendly

- Use Pointer Events API, not mouse-only events.
- Avoid hardcoded breakpoints inside component logic.
- Set minimum dimensions conservatively.
- Make keyboard step sizes configurable; Shift multiplies movement by 10 for coarse control.

## Architecture notes

- Components use Lit 3.x and TypeScript with `strict: true`, `noUnusedLocals`,
  and `noUnusedParameters`.
- Use light DOM when slotted consumer markup must remain in the document for
  native behavior or assistive technology, such as `<dialog>` and `<textarea>`.
- Shared interaction behaviors live in `rc-common` as `ReactiveController`
  classes or Lit directives so they compose cleanly onto any Lit host.
- Each package builds to ESM and UMD with declaration files. `sideEffects: false`
  enables tree-shaking when consumers import individual elements.
- `rc-dialog` intentionally exposes no CSS custom properties or parts. It wraps
  a native `<dialog>` with no shadow root; the consuming document has
  unrestricted CSS access.

## Environment (Windows)

**Always use `yarn.cmd` instead of `yarn`** (and `npx.cmd` instead of `npx`).
The Unix shim in `%APPDATA%\npm` is broken.

## Environment (Linux / Mac)

Use `yarn` and `npx` directly.

## Commands

Windows:

```powershell
yarn.cmd workspace @rcarls/<package> run dev           # Dev server with hot reload
yarn.cmd workspace @rcarls/<package> run build         # TypeScript check + Vite build
yarn.cmd workspace @rcarls/<package> run test:browser  # Run browser tests
yarn.cmd build                                         # Build all packages using the dependency graph
yarn.cmd test                                          # Test all packages
```

Linux / Mac:

```bash
yarn workspace @rcarls/<package> run dev           # Dev server with hot reload
yarn workspace @rcarls/<package> run build         # TypeScript check + Vite build
yarn workspace @rcarls/<package> run test:browser  # Run browser tests
yarn build                                         # Build all packages using the dependency graph
yarn test                                          # Test all packages
```

The root `build` script runs `yarn workspaces foreach --topological`, so Yarn
enforces package order from workspace dependencies. For targeted package work,
rebuild affected dependencies before running tests in packages that consume
them. Vite HMR does not watch dependency `dist/` output through `node_modules`;
restart the consuming package dev server after rebuilding a dependency.

## Browser test notes

Tests run in a real Firefox browser via WebDriverIO. Import pattern:

```ts
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { userEvent } from 'vitest/browser';
```

**Locator `.click()` vs. `dispatchEvent`** — The WebDriverIO locator's
`.click()` method (e.g. `screen.getByRole('menu').click()`) simulates a user
gesture and works correctly for most cases. However, it does **not** reliably
reach native `addEventListener('click', ...)` handlers registered directly on
the same element by a Lit directive. When testing directive-level click
handlers, dispatch the event explicitly:

```ts
const node = await el.element();
node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
```

Clicking an inner child and letting the event bubble to a directive-decorated
ancestor works fine with the locator's `.click()`.

**Programmatic focus** — Use `(await el.element()).focus()` to move focus
without triggering click handlers. Avoid `el.click()` when the goal is only to
focus, since it will also fire the directive's click listener.

## Packages

Dependencies listed as `→ dep1, dep2` (resolves to each dep's `dist/` output).
**Rebuild a package before running tests in packages that depend on it.**

- **rc-common**: Shared controllers and directives (`DragController`,
  `ResizeController`, `AnchorController`, `KeyboardNavigationDirective`,
  `MouseMoveDirective`)
- **rc-listbox**: Light-DOM ARIA listbox used by select, combobox, and
  transfer-list → rc-common
- **rc-menu**: ARIA menu popup → rc-common
- **rc-select**: Select-only combobox backed by native `<select>` → rc-common, rc-listbox
- **rc-combobox**: Editable combobox with filtering and allow-create →
  rc-common, rc-listbox, rc-select
- **rc-menu-button**: Menu button → rc-common, rc-menu
- **rc-menubar**: Menubar with roving tabindex → rc-common, rc-menu, rc-menu-button
- **rc-toolbar**: ARIA toolbar → rc-common
- **rc-splitter**: Resizable pane splitter → rc-common
- **rc-textarea**: Enhanced textarea (standalone)
- **rc-disclosure**: Disclosure widget (standalone)
- **rc-slider**: Slider widget (standalone)
- **rc-range-slider**: Range slider widget (standalone)
- **rc-transfer-list**: Transfer list → rc-listbox
- **rc-virtual-canvas**: Virtual canvas (standalone)
- **rc-dialog**: Draggable/resizable `<dialog>` wrapper → rc-common
- **rc-webcomponents**: Aggregate package → all component packages
