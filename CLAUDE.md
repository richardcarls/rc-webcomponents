# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WAI-ARIA compliant web components library built with Lit 3.x. Monorepo using Yarn workspaces with packages in `packages/`.

## Environment (Windows)

**Always use `yarn.cmd` instead of `yarn`** (and `npx.cmd` instead of `npx`). The Unix shim `yarn` in `%APPDATA%\npm` is broken — it references a placeholder node binary. The `.cmd` variants invoke `node.exe` directly and work correctly.

## Build & Test Commands

Run from the repository root using `yarn.cmd workspace`:

```bash
yarn.cmd workspace @rcarls/rc-splitter run dev            # Dev server with hot reload
yarn.cmd workspace @rcarls/rc-splitter run build           # TypeScript check + Vite build
yarn.cmd workspace @rcarls/rc-splitter run test:browser    # Run browser tests
yarn.cmd workspaces run build                              # Build all packages
```

## Workspace Dependencies

Packages import each other via `@rcarls/rc-*`, which resolves to the `dist/` build output (see each package.json `exports` field). **After modifying a package's source, you must rebuild it before dependent packages' tests will reflect the changes.**

Dependency graph (→ means "depends on"):

- **rc-menu** → rc-common
- **rc-menu-button** → rc-common, rc-menu
- **rc-menubar** → rc-common, rc-menu-button
- **rc-toolbar** → rc-common
- **rc-splitter** → rc-common

Example: after editing `rc-menu-button/src/`, run:

```bash
yarn.cmd workspace @rcarls/rc-menu-button run build
```
before running `rc-menubar` tests.

## Architecture

### Package Structure
- **rc-common**: Shared Lit directives (`KeyboardNavigationDirective`, `MouseMoveDirective`)
- **rc-menu**: Menu popup with keyboard navigation
- **rc-menu-button**: Menu button that opens/closes a menu popup
- **rc-menubar**: Menubar containing menu buttons with cascade navigation
- **rc-splitter**: Window splitter component with keyboard/mouse resize
- **rc-toolbar**: Accessible toolbar with roving tabindex

### Component Pattern
Each component package follows this structure:
- `src/rc-[name].ts` - Main LitElement component with `@customElement` decorator
- `src/rc-[name].styles.ts` - Component styles using Lit `css` template
- `src/rc-[name].test.ts` - Browser tests using vitest-browser-lit
- `index.html` - Demo/playground page

### Shared Directives (rc-common)
- **KeyboardNavigationDirective**: Handles arrow keys, Home/End, Tab, Enter with roving tabindex. Supports horizontal/vertical orientation via ARIA roles.
- **MouseMoveDirective**: Handles mouse drag operations with callbacks for mousemove events during drag.

### Key Patterns
- **WAI-ARIA compliance**: All components implement APG patterns with proper roles, ARIA attributes, and keyboard navigation
- **Roving tabindex**: Only one focusable item has `tabindex="0"` at a time
- **CSS custom properties**: Theme customization via `--rc-[component]-[property]`
- **CSS parts**: External styling via `::part()` selectors

## Testing

Browser-based tests using Vitest + WebDriverIO (Firefox). Test pattern:
```typescript
import { render, html } from 'vitest-browser-lit';
import { userEvent } from '@vitest/browser/context';

it('should navigate with arrow keys', async () => {
  const element = await render(html`<rc-toolbar>...</rc-toolbar>`);
  await userEvent.keyboard('{ArrowRight}');
  // assertions
});
```

## TypeScript Configuration

Strict mode enabled with ES2022 target, ESNext modules, and Lit decorator support (`experimentalDecorators: true`).
