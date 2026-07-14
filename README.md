# rc-webcomponents

A collection of themeable web components that enhance native HTML controls and implement
[WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) patterns where they
apply.

Components are fully typed and developed primarily with [Lit](https://lit.dev).

**[Documentation and component demos](https://richardcarls.github.io/rc-webcomponents/)**

## Design principles

These principles guide every component in the collection. Web applications need fundamental
elements that complement the native HTML set. The Custom Elements specification and other
modern web APIs clarify how to architect those elements, while exposing the complexity of
building components that work across platforms, remain usable by everyone, and work well with
existing elements.

### Progressive enhancement

Components build on native HTML elements and browser-provided behavior. For example, a
`<dialog>` remains a `<dialog>`; an `<rc-dialog>` adds common affordances such as dragging and
resizing, plus developer conveniences such as event forwarding. When JavaScript is absent,
blocked, or slow, the underlying markup remains semantically meaningful and operable.

Feature detection gates enhanced behavior so components degrade gracefully without throwing
errors or becoming unusable.

Form controls associate with forms and labels through their wrapped native elements to preserve
operability and accessibility.

### Accessible by default

Every component implements the corresponding
[WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) pattern where one exists.

- Components manage ARIA state (`role`, `aria-*`) and extra semantic parts
- Keyboard navigation is fully managed
- Focus management behaves as defined / expected
- A11y testing is part of acceptance, not an afterthought

### Design-system neutral

Components do not impose a particular visual system. They ship the structural styling needed
for correct layout and behavior, plus sensible user-agent-like defaults that fit alongside native
HTML elements.

- Components use
  [CSS system colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/system-color)
  where supported, adapting automatically to user color preferences and accessibility settings
- Components encapsulate any default styling
- Components expose public CSS custom properties and CSS parts for granular control of their
  appearance
- Components support broad theme tokens for quick adoption into existing design systems

### Responsive and touch-friendly

- Components use pointer events rather than mouse-only events for touch and stylus support
- Components are fluid, with conservative minimum constraints and sensible sizing analogous to
  native elements
- Larger components have declarative compact variants for smaller screens

### Performance

Efficiency matters on the client, where hardware constraints and power use directly affect
people.

- Components have minimal bundled size and are available as individual packages to support tree-shaking
- Components avoid heavy synchronous work and event churn on the main thread, using asynchronous
  and off-thread work where it keeps the experience smooth
- Lit's lightweight reactive update system avoids unnecessary update cycles

### Interoperable and well-typed

Custom elements are framework-agnostic by definition. Components follow [web component best-practices](https://web.dev/articles/custom-elements-best-practices)
so they behave well with React, Vue, Solid, Angular, or no framework at all.

---

## Packages

| Package | Description | Depends on |
| --- | --- | --- |
| [`rc-common`](packages/rc-common/) | Shared controllers, directives, mixins, and utilities: drag, resize, anchor positioning, scroll observation, keyboard interaction/navigation, active descendant, roving tabindex, focusability, and slider math | None |
| [`rc-listbox`](packages/rc-listbox/) | Listbox that keeps option DOM in light DOM for `aria-activedescendant` navigation | rc-common |
| [`rc-menu`](packages/rc-menu/) | Menu popup for command surfaces with keyboard navigation and typed activation events | rc-common |
| [`rc-select`](packages/rc-select/) | Select-only combobox backed by a native `<select>` | rc-common, rc-listbox |
| [`rc-combobox`](packages/rc-combobox/) | Editable combobox with filtering and optional allow-create behavior | rc-common, rc-listbox, rc-select |
| [`rc-menu-button`](packages/rc-menu-button/) | Trigger button that opens an `rc-menu` popup | rc-common, rc-menu |
| [`rc-menubar`](packages/rc-menubar/) | Menubar coordinator for `rc-menu-button` children with roving tabindex and submenu handoff | rc-common, rc-menu-button |
| [`rc-toolbar`](packages/rc-toolbar/) | Toolbar that groups consumer-supplied controls into one tab stop with arrow-key navigation | rc-common |
| [`rc-app-bar`](packages/rc-app-bar/) | App bar modeled after Material 3 Top app bar, with slots and optional scroll behavior | rc-common |
| [`rc-splitter`](packages/rc-splitter/) | Resizable pane splitter with pointer, keyboard, and collapse/restore controls | rc-common |
| [`rc-textarea`](packages/rc-textarea/) | Textarea wrapper with line decorations, gutter rendering, inline widgets, and plugin hooks | rc-common |
| [`rc-textarea-adapters`](packages/rc-textarea-adapters/) | Adapter factories that connect Lezer, unified, and Shiki tokenizers to `rc-textarea` | rc-textarea |
| [`rc-textarea-plugin-markdown`](packages/rc-textarea-plugin-markdown/) | Markdown decoration plugin for `rc-textarea` | rc-textarea |
| [`rc-markdown-editor`](packages/rc-markdown-editor/) | Rich/source Markdown editor with a formatting toolbar, backed by `rc-textarea` | rc-textarea |
| [`rc-disclosure`](packages/rc-disclosure/) | Disclosure wrapper for a native `<details>`/`<summary>` pair with controlled open state | None |
| [`rc-accordion`](packages/rc-accordion/) | Accordion coordinator for child native `<details>` panels with single- or multiple-open behavior | rc-disclosure |
| [`rc-dialog`](packages/rc-dialog/) | Draggable, resizable wrapper for a native `<dialog>` | rc-common |
| [`rc-bottom-sheet`](packages/rc-bottom-sheet/) | Modal bottom-sheet wrapper for a native `<dialog>` | rc-dialog |
| [`rc-fab`](packages/rc-fab/) | Sticky floating action button modeled after Material 3 Floating action button | rc-common |
| [`rc-slider`](packages/rc-slider/) | Single-thumb slider backed by a native `<input type="range">` | rc-common |
| [`rc-range-slider`](packages/rc-range-slider/) | Two-thumb range slider backed by native range inputs for min/max values | rc-common |
| [`rc-transfer-list`](packages/rc-transfer-list/) | Transfer list that enhances a native `<select multiple>` into available and selected panes | rc-common, rc-listbox, rc-toolbar |
| [`rc-virtual-canvas`](packages/rc-virtual-canvas/) | Scrollable virtual canvas for rendering large coordinate-space content | None |
| [`rc-theme-material`](packages/rc-theme-material/) | Material 3 CSS theme and token bridge for rc-webcomponents | None |
| [`rc-theme-substrate`](packages/rc-theme-substrate/) | Lightweight CSS reference theme for app-oriented rc-webcomponents layouts | None |
| [`rc-webcomponents`](packages/rc-webcomponents/) | Aggregate package that re-exports and defines the rc-webcomponents collection | all component packages |
| [`rc-search-bar`](packages/rc-search-bar/) | Search field/view wrapper for a native `<input type="search">` with clear, suggestions, and debounced events | rc-common |

## Development

This project uses Yarn 4.x (Berry) workspaces and plug-and-play (PnP).

Vite builds ESM and UMD output plus type declarations. Tests run with Vitest and WebdriverIO.
The documentation site uses Docusaurus.

> **Note:** Use the root `build` script to build all workspace packages in topological order.
> Rebuild package dependencies before running tests.

### AI Agents

Agent guidance is in `AGENTS.md`. Other agent configuration files are shallow adapters that
point to this canonical source of project context.

## Attributions

The `rc-markdown-editor` toolbar uses
[Bootstrap Icons](https://icons.getbootstrap.com/) by the Bootstrap Authors under the
[MIT License](https://github.com/twbs/icons/blob/main/LICENSE).

## License

MIT
