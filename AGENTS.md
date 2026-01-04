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

Five constraints guide every component. Not all packages fully satisfy all five
today; treat them as the acceptance bar for new work and the lens for reviewing
existing work.

### Progressive enhancement

Build on native HTML and browser behavior. A component wraps or enhances a native
element; it does not replace it. Feature-detect newer browser APIs before using
them, and do not throw when a feature is absent.

Components that wrap form controls require the consumer to supply the native
element as a direct child. Keep that element in the DOM permanently so that:

- **Form association** — `name`/`value` submit correctly without `ElementInternals`.
- **Label association** — `<label for="id">`, wrapping `<label>`, and `aria-label`
  directly on the native input all work without a shadow DOM boundary to cross.
- **Pre-upgrade usability** — the native control is interactive before the custom
  element registers, and remains so if registration never occurs.

Do not break these associations during upgrade. Do not remove or replace the
consumer-provided element.

### Accessible by default

Implement the WAI-ARIA Authoring Practices Guide pattern where one exists:

- Correct `role`, `aria-*` states, and DOM structure.
- Full keyboard navigation; no interaction should require a pointer.
- Proper focus management, including trapping focus in modals, restoring focus on
  close, and avoiding accidental focus loss to `<body>`.
- Screen reader behavior is part of acceptance.

### Headless

Ship no visual design opinions beyond what is structurally necessary for correct
layout or behavior. Colors, fonts, borders, and spacing belong to the consumer.

Where defaults are needed, prefer browser UA styles and CSS system colors:
`Canvas`, `CanvasText`, `ButtonFace`, `ButtonText`, `ButtonBorder`, `Field`,
`FieldText`, `Highlight`, `HighlightText`, `AccentColor`, `AccentColorText`,
and `GrayText`. Using system colors means components support light and dark mode
automatically via `color-scheme` with no per-component code. Components must also
behave correctly under `forced-colors: active`; interactive state must be
communicated through ARIA attributes, focus, and outlines rather than color alone.

Runtime geometry is the narrow exception: values derived from measurement or
user interaction, such as splitter pane sizes or virtual-canvas placeholder
dimensions, may be written as inline styles. Decorative styles belong in static
CSS or CSS custom properties.

The goal is not only to slot into a design system. A component should be droppable
into a plain, unstyled HTML page alongside native `<input>`, `<select>`, and
`<button>` elements and look and feel like it belongs there.

### Responsive and touch-friendly

- Use Pointer Events API, not mouse-only events.
- Avoid hardcoded breakpoints inside component logic.
- Set minimum dimensions conservatively.
- Make keyboard step sizes configurable; Shift multiplies movement by 10 for coarse control.

### Controlled and uncontrolled state

Any component that manages stateful user interaction through a value-like property — `value`, `open`,
`selected`, or similar — must support both modes:

**Controlled mode** — The host owns the value. The host sets the property on every update, and the
component never overrides it. Host writes must be silent: no events fire from programmatic property
assignment.

**Uncontrolled mode** — The component owns the value after an initial hint. The host sets `defaultValue`
(or `defaultOpen`, `defaultSelected`, etc.) once before interaction begins. After that the component
manages state independently.

Implementation rules:

- Add private fields: `_value: T | undefined`, `_defaultValue: T | undefined`, and
  `_<name>Initialized = false` (e.g. `_valueInitialized`, `_selectedInitialized`).
- The `value` setter: sets `_value`, sets `_<name>Initialized = true`, applies state silently (no event
  dispatch), calls `requestUpdate`.
- The `defaultValue` setter: sets `_defaultValue`; applies state only when
  `!_<name>Initialized && _value === undefined`; never dispatches events.
- `_<name>Initialized` does **not** reset on reconnect. A controlled element stays controlled after
  being moved in the DOM.
- The `value` getter returns `_value ?? _defaultValue ?? <sensible-fallback>` so callers always receive
  a typed, non-`undefined` value.
- For primitive properties, apply `@property({ type: Number, attribute: 'default-value' })` on the
  `defaultValue` getter/setter so HTML authors can use the attribute form. For non-serializable types
  (arrays, tuples), omit the attribute mapping.
- Follow the naming pair: `value`/`defaultValue`, `open`/`defaultOpen`, `selected`/`defaultSelected`.

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

## Testing

### Test stack

Tests run in a real Firefox browser via WebDriverIO using Vitest in browser
mode. Every test exercises live DOM; there is no jsdom.

```ts
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { userEvent } from 'vitest/browser';
```

Accessibility violations use the shared helper:

```ts
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
```

### Async assertions

Always `await host.updateComplete` before asserting DOM state. When
`firstUpdated()` mutates `@state()` properties it schedules a second render
cycle; if assertions still race, use `vi.waitFor`:

```ts
await vi.waitFor(() => expect(document.activeElement).toBe(opener));
```

### What to test in every component

**Progressive enhancement** — verify the consumer-provided native element stays
in the DOM with its original `name`, `id`, and any other author attributes intact
after upgrade:

```ts
const input = host.querySelector<HTMLInputElement>('input[type="range"]');
expect(input?.isConnected).toBe(true);
expect(input?.getAttribute('name')).toBe('price-min');
```

**Label association** — for wrapper components test the three native labeling
strategies, at minimum the `for`/`id` form:

```ts
const labelEl = wrapper.querySelector<HTMLLabelElement>('label[for="my-input"]');
expect(labelEl?.control).toBe(input); // native label registry resolves correctly
```

**ARIA attributes** — assert that `aria-*` attributes are written to the native
element after `updateComplete`, not to the host element unless intentional.

**Events** — fire events on native child elements, not on the component host, so
the delegation path is exercised:

```ts
input.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
```

**Accessibility audit** — every component must have an `expectNoA11yViolations`
test. For stateful components (dialog, disclosure, popover, combobox) axe must
audit the **live open/active state** — auditing the resting state passes
vacuously because the ARIA requirements only appear when the content is visible:

```ts
host.showModal();          // put the component in the state that has requirements
await host.updateComplete;
await expectNoA11yViolations(host);
host.close();              // clean up
```

### Locator `.click()` vs. `dispatchEvent`

The WebDriverIO locator's `.click()` method simulates a user gesture and works
correctly for most cases. However, it does **not** reliably reach native
`addEventListener('click', ...)` handlers registered directly on the same
element by a Lit directive. When testing directive-level click handlers, dispatch
the event explicitly:

```ts
const node = await el.element();
node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
```

Clicking an inner child and letting the event bubble to a directive-decorated
ancestor works fine with the locator's `.click()`.

### Programmatic focus

Use `(await el.element()).focus()` to move focus without triggering click
handlers. Avoid `el.click()` when the goal is only to focus, since it will also
fire the directive's click listener.

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
