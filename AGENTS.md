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
- Components are headless. Ship only structural styling needed for correct layout
  or behavior; avoid decorative visual opinions. Prefer UA-like defaults, CSS
  system colors, and forced-colors-safe state indicators.
- Runtime measurement may write inline geometry styles, such as splitter sizes.
  Decorative styles belong in static CSS, CSS custom properties, or CSS parts.
- Use Pointer Events for pointer interaction. Avoid mouse-only logic and
  hardcoded responsive breakpoints inside component behavior.
- Shared interaction behavior belongs in `rc-common` as Lit directives or
  `ReactiveController` classes.
- Each package builds ESM, UMD, and declarations. Keep package exports and
  `sideEffects: false` tree-shaking behavior intact.

## Stateful APIs

Any value-like state (`value`, `open`, `selected`, etc.) must support controlled
and uncontrolled modes.

- Controlled mode: host writes the property and owns the value. Programmatic
  writes are silent and must not dispatch user events.
- Uncontrolled mode: host may provide `defaultValue`, `defaultOpen`,
  `defaultSelected`, etc.; after initialization the component owns state.
- Use private backing fields such as `_value`, `_defaultValue`, and
  `_valueInitialized`.
- The main property setter sets the backing value, marks initialized, applies
  state silently, and calls `requestUpdate`.
- The default property setter applies only before initialization and only when
  the controlled value is `undefined`.
- Initialization flags do not reset on reconnect.
- Getters return a typed fallback: `_value ?? _defaultValue ?? <sensible fallback>`.
- For primitive default properties, expose the kebab-case attribute form, such as
  `default-value`. Omit attribute mapping for non-serializable values.

## Public API Changes

Public API includes properties, attributes, methods, events, slots, CSS custom
properties, CSS parts, native child requirements, exported types, and documented
behavior. When changing it, update every affected surface in the same change:

- Component source, JSDoc, event detail types, and exported TypeScript types.
- Tests for progressive enhancement, labels/forms, ARIA state, keyboard support,
  controlled/uncontrolled behavior, event dispatch, and live accessibility states.
- Docusaurus docs in `docs/docs/components/<component>.mdx`, including demos, snippets,
  accessibility notes, events, and at-a-glance summaries.
- Package README, root README package summary, and aggregate docs when public
  usage changes.
- Custom Elements Manifest data before docs dev/build:
  Windows `yarn.cmd cem:analyze`; Linux/macOS `yarn cem:analyze`.

Generated API tables come from `dist/custom-elements.json`; do not hand-edit
generated output instead of source comments and types.

When adding a new component package, add it to the `## Packages` table in
`README.md` and `docs/index.md` in the same change. Infrastructure, adapter,
plugin, and aggregate packages do not need home-page component entries.

## Documentation And Demos

- `README.md` is the public root overview and package catalog. Keep architecture
  detail and agent workflow here only when it helps future code changes.
- The Docusaurus docs workspace is the canonical home for public component docs,
  examples, and live demos.
- Package READMEs are npm landing pages and should stay short unless a package
  has usage details that do not fit naturally in the docs site.
- Do not add tracked package-local demo pages or shared demo assets. Files such
  as `packages/<name>/*.html` and `packages/<name>/public/` are ignored scratch
  space for ad hoc Vite experiments only.
- Component examples must preserve project principles: native children remain in
  the DOM, labels/forms work before upgrade, ARIA is demonstrated on the native
  element where applicable, and interactive demos show keyboard and accessibility
  behavior.

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

The root `build` script runs workspaces topologically. For targeted package work,
rebuild changed dependencies before running tests in packages that consume them.
Vite HMR does not watch dependency `dist/` output through `node_modules`; restart
the docs dev server after rebuilding a dependency.

## Testing

Tests run live DOM in a real Firefox browser via WebDriverIO and Vitest browser
mode; there is no jsdom.

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
- WebDriverIO locator `.click()` does not reliably reach native click listeners
  registered directly on the same element by a Lit directive. For directive-level
  click handlers, dispatch a bubbling `MouseEvent` on the element.
- Use `(await el.element()).focus()` for programmatic focus. Avoid `.click()`
  when the test only needs focus movement.

## Versioning And Commits

- Commit messages must follow Conventional Commits. Use `!` before the colon for
  breaking changes, such as `feat(rc-slider)!: rename value attribute`.
- Meaningful package changes need a Changesets intent file. Use `yarn.cmd
  changeset` on Windows or `yarn changeset` on Linux/macOS.
- Published packages are version-locked together through the Changesets fixed
  group. A single release bump moves the package set together.
- Use `yarn.cmd validate:packages` for package metadata, aggregate coverage, and
  dry-run pack export validation.
- Use `yarn.cmd validate:release` only on a release merge commit to verify the
  exact tag, fixed-group versions, and absence of pending changesets.
