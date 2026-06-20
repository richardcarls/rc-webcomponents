# rc-webcomponents

A collection of web components that are inspired by and implement [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) patterns, with progressive enhancement design philosophy.

Components are fully typed and developed primarily with [Lit 3.x](https://lit.dev).

**[Documentation and component demos](https://richardcarls.github.io/rc-webcomponents/)**

## Design principles

These are the guiding principles for every component in the collection. I feel that there is a real gap in fundamental elements that really compliment the native set
of elements supported in HTML5. The Custom Element spec and other modern web APIs rationalized how similar elements could be architected, but also exposed the
complexity of elements that need to support any platform, are usable by everyone, and are interoperabile with existing elements.

### Progressive enhancement

Components build on top of native HTML elements and browser-provided behavior. E.g., a `<dialog>` is still a `<dialog>`; an `<rc-dialog>` adds common user affordances
like drag and resize, and adds developer experience (DX) enhancements like event forwarding. When JavaScript is absent, blocked, or slow, the underlying markup
remains semantically meaningful and operable.
Feature detection gates enhanced behaviors and gracefully degrades without throwing errors or being left in an unusable state.

Form controls are associated to forms and labels via thier wrapped native elements to ensure operability and accessibility.

### Accessible by default

Every component implements the corresponding [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) pattern where one exists.

- Components manage ARIA state (`role`, `aria-*`) and extra semantic parts
- Keyboard navigation is fully managed
- Focus management behaves as defined / expected
- A11y testing is part of acceptance, not an afterthought

### Headless

Components are effectively "headless" in that they do not forward any particular design paradigm. They of course have structurally necessary styling for correct
layout and behavior, as well as sensible UA-like defaults to fit in visually alongside native HTML elements on a page.

- Components leverage [CSS System Colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/system-color) where supported for default colors
 This enables automatic color scheme adaptation for user color preferences and accessibility constraints
- Components encapsulate any default styling
- Components expose a public CSS Custom Properties and CSS Parts surface to enable granular control of thier appearance
- Components also participate in a set of broad theming design-token variables for quick adoption to existing design systems

### Responsive and touch-friendly

- Components use pointer events rather than mouse-only events for touch and stylus support
- Components are fluid with conservative minimum size constraints and sensible default sizing analogous to native element appearance
- Larger components have declarative compact variants for smaller screens

### Performance

Being efficient is better than not, especially on the client-side where hardware constraints and power usage matter to people.

- Components have minimal bundled size and are available as individual packages to support tree-shaking
- No heavy synchronous work or event churn on the main thread. Efficient use of asyc and off-thread delegation to keep the user experience smooth
- Lit's reactive update system does not trigger unnecessary extra cycles and is lightweight and performant itself

### Interoperable and well-typed

Custom elements are framework-agnostic by definition. Components follow [web component best-practices](https://web.dev/articles/custom-elements-best-practices)
so they behave well with React, Vue, Solid, Angular, or no framework at all.

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
| [`rc-app-bar`](packages/rc-app-bar/) | Headless grid app bar with exact-center composition and pinned, collapse, or hide scroll behavior | rc-common |
| [`rc-splitter`](packages/rc-splitter/) | Resizable pane splitter (`separator` role) | rc-common |
| [`rc-textarea`](packages/rc-textarea/) | Enhanced `<textarea>` — line decorations, gutter, plugin API | — |
| [`rc-textarea-adapters`](packages/rc-textarea-adapters/) | Adapter factories for Lezer, unified, and Shiki tokenizers | rc-textarea |
| [`rc-textarea-plugin-markdown`](packages/rc-textarea-plugin-markdown/) | Markdown decoration plugin for rc-textarea | rc-textarea |
| [`rc-markdown-editor`](packages/rc-markdown-editor/) | Rich/source Markdown editor with a formatting toolbar | rc-textarea |
| [`rc-disclosure`](packages/rc-disclosure/) | Native `<details>` / `<summary>` disclosure wrapper | — |
| [`rc-accordion`](packages/rc-accordion/) | Native `<details>` accordion coordinator with single or multiple open panels | rc-disclosure |
| [`rc-dialog`](packages/rc-dialog/) | Draggable, resizable `<dialog>` wrapper with accessible event forwarding | rc-common |
| [`rc-fab`](packages/rc-fab/) | Floating action button with regular and extended variants | — |
| [`rc-slider`](packages/rc-slider/) | Single-thumb slider backed by a native range input | rc-common |
| [`rc-range-slider`](packages/rc-range-slider/) | Two-thumb range slider backed by native range inputs | rc-common |
| [`rc-transfer-list`](packages/rc-transfer-list/) | Native-select-backed transfer list | rc-listbox, rc-toolbar |
| [`rc-virtual-canvas`](packages/rc-virtual-canvas/) | Virtualized canvas for large datasets | — |
| [`rc-theme-material`](packages/rc-theme-material/) | Optional CSS-only Material 3 token bridge | — |
| [`rc-webcomponents`](packages/rc-webcomponents/) | Aggregate package exporting the component collection | all component packages |

## Development

This project uses Yarn 4.x (Berry) workspaces and plug-and-play (PnP).

Vite build outputs ESM + UMD as well as type declarations. Tests run with Vitest + WebdriverIO. Docs site is Docusaurus.

> **Note:** use the root package `build` script to build all workspace packages in topological order. Rebuild package deps before running tests.

### AI Agents

Agent guidance is included in `AGENTS.md`. Other agent config files are shallow adapters that point to this canonical source of project context.

## Attributions

The `rc-markdown-editor` toolbar uses icons from [Bootstrap Icons](https://icons.getbootstrap.com/) by the Bootstrap Authors, licensed under the [MIT License](https://github.com/twbs/icons/blob/main/LICENSE).

## License

MIT
