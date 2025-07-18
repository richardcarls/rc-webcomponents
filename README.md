# rc-webcomponents

A collection of WAI-ARIA compliant web components built with [Lit 3.x](https://lit.dev). Yarn workspaces monorepo — each package is independently consumable.

## Design principles

These are the guiding constraints for every component in the collection. Not every package fully achieves all four today, but they serve as the target for new work and the lens for reviewing existing work.

### 1. Progressive enhancement

Components build on top of native HTML elements and browser-provided behavior. A `<dialog>` is still a `<dialog>`; an `<rc-dialog>` adds drag, resize, and event forwarding on top of it without replacing it. When JavaScript is absent, blocked, or slow, the underlying markup remains meaningful. Feature detection gates enhanced behaviors — nothing throws if a browser API is unsupported.

### 2. Accessible by default

Every component implements the corresponding [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) pattern where one exists. This means:

- Correct `role`, `aria-*` states, and DOM structure out of the box.
- Full keyboard navigation — no interaction that requires a pointer.
- Focus management: trap focus in modals, restore focus on close, never lose focus to `<body>` unexpectedly.
- Screen reader testing is part of acceptance, not an afterthought.

### 3. Headless — UA styles, light/dark mode

Components ship with **no imposed visual styling** beyond what is structurally necessary for correct layout or behavior. Colors, fonts, borders, and spacing are left to the consumer. Where a default value is needed (e.g. a resize cursor, a minimum size), it defers to the browser UA stylesheet or CSS system color keywords (`Canvas`, `ButtonText`, `ButtonBorder`, etc.) so that light and dark mode come for free via `color-scheme`.

The goal: drop a component into any design system and it fits without fighting.

### 4. Responsive and touch-friendly

- Pointer events (`pointerdown`, `pointermove`, `pointerup`) rather than mouse-only events — touch and stylus work out of the box.
- No hardcoded pixel breakpoints inside component logic.
- Minimum dimensions are set conservatively so components don't collapse on narrow viewports.
- Keyboard step sizes (arrow keys) are configurable; Shift multiplies by 10× for coarse control.

---

## Packages

| Package | Description | Depends on |
| --- | --- | --- |
| [`rc-common`](packages/rc-common/) | Shared controllers and directives: `DragController`, `ResizeController`, `AnchorController`, `KeyboardNavigationDirective`, `MouseMoveDirective` | — |
| [`rc-menu`](packages/rc-menu/) | ARIA `menu` / `menuitem` popup | rc-common |
| [`rc-menu-button`](packages/rc-menu-button/) | Button that opens an ARIA menu | rc-common, rc-menu |
| [`rc-menubar`](packages/rc-menubar/) | ARIA `menubar` with roving tabindex | rc-common, rc-menu-button |
| [`rc-toolbar`](packages/rc-toolbar/) | ARIA `toolbar` with roving tabindex | rc-common |
| [`rc-splitter`](packages/rc-splitter/) | Resizable pane splitter (`separator` role) | rc-common |
| [`rc-textarea`](packages/rc-textarea/) | Enhanced `<textarea>` — line decorations, gutter, plugin API | — |
| [`rc-dialog`](packages/rc-dialog/) | Draggable, resizable `<dialog>` wrapper with accessible event forwarding | rc-common |
| [`rc-virtual-canvas`](packages/rc-virtual-canvas/) | Virtualized canvas for large datasets | — |

Workspace dependency arrows show which packages must be **rebuilt** before dependent packages will pick up changes (they resolve to each dep's `dist/` output, not source).

---

## Stack

| Concern | Tool |
| --- | --- |
| Component model | Lit 3.x (web components, `LitElement`, reactive controllers) |
| Language | TypeScript — `strict: true`, `noUnusedLocals`, `noUnusedParameters` |
| Build | Vite — ESM + UMD outputs, declaration files via `vite-plugin-dts` |
| Dev server | Vite dev server with HMR per package |
| Testing | Vitest + WebdriverIO (real browser) |
| Package manager | Yarn 4.x Berry (workspaces + PnP) |

---

## Commands

```bash
# Dev server for a single package (hot reload)
yarn.cmd workspace @rcarls/<package> run dev

# TypeScript check + Vite build for a single package
yarn.cmd workspace @rcarls/<package> run build

# Build all packages (respects dependency order manually — see below)
yarn.cmd workspaces run build

# Browser tests for a single package
yarn.cmd workspace @rcarls/<package> run test:browser
```

> **Dependency rebuild order:** `rc-common` → `rc-menu` → `rc-menu-button` → `rc-menubar` / `rc-toolbar` / `rc-splitter` / `rc-dialog`. Rebuild a dep before running tests in packages that consume it; Vite's HMR does not watch `node_modules` for dist changes.
