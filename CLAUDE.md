# CLAUDE.md

WAI-ARIA compliant web components library built with Lit 3.x. Monorepo using Yarn workspaces with packages in `packages/`.

## Design principles

Four constraints guide every component. Not all packages fully satisfy all four today — treat them as the acceptance bar for new work and the lens for reviewing existing work.

**1. Progressive enhancement** — Build on native HTML. A component wraps or enhances a native element; it doesn't replace it. Feature-detect before using newer browser APIs; nothing throws when a feature is absent.

**2. Accessible by default** — Implement the WAI-ARIA APG pattern where one exists: correct `role`, `aria-*` states, full keyboard navigation, proper focus management (trap in modals, restore on close). Screen reader behavior is part of acceptance.

**3. Headless / UA styles** — Ship no color, font, or layout opinions. Where defaults are needed, use CSS system color keywords (`Canvas`, `ButtonText`, `ButtonBorder`, etc.) so light/dark mode comes for free via `color-scheme`. Components must drop into any design system without fighting it.

**4. Responsive and touch-friendly** — Use Pointer Events API (not mouse-only). No hardcoded breakpoints inside component logic. Keyboard step sizes are configurable (Shift = 10×). Set minimum dimensions conservatively.

## Environment (Windows)

**Always use `yarn.cmd` instead of `yarn`** (and `npx.cmd` instead of `npx`). The Unix shim in `%APPDATA%\npm` is broken.

## Commands

```bash
yarn.cmd workspace @rcarls/<package> run dev           # Dev server with hot reload
yarn.cmd workspace @rcarls/<package> run build         # TypeScript check + Vite build
yarn.cmd workspace @rcarls/<package> run test:browser  # Run browser tests
yarn.cmd workspaces run build                          # Build all packages
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

## Architecture notes

- All components use `LitElement` with `createRenderRoot() { return this; }` (light DOM) where slotted consumer markup must remain in the document — e.g. `<dialog>` for AT access, `<textarea>` for form wiring.
- Shared interaction behaviors live in `rc-common` as `ReactiveController` subclasses so they compose cleanly onto any `LitElement` host.
- Each package builds to ESM + UMD with declaration files. `sideEffects: false` enables tree-shaking when consumers import individual elements.
