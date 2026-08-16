# AGENTS.md

This is the concise project context for AI coding agents working in this repository.
Read `README.md` first for the public overview, design principles, package catalog,
and contributor-facing development summary. This file supplements it with the
critical implementation rules and workflow gotchas that agents most often need
while changing code.

`rc-webcomponents` is a WAI-ARIA-oriented web component library built with Lit
3.x and TypeScript in a Yarn 4.x Berry monorepo. Packages live in `packages/`;
the Docusaurus docs workspace lives in `docs/`.

## Agent Context

Keep shared AI-agent instructions in `AGENTS.md`. Tool-specific files are shallow
adapters and must point back here rather than duplicating package lists, commands,
architecture rules, or testing notes.

| File or directory | Purpose |
| --- | --- |
| `README.md` | Human-facing overview, design principles, package table, and public usage guidance. |
| `AGENTS.md` | Agent-facing implementation invariants, workflow rules, and repo gotchas. |
| `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/*.mdc` | Tool adapters only. |
| `.agents/` | Project-local reusable agent assets; load only on demand. |

When adding support for another AI coding tool, make its native context file point
back to `AGENTS.md` where possible. If imports are not supported, keep the adapter
short and tell the tool to read `AGENTS.md` before project work.

## Architecture Invariants

- Build on native HTML and browser behavior. Components wrap or enhance native
  elements; they do not replace browser semantics with custom-only behavior.
- Feature-detect newer browser APIs and degrade gracefully. Missing enhancement
  support must not leave a component broken or throwing during normal use.
- Components that wrap form controls require the consumer-provided native element
  as a direct child. Keep that element connected permanently so form submission,
  label association, author attributes, and pre-upgrade usability remain intact.
- Use light DOM when slotted consumer markup must remain directly available to
  forms, labels, or assistive technology. Use shadow DOM only when it does not
  break those associations.
- Implement the WAI-ARIA Authoring Practices Guide pattern where one exists:
  correct roles and states, full keyboard support, expected focus management, and
  screen-reader behavior.
- Components are design-system neutral. Ship only structural styling needed for
  correct layout or behavior; avoid decorative visual opinions. Prefer UA-like
  defaults, CSS system colors, and forced-colors-safe state indicators.
- Runtime measurement may write inline geometry styles, such as splitter sizes.
  Decorative styles belong in static CSS, CSS custom properties, or CSS parts.
- Use Pointer Events for pointer interaction. Avoid mouse-only logic and
  hardcoded responsive breakpoints inside component behavior.
- Shared interaction behavior belongs in `rc-common` as Lit directives or
  `ReactiveController` classes.
- Before adding new interaction, focus, positioning, scrolling, pointer, resize,
  keyboard, slider math, or DOM utility logic, inspect
  `packages/rc-common/src/index.ts` and existing consumers. Prefer reusing an
  existing controller, directive, or utility; if two or more components need the
  same behavior, treat extraction to `rc-common` as part of the change instead of
  leaving a package-local copy.
- Each package builds ESM, UMD, and declarations. Keep package exports and
  `sideEffects: false` tree-shaking behavior intact.
- In `firstUpdated()`, guard required native child checks behind
  `import.meta.env.DEV` and emit a `console.warn` when the expected child is
  absent. Use `:scope > <tagname>` to scope the query to direct children only.
  This warns authors at development time without shipping any check in production.

  ```ts
  protected override firstUpdated(): void {
    if (import.meta.env.DEV && !this.querySelector(':scope > button')) {
      console.warn(
        '[rc-fab] No direct child <button> found. Place a native <button> inside <rc-fab>.',
        this,
      );
    }
  }
  ```

## Stateful APIs

Any value-like state (`value`, `open`, `selected`, etc.) must support controlled
and uncontrolled modes.

- Controlled mode: host writes the property and owns the value. Programmatic
  writes are silent and must not dispatch user events.
- Uncontrolled mode: host may provide `defaultValue`, `defaultOpen`,
  `defaultSelected`, etc.; after initialization the component owns state.
- Use private backing fields such as `_value`, `_defaultValue`, and
  `_valueInitialized`. Back a boolean controlled property with `boolean | undefined`
  (or an equivalent explicit `_xInitialized` flag), never a bare non-nullable
  `boolean`. A non-nullable backing field can't distinguish "host explicitly wrote
  the current value" from "never written," so a later `defaultX` write can silently
  fail to release control back to the uncontrolled default. A confirmed instance of
  this bug shipped in `rc-menu-button`'s `defaultOpen`/`open` pair.
- The main property setter sets the backing value, marks initialized, applies
  state silently, and calls `requestUpdate`. Dispatch the corresponding user
  event only from genuinely user-driven call sites (a click handler, a keydown
  handler), never from inside the property setter itself (a setter-level dispatch
  fires even on programmatic writes, which breaks the controlled contract above).
  Confirmed instance: `rc-markdown-editor`'s `sourceMode` setter dispatched
  `rc-mode-change` unconditionally until fixed.

  ```ts
  // Wrong: fires on every write, including host-driven ones.
  set sourceMode(value: boolean) {
    this._sourceMode = value;
    this.dispatchEvent(new CustomEvent('rc-mode-change', { detail: { value } }));
  }

  // Right: the setter stays silent; only the user-driven call site dispatches.
  private _onToolbarAction(action: string): void {
    if (action === 'toggle-source') {
      this.sourceMode = !this.sourceMode;
      this.dispatchEvent(new CustomEvent('rc-mode-change', { detail: { value: this.sourceMode } }));
    }
  }
  ```

- The default property setter applies only before initialization and only when
  the controlled value is `undefined`.
- Initialization flags do not reset on reconnect.
- Getters return a typed fallback: `_value ?? _defaultValue ?? <sensible fallback>`.
- For every property with a multi-word name, not only `default*`-prefixed ones,
  give its `@property` decorator an explicit `attribute: 'kebab-case-name'`.
  Lit's derived default is the lower-cased property name with no hyphens inserted
  (`defaultValue` becomes `defaultvalue`, not `default-value`), so relying on the
  default silently breaks the declarative HTML attribute while the JS property
  keeps working (the bug is easy to miss because nothing errors). This has shipped
  confirmed twice: `rc-textarea`'s `defaultValue` had the wrong (default) mapping;
  `rc-virtual-canvas`'s `contentWidth`/`contentHeight` had no `attribute:` option
  at all. Also check for the same-shaped bug one level up: a value-like property
  with no `@property` decorator at all is invisible to both the attribute system
  and CEM (`rc-markdown-editor`'s `value` had this exact gap); every serializable
  value-like property needs `@property`, not just a correctly mapped one.
- Some components expose a value-like accessor that reads live, derived DOM state
  (for example, `rc-listbox`'s `value` deriving from selected `<option>` elements,
  or `rc-transfer-list`'s `available`/`selected` reading the live `<select>`) rather
  than a cached private field. These legitimately omit `@property` (there is no
  reactive value to cache), but must still document "host writes are silent" in
  the accessor's doc comment, and are not exempt from the controlled/uncontrolled
  behavioral contract, only from the private-backing-field mechanics above.

## Public API Changes

Public API includes properties, attributes, methods, events, slots, CSS custom
properties, CSS parts, native child requirements, exported types, and documented
behavior. When changing it, update every affected surface in the same change:

- Component source and TypeDoc/JSDoc, including CEM tags such as `@slot`,
  `@fires`, `@attr`, `@csspart`, and `@cssprop`. `@attr` is easy to skip because
  nothing fails to compile or test when it's missing: a `@property` decorator
  works fully without a matching `@attr` tag, so the class header can silently
  drift out of sync with the real attribute surface. Give every non-`attribute:
  false` `@property` a matching `@attr` line; use bracket form (`@attr [name]`)
  only for a computed, reflected-only attribute with no settable `@property`
  behind it (such as `rc-select`'s `[has-value]`), and plain form (`@attr name`)
  for anything a consumer can write. The same bracket convention applies to
  `@cssprop`: `[--name=default]` when the custom property has a concrete literal
  fallback, `[--name]` with no `=` when the CSS fallback is `revert`, `inherit`,
  or absent (describe what it defers to in the text). These bracket rules are a
  human-readability convention only; `cem:analyze` parses either form into the
  same manifest entry.
- When adding a `@cssprop` tag, copy the literal default straight from the
  component's own current `.styles.ts` (or an imperatively injected `<style>`
  string, if the component uses one) at the moment you write the tag, not from
  a theme package's override or an earlier revision. Wrong defaults are a
  distinct, equally common failure mode from missing tags entirely: two sibling
  packages (`rc-navigation-bar`, `rc-navigation-rail`) had `@cssprop` defaults
  copy-pasted from the Material/Substrate theme recipes instead of the base
  component's own fallback, and a broad `revert`-fallback refactor
  (`c73946a`, "preserve UA-like component defaults") touched roughly a dozen
  packages' CSS without any of their `@cssprop` JSDoc being updated to match.
- `custom-elements-manifest`'s analyzer only detects `@cssprop`/`@csspart` from
  a component's own `static styles` (the Lit `css` tagged template) and its own
  render template. It does not scan plain `<style>` text injected imperatively
  (the `LIGHT_DOM_CSS` pattern used for light-DOM base styles) and does not
  attribute a part set by a shared `rc-common` controller back to the consuming
  component. Both need their custom properties and parts documented by hand;
  there is no analyzer safety net for either case.
- Event detail interfaces, exported TypeScript types, and `HTMLElementTagNameMap`
  / `HTMLElementEventMap` declarations.
- Tests for progressive enhancement, labels/forms, ARIA state, keyboard support,
  controlled/uncontrolled behavior, event dispatch, and live accessibility states.
- Custom Elements Manifest data before docs dev/build:
  Windows `yarn.cmd cem:analyze`; Linux/macOS `yarn cem:analyze`.
- Docusaurus docs in `docs/docs/components/<component>.mdx`, including demos,
  snippets, accessibility notes, events, and at-a-glance summaries.
- Package README, root README package summary, aggregate package exports, and
  aggregate React/Solid typings when public usage changes.

Generated API tables come from `dist/custom-elements.json`; do not hand-edit
generated output instead of source comments and types.

Use this public API sync walk before finishing any API-facing change:

```text
source/JSDoc -> event/detail/exported types -> tests -> CEM -> package README
-> docs page/demos -> root README/package catalog -> aggregate React/Solid typings
```

When adding a new component package, add it to the `## Packages` table in
`README.md`, create or update `docs/docs/components/<component>.mdx`, and add it
to `docs/sidebars.ts` in the same change. Infrastructure, adapter, plugin, and
aggregate packages do not need docs sidebar entries unless they are documented as
directly usable public packages.

## Documentation And Demos

- `README.md` is the public root overview and package catalog. Keep architecture
  detail and agent workflow here only when it helps future code changes.
- Keep package descriptions aligned across `package.json`, package README first
  paragraph, exported class JSDoc, docs page intro, the root README package
  table, and the docs homepage package table. Descriptions should be concise and
  matter-of-fact, mention the native element a component wraps/enhances, and use
  WAI-ARIA APG links only when a real APG pattern applies. Component class
  JSDoc should include a docs-site `@see {@link ...}` entry and an APG or
  Material component `@see` entry where applicable.
- Do not add `yalc` scripts to package manifests. Keep homepage URLs pointed at
  the most specific docs page for the public package.
- The Docusaurus docs workspace is the canonical home for public component docs,
  examples, and live demos.
- Package READMEs are npm landing pages and should stay short unless a package
  has usage details that do not fit naturally in the docs site. Do not maintain a
  competing exhaustive API table in a package README when the generated docs API
  table can be the canonical source. A package README that already carries a
  hand-written attribute/cssprop/part table (most do, from before this rule) is
  not exempt from staying accurate: update it in the same change as any source
  JSDoc it duplicates, since nothing else keeps it honest. Several READMEs were
  found with stale getter names, wrong CSS defaults, and missing rows that had
  drifted silently because only the docs site's generated table was ever updated.
- Document `ElementInternals` custom states (`attachInternals()` /
  `:state(...)`) as prose in the class JSDoc, describing the state name and when
  it applies, the same way `rc-app-bar` documents `scrolled`/`collapsed`/`hidden`.
  There is no dedicated CEM tag for custom states, so they will not appear in the
  generated API table; the class-level prose is the only durable source.
- Do not add tracked package-local demo pages or shared demo assets. Files such
  as `packages/<name>/*.html` and `packages/<name>/public/` are ignored scratch
  space for ad hoc Vite experiments only.
- Component examples must preserve project principles: native children remain in
  the DOM, labels/forms work before upgrade, ARIA is demonstrated on the native
  element where applicable, and interactive demos show keyboard and accessibility
  behavior.
- `docs/src/components/DemoFrame.tsx` renders demo children into an open shadow
  root via `createPortal()`. Effects in the parent demo component can run before
  that portaled custom element ref exists. When a demo needs to set properties,
  attach listeners, or call methods on a web component inside `DemoFrame`, prefer
  a callback ref or state-backed element reference that reacts when the portaled
  element mounts. When browser-smoke-testing demos, query through the DemoFrame
  `surfaceHost` shadow root instead of using document-only selectors.

## Commands

On Windows, always use `yarn.cmd` and `npx.cmd`; the Unix shims in `%APPDATA%\npm`
are broken. On Linux/macOS, use `yarn` and `npx`.

```powershell
yarn.cmd docs
yarn.cmd workspace @rcarls/<package> run build
yarn.cmd workspace @rcarls/<package> run test:browser
yarn.cmd build
yarn.cmd test
yarn.cmd validate:packages
```

```bash
yarn docs
yarn workspace @rcarls/<package> run build
yarn workspace @rcarls/<package> run test:browser
yarn build
yarn test
yarn validate:packages
```

New package `test:browser` scripts must include `--run` (`vitest --run`). Without it
Vitest defaults to watch mode on Linux and the root `test` script hangs waiting for
each workspace to exit.

The root `build` script runs workspaces topologically. For targeted package work,
rebuild changed dependencies before running tests in packages that consume them.
Vite HMR does not watch dependency `dist/` output through `node_modules`; restart
the docs dev server after rebuilding a dependency.

## Testing

Tests run live DOM in real browsers via Playwright and Vitest browser mode;
there is no jsdom. Locally: Chromium and Firefox. In CI (`CI=true`): Chromium,
Firefox, and WebKit. Browser config is shared via `vitest.browser.config.ts` at
the repo root — add browsers or tweak options there instead of in per-package
configs.

```ts
import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
```

- Always `await host.updateComplete` before asserting DOM state. If
  `firstUpdated()` schedules another render, use `vi.waitFor`.
- Fire events on native child elements, not the component host, when testing
  delegated behavior.
- Assert ARIA attributes on the native element unless the host intentionally owns
  that state.
- Test that consumer-provided native elements remain connected with author
  attributes such as `id`, `name`, and `value` intact.
- Test label association, at minimum the native `for`/`id` path with
  `label.control`.
- Every component needs an `expectNoA11yViolations` test. For stateful widgets,
  audit the live open or active state, not only the resting state.
- Playwright locator `.click()` does not reliably reach native click listeners
  registered directly on the same element by a Lit directive. For directive-level
  click handlers, dispatch a bubbling `MouseEvent` on the element.
- Use `(await el.element()).focus()` for programmatic focus. Avoid `.click()`
  when the test only needs focus movement.

## Versioning And Commits

- Commit messages must follow Conventional Commits. Use `!` before the colon for
  breaking changes, such as `feat(rc-slider)!: rename value attribute`.
- Describe the repository outcome and its rationale, not the agent process or a
  personal naming, visibility, or formatting convention. When a source-only
  cleanup needs its own commit, prefer `style(<scope>): apply source formatting`
  with a general no-behavior-change body; keep the individual style rules out of
  the message.
- Organize feature work per component or coherent concern. Do not invent
  component families to batch unrelated work. For a single-developer workflow,
  finish and merge one feature branch before starting the next unless the work
  genuinely overlapped or Rick explicitly approved parallel branches.
- Merge feature branches with `--no-ff` and use
  `chore(<domain>): merge branch feature/<branch>` for the merge commit. Keep
  small isolated fixes and documentation changes directly on `develop` when a
  feature branch would add no useful narrative.
- Meaningful package changes need a Changesets intent file. Use `yarn.cmd
  changeset` on Windows or `yarn changeset` on Linux/macOS.
- Before pushing, rename generated Changeset files from random-word sequences to
  short, descriptive kebab-case slugs that identify the package, behavior, or
  concern.
- Published packages are version-locked together through the Changesets fixed
  group. A single release bump moves the package set together.
- Use `yarn.cmd validate:packages` for package metadata, aggregate coverage, and
  dry-run pack export validation.
- Use `yarn.cmd validate:release` only on a release merge commit to verify the
  exact tag, fixed-group versions, and absence of pending changesets.
