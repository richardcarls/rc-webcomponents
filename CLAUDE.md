# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WAI-ARIA compliant web components library built with Lit 3.x. Monorepo using Yarn workspaces with packages in `packages/`.

## Build & Test Commands

All commands run from individual package directories (e.g., `packages/rc-splitter/`):

```bash
yarn dev              # Start dev server with hot reload
yarn build            # TypeScript check + Vite build
yarn preview          # Preview production build
yarn test:browser     # Run browser tests (rc-splitter, rc-toolbar only)
```

Run from root for all packages:
```bash
yarn workspaces run build                    # Build all packages
yarn workspace @rcarls/rc-splitter dev       # Run specific package dev server
yarn workspace @rcarls/rc-toolbar test:browser  # Run specific package tests
```

## Architecture

### Package Structure
- **rc-common**: Shared Lit directives (`KeyboardNavigationDirective`, `MouseMoveDirective`)
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
