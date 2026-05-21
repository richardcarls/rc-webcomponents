# rc-webcomponents

A collection of WAI-ARIA compliant web components built with [Lit 3.x](https://lit.dev). Yarn workspaces monorepo — each package is independently consumable.

## Design principles

These are the guiding constraints for every component in the collection. Not every package fully achieves all four today, but they serve as the target for new work and the lens for reviewing existing work.

### 1. Progressive enhancement

Components build on top of native HTML elements and browser-provided behavior. A `<dialog>` is still a `<dialog>`; an `<rc-dialog>` adds drag, resize, and event forwarding on top of it without replacing it. When JavaScript is absent, blocked, or slow, the underlying markup remains meaningful. Feature detection gates enhanced behaviors — nothing throws if a browser API is unsupported.

Components that wrap form controls require the consumer to supply the native element as a direct child. That element stays in the DOM permanently so that:

- **Form association** — `name` and `value` submit correctly in any `<form>` without any `ElementInternals` setup.
- **Label association** — `<label for="id">`, a wrapping `<label>`, or `aria-label` on the native input all work natively, because there is no shadow DOM boundary to cross.
- **Pre-upgrade usability** — the native control is fully interactive before the custom element registers, and remains so if registration never occurs.

The component's job is to enhance: keyboard shortcuts, ARIA state, visual chrome. Not to reproduce what the browser already provides for free.

### 2. Accessible by default

Every component implements the corresponding [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) pattern where one exists. This means:

- Correct `role`, `aria-*` states, and DOM structure out of the box.
- Full keyboard navigation — no interaction that requires a pointer.
- Focus management: trap focus in modals, restore focus on close, never lose focus to `<body>` unexpectedly.
- Screen reader testing is part of acceptance, not an afterthought.

### 3. Headless — fits anywhere

Components ship with **no imposed visual styling** beyond what is structurally necessary for correct layout or behavior. Colors, fonts, borders, and spacing are left entirely to the consumer.

Where defaults are unavoidable, they defer to browser UA styles and CSS system color keywords — `Canvas`, `CanvasText`, `ButtonFace`, `ButtonText`, `ButtonBorder`, `Field`, `FieldText`, `Highlight`, `HighlightText`, `AccentColor`, `AccentColorText`, and `GrayText`. These keywords track the operating system color scheme automatically, so components support light and dark mode through `color-scheme` with no per-component code. They also behave correctly under `forced-colors: active` (Windows High Contrast) because interactive state is always communicated via ARIA attributes, focus, and outlines — never by color alone.

Runtime geometry is the narrow exception: values derived from measurement or user interaction (splitter pane sizes, virtual-canvas scroll extents) may be written as inline styles. Decorative styles still belong in static CSS or CSS custom properties.

The goal is not only to slot into a design system without fighting. It is to drop a component into a **plain, unstyled HTML page** alongside native `<input>`, `<select>`, and `<button>` elements and have it look and feel like it belongs there.

### 4. Responsive and touch-friendly

- Pointer events (`pointerdown`, `pointermove`, `pointerup`) rather than mouse-only events — touch and stylus work out of the box.
- No hardcoded pixel breakpoints inside component logic.
- Minimum dimensions are set conservatively so components don't collapse on narrow viewports.
- Keyboard step sizes (arrow keys) are configurable; Shift multiplies by 10× for coarse control.

### 5. Performance

Every package sets `sideEffects: false` so bundlers tree-shake unused components at zero cost. Each package is independently importable — the aggregate `rc-webcomponents` package is a convenience, not a mandate.

Beyond bundle size:

- No heavy synchronous work in component lifecycle methods. Anything expensive — large dataset processing, complex layout calculation — is deferred, async, or delegated to a web worker. The main thread handles only rendering and interaction.
- High-frequency event listeners (`pointermove`, `scroll`, `wheel`) are marked passive when `preventDefault()` is not needed, keeping scroll jank-free.
- Lit's reactive update system batches property changes into a single render pass. Components do not trigger unnecessary extra cycles inside `updated()` or event handlers.

### 6. Interoperable and well-typed

Custom elements are framework-agnostic by definition. Components follow the standard web component data and event contract so they work correctly with React, Vue, Solid, Angular, or no framework at all.

- **Properties for rich data, attributes for initial configuration.** Boolean, array, and object values are set programmatically via properties. Attributes are reflected only where CSS selectors need them — not as a serialization mechanism.
- **`CustomEvent` for output.** Events are `bubbles: true, composed: true` so they cross shadow DOM boundaries in consuming documents. Names follow the `<element-name>-<verb>` convention (`rc-slider-input`, `rc-dialog-close`) to avoid collisions in mixed-component trees.
- **TypeScript-first public API.** Every property, method, and event detail type is declared. Tag names are registered in `HTMLElementTagNameMap` so `querySelector('rc-slider')` and framework template types resolve to the correct class without a cast. JSDoc covers all public properties and events.
- **No framework coupling.** Components contain no React, Vue, or Solid imports. Adapters and reactive-framework wrappers are a consuming-application concern.

---

## Packages

| Package | Description | Depends on |
| --- | --- | --- |
| [`rc-common`](packages/rc-common/) | Shared controllers and directives: `DragController`, `ResizeController`, `AnchorController`, `ScrollObserverController`, `KeyboardNavigationDirective`, `MouseMoveDirective` | — |
| [`rc-listbox`](packages/rc-listbox/) | Light-DOM ARIA `listbox` used by select and combobox | rc-common |
| [`rc-menu`](packages/rc-menu/) | ARIA `menu` / `menuitem` popup | rc-common |
| [`rc-select`](packages/rc-select/) | Select-only ARIA combobox backed by a native `<select>` | rc-common, rc-listbox |
| [`rc-combobox`](packages/rc-combobox/) | Editable ARIA combobox with filtering and allow-create | rc-common, rc-listbox, rc-select |
| [`rc-search-bar`](packages/rc-search-bar/) | Enhances a native `<input type="search">` with icon chrome, clear button, and debounced search events | — |
| [`rc-menu-button`](packages/rc-menu-button/) | Button that opens an ARIA menu | rc-common, rc-menu |
| [`rc-menubar`](packages/rc-menubar/) | ARIA `menubar` with roving tabindex | rc-common, rc-menu-button |
| [`rc-toolbar`](packages/rc-toolbar/) | ARIA `toolbar` with roving tabindex | rc-common |
| [`rc-app-bar`](packages/rc-app-bar/) | Material-style top app bar with scroll-driven elevation and collapsible title | rc-common |
| [`rc-splitter`](packages/rc-splitter/) | Resizable pane splitter (`separator` role) | rc-common |
| [`rc-textarea`](packages/rc-textarea/) | Enhanced `<textarea>` — line decorations, gutter, plugin API | — |
| [`rc-disclosure`](packages/rc-disclosure/) | Native `<details>` / `<summary>` disclosure wrapper | — |
| [`rc-accordion`](packages/rc-accordion/) | Accordion coordinator for disclosure groups | rc-disclosure |
| [`rc-dialog`](packages/rc-dialog/) | Draggable, resizable `<dialog>` wrapper with accessible event forwarding | rc-common |
| [`rc-virtual-canvas`](packages/rc-virtual-canvas/) | Virtualized canvas for large datasets | — |
| [`rc-webcomponents`](packages/rc-webcomponents/) | Aggregate package exporting the component collection | all component packages |

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

```powershell
# Dev server for a single package (hot reload)
yarn.cmd workspace @rcarls/<package> run dev

# TypeScript check + Vite build for a single package
yarn.cmd workspace @rcarls/<package> run build

# Build all packages using the workspace dependency graph
yarn.cmd build

# Browser tests for a single package
yarn.cmd workspace @rcarls/<package> run test:browser

# Browser tests for all packages
yarn.cmd test
```

> **Dependency graph:** the root `build` script runs `yarn workspaces foreach --topological`, so Yarn enforces package order from the workspace dependency declarations. For targeted package work, rebuild affected dependencies first: `rc-common` → `rc-listbox` / `rc-menu` → `rc-select` / `rc-menu-button` → `rc-combobox` / `rc-menubar` / `rc-toolbar` / `rc-splitter` / `rc-dialog` → `rc-webcomponents`. Rebuild a dep before running tests in packages that consume it; Vite's HMR does not watch `node_modules` for dist changes.

---

## Attribution

The `rc-markdown-editor` toolbar uses icons from [Bootstrap Icons](https://icons.getbootstrap.com/) by the Bootstrap Authors, licensed under the [MIT License](https://github.com/twbs/icons/blob/main/LICENSE).
