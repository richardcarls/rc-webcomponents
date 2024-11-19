# Implementation Plan: rc-menu, rc-menubar, and rc-menu-button Components

## Overview

Create WAI-ARIA compliant menu components following the APG menubar and menu-button patterns. Three new packages will be created, plus updates to `rc-common` for extended keyboard navigation.

## Component Design

### Usage Examples

```html
<!-- Standalone menu button -->
<rc-menu-button>
  <button slot="trigger">Options</button>
  <rc-menu>
    <button>Cut</button>
    <button>Copy</button>
    <button>Paste</button>
  </rc-menu>
</rc-menu-button>

<!-- Menubar with multiple menus -->
<rc-menubar label="Application Menu">
  <rc-menu-button>
    <button slot="trigger">File</button>
    <rc-menu>
      <button>New</button>
      <button>Open</button>
      <button disabled>Save</button>
    </rc-menu>
  </rc-menu-button>
  <rc-menu-button>
    <button slot="trigger">Edit</button>
    <rc-menu>
      <button>Undo</button>
      <button>Redo</button>
    </rc-menu>
  </rc-menu-button>
</rc-menubar>
```

### Key Design Decisions

1. **Light DOM children**: Menu items are slotted native buttons (like rc-toolbar) - no custom rc-menu-item element needed
2. **Simple positioning**: Absolute positioning with CSS custom properties for override
3. **No submenus initially**: Keep first implementation simple; can add later
4. **Focus management**: WeakRef pattern from rc-toolbar, roving tabindex on menu items

## Package Structure

```
packages/
  rc-menu/                    # Menu container
    src/
      rc-menu.ts
      rc-menu.styles.ts
      rc-menu.test.ts
      index.ts
    index.html
    package.json, tsconfig.json, vite.config.ts, vitest.config.ts

  rc-menu-button/             # Button + popup container
    src/
      rc-menu-button.ts
      rc-menu-button.styles.ts
      rc-menu-button.test.ts
      index.ts
    index.html
    package.json, tsconfig.json, vite.config.ts, vitest.config.ts

  rc-menubar/                 # Horizontal menubar
    src/
      rc-menubar.ts
      rc-menubar.styles.ts
      rc-menubar.test.ts
      index.ts
    index.html
    package.json, tsconfig.json, vite.config.ts, vitest.config.ts
```

## Component Specifications

### rc-menu

**Role**: `menu` container that manages focus and navigation of slotted items

**Properties**:
- `label: string` - Accessible name (maps to aria-label)

**ARIA**:
- `role="menu"`
- `aria-label`
- `tabindex="-1"` on container

**Keyboard** (via KeyboardNavigationDirective):
- Up/Down Arrow: Navigate items (wrapping)
- Home/End: First/last item
- Enter/Space: Activate item, dispatch `rc-menu-activate`
- Escape: Dispatch `rc-menu-close` (bubbles to rc-menu-button)

**Events**:
- `rc-menu-activate`: `{ item: HTMLElement }` - Fired when item activated
- `rc-menu-close`: Fired on Escape

**CSS Parts**: `root`

**CSS Custom Properties**:
- `--rc-menu-min-width`
- `--rc-menu-padding-block`
- `--rc-menu-background`
- `--rc-menu-border`
- `--rc-menu-shadow`

---

### rc-menu-button

**Role**: Button that opens/closes a menu popup

**Properties**:
- `open: boolean` - Menu open state (reflects to attribute)

**Slots**:
- `trigger` - The button element (required)
- default - The rc-menu element

**ARIA** (applied to trigger):
- `aria-haspopup="menu"`
- `aria-expanded` (true when open)

**Keyboard**:
- Enter/Space/Down on trigger: Open menu, focus first item
- Escape: Close menu, return focus to trigger
- Outside click: Close menu

**Events**:
- `rc-menu-button-toggle`: `{ open: boolean }`

**CSS Parts**: `root`, `popup`

**CSS Custom Properties**:
- `--rc-menu-button-popup-z-index`

---

### rc-menubar

**Role**: Horizontal/vertical bar containing menu buttons

**Properties**:
- `label: string` - Accessible name
- `orientation: 'horizontal' | 'vertical'` - Layout direction

**ARIA**:
- `role="menubar"`
- `aria-label`
- `aria-orientation`

**Keyboard**:
- Left/Right Arrow: Navigate between menu buttons
- Home/End: First/last menu button
- Down Arrow: Open current menu button's menu
- Escape: Close open menu
- Tab: Exit menubar

**Behavior**:
- When a menu is open and arrows navigate to another menu button, that menu opens automatically
- Roving tabindex on menu button triggers

**CSS Parts**: `root`

**CSS Custom Properties**:
- `--rc-menubar-gap`
- `--rc-menubar-padding-inline`
- `--rc-menubar-padding-block`

---

## KeyboardNavigationDirective Updates

**File**: `packages/rc-common/src/KeyboardNavigationDirective.ts`

### Action Types

```typescript
export type KeyboardNavigationAction =
  | 'next' | 'prev' | 'start' | 'end'
  | 'collapse' | 'restore'  // @deprecated - use 'toggle' instead
  | 'escape'    // Escape key pressed
  | 'activate'  // Enter/Space pressed (for menu items)
  | 'toggle';   // Enter pressed (replaces collapse/restore)
```

### Deprecations

1. **`collapse` and `restore` actions**: Deprecated in favor of `'toggle'` action
   - Will still be dispatched for backward compatibility when using default Enter handling
   - Add `@deprecated` JSDoc comments
   - TODO: In future version, Enter should dispatch `'toggle'` instead of `'collapse'`/`'restore'`

2. **Boolean second parameter**: Deprecated in favor of options object
   - `keyNavigation(cb, true)` → `keyNavigation(cb, { useInteractionModeAttr: true })`
   - Add console.warn in development mode when boolean is passed
   - Add `@deprecated` JSDoc on the boolean overload

### New Options Interface

```typescript
export interface KeyNavigationOptions {
  /**
   * Set data-interaction-mode attribute for keyboard vs mouse styling.
   * @default true
   */
  useInteractionModeAttr?: boolean;

  /** Dispatch 'escape' action on Escape key. @default false */
  handleEscape?: boolean;

  /** Dispatch 'activate' action on Enter/Space. @default false */
  handleActivate?: boolean;
}
```

### API Change

```typescript
// Deprecated (still works but logs warning):
${keyNavigation(callback, useInteractionModeAttr)}

// New preferred form:
${keyNavigation(callback, { handleEscape: true, handleActivate: true })}

// Just callback (uses defaults):
${keyNavigation(callback)}
```

### Backward Compatibility

- If second parameter is `boolean`, treat as `useInteractionModeAttr` but log deprecation warning
- If second parameter is `object`, use as options
- Default behavior unchanged for rc-toolbar and rc-splitter
- `collapse`/`restore` actions still dispatched (deprecated but functional)

### TODO for Future

- [ ] Replace `collapse`/`restore` with single `'toggle'` action
- [ ] Consider if Enter-only (without Space) should dispatch different action than Enter+Space

---

## Implementation Sequence

### Phase 1: Update rc-common

1. Extend `KeyboardNavigationAction` type with `'escape'`, `'activate'`, and `'toggle'`
2. Add `@deprecated` JSDoc to `'collapse'` and `'restore'` actions
3. Add `KeyNavigationOptions` interface with JSDoc
4. Update directive to handle options object or boolean (with deprecation warning for boolean)
5. Add Escape key handling (opt-in via `handleEscape`)
6. Add Enter/Space as 'activate' action (opt-in via `handleActivate`)
7. Add TODO comment for future `'toggle'` action implementation
8. Run existing tests to verify no regressions

### Phase 2: Create rc-menu package

1. Create package scaffolding (copy from rc-toolbar)
2. Implement rc-menu.ts:
   - Slot handling for focusable children (same pattern as rc-toolbar)
   - Roving tabindex management
   - Keyboard navigation via directive with `handleEscape` and `handleActivate`
   - Event dispatching
3. Add minimal styles
4. Create demo index.html
5. Add browser tests

### Phase 3: Create rc-menu-button package

1. Create package scaffolding
2. Implement rc-menu-button.ts:
   - Trigger slot with ARIA attribute management
   - Popup container with open/close logic
   - Focus management (store trigger ref, restore on close)
   - Light dismiss (click outside)
   - Keyboard handling on trigger
3. Add styles
4. Create demo index.html
5. Add browser tests

### Phase 4: Create rc-menubar package

1. Create package scaffolding
2. Implement rc-menubar.ts:
   - Roving tabindex on menu button triggers
   - Menu cascade behavior (arrow keys open adjacent menus)
   - Listen for rc-menu-button-toggle to track active menu
3. Add styles
4. Create demo index.html
5. Add browser tests

---

## Critical Files

**To modify**:
- `packages/rc-common/src/KeyboardNavigationDirective.ts` - Add new actions and options

**To create** (per package):
- `packages/rc-menu/src/rc-menu.ts`
- `packages/rc-menu/src/rc-menu.styles.ts`
- `packages/rc-menu/src/rc-menu.test.ts`
- `packages/rc-menu/src/index.ts`
- `packages/rc-menu/index.html`
- `packages/rc-menu/package.json`
- `packages/rc-menu/tsconfig.json`
- `packages/rc-menu/vite.config.ts`
- `packages/rc-menu/vitest.config.ts`

(Same structure for rc-menu-button and rc-menubar)

**Reference files** (patterns to follow):
- `packages/rc-toolbar/src/rc-toolbar.ts` - Slot handling, roving tabindex
- `packages/rc-toolbar/src/rc-toolbar.styles.ts` - Minimal CSS approach
- `packages/rc-toolbar/package.json` - Package configuration
- `packages/rc-toolbar/vite.config.ts` - Build configuration

---

## Verification

### Build Verification
```bash
yarn workspaces run build  # All packages should build successfully
```

### Test Verification
```bash
yarn workspace @rcarls/rc-toolbar test:browser   # Existing tests pass
yarn workspace @rcarls/rc-splitter test:browser  # Existing tests pass
yarn workspace @rcarls/rc-menu test:browser      # New tests pass
yarn workspace @rcarls/rc-menu-button test:browser
yarn workspace @rcarls/rc-menubar test:browser
```

### Manual Testing
- Open each package's `index.html` in dev mode
- Verify keyboard navigation matches WAI-ARIA APG patterns
- Verify focus management (visible focus ring with keyboard, none with mouse)
- Test with screen reader for ARIA announcements
