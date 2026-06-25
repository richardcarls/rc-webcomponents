# `@rcarls/rc-common`

Shared controllers and directives for the `@rcarls` web components library. Not a component itself — a set of composable Lit primitives for drag, resize, anchor positioning, active-descendant navigation, roving tabindex, scroll observation, slider value math, keyboard interaction, pointer movement, DOM scroll ancestor lookup, and focusability testing.

---

## Installation

```bash
npm install @rcarls/rc-common
```

## Import

```js
import { DragController, ResizeController, AnchorController } from '@rcarls/rc-common';
import { ActiveDescendantController, ScrollObserverController } from '@rcarls/rc-common';
import { RovingTabIndexMixin, keyInteraction, keyNavigation, mouseMove } from '@rcarls/rc-common';
import {
  findNearestScrollAncestor,
  isFocusable,
  snapToStep,
  valueToPercent,
} from '@rcarls/rc-common';
```

All exports are tree-shakeable (`sideEffects: false`).

## Export inventory

Check this inventory before adding package-local interaction or DOM utility code.

| Export | Use for |
|---|---|
| `ActiveDescendantController` | Managing `aria-activedescendant` virtual focus in listbox / combobox patterns |
| `AnchorController` | Positioning floating UI relative to an anchor with native CSS anchor positioning and polyfill fallback |
| `DragController` | Pointer and keyboard drag-to-move behavior |
| `KeyboardInteractionDirective` / `keyInteraction` | Tracking pointer vs keyboard interaction mode on a rendered element |
| `KeyboardNavigationDirective` / `keyNavigation` | Mapping APG arrow-key models to navigation actions |
| `MouseMoveDirective` / `mouseMove` | Pointermove callbacks while a pointer drag is active |
| `ResizeController` | Pointer and keyboard resize behavior |
| `RovingTabIndexMixin` | Roving tabindex for components whose child controls receive real DOM focus |
| `ScrollObserverController` | Scroll threshold and delta observation for scroll-driven component state |
| `findNearestScrollAncestor` | Locating the nearest scrollable ancestor for scroll-driven behavior |
| `isFocusable` | Filtering focusable items for keyboard navigation |
| `snapToStep`, `valueToPercent` | Slider and range-slider numeric helpers |

---

## API

### `DragController`

A `ReactiveController` that adds pointer-driven drag-to-move to any `LitElement` host. Binds to a configurable handle element and constrains movement to viewport, parent, or a custom bounding element.

```ts
import { LitElement } from 'lit';
import { DragController } from '@rcarls/rc-common';

class MyPanel extends LitElement {
  private _drag = new DragController(this, {
    handle: () => this.shadowRoot!.querySelector('.titlebar')!,
    bounds: 'viewport',   // 'viewport' | 'parent' | HTMLElement
    step: 4,              // px per arrow-key press; Shift = 10×
  });
}
```

The controller pins explicit `top`/`left` on the host element the first time the user drags, clearing any centering transforms that would fight manual positioning. Pointer capture is used for reliable drag-end detection across shadow boundaries.

**Keyboard:** Arrow keys move by `step` px; Shift multiplies by 10.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `handle` | `() => HTMLElement \| null` | host element | Drag handle element or getter |
| `bounds` | `'viewport' \| 'parent' \| HTMLElement` | `'viewport'` | Movement constraint boundary |
| `step` | `number` | `4` | Arrow-key step in px |

---

### `ResizeController`

A `ReactiveController` that adds pointer- and keyboard-driven resizing to any `LitElement` host. Detects cursor position relative to all 8 edges/corners and adjusts a configurable threshold band. Injects a small keyboard-accessible resize handle in the bottom-right corner.

```ts
import { LitElement } from 'lit';
import { ResizeController } from '@rcarls/rc-common';

class MyPanel extends LitElement {
  private _resize = new ResizeController(this, {
    threshold: 8,   // edge hit-test band in px (half inside, half outside)
    step: 4,        // px per arrow-key press; Shift = 10×
  });
}
```

Works alongside `DragController` — `ResizeController` registers a capture-phase listener to intercept pointer events before the drag handler.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `threshold` | `number` | `8` | Edge detection band in px |
| `step` | `number` | `4` | Arrow-key step in px |

---

### `AnchorController`

A `ReactiveController` that positions a floating element relative to an anchor using [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) with automatic polyfill fallback via [`@oddbird/css-anchor-positioning`](https://github.com/oddbird/css-anchor-positioning).

```ts
import { LitElement } from 'lit';
import { AnchorController } from '@rcarls/rc-common';

class MyTooltip extends LitElement {
  private _anchor = new AnchorController(this, {
    anchor: () => document.querySelector('#trigger')!,
    floating: () => this.shadowRoot!.querySelector('#popup')!,
  });
}
```

Injects a `<style>` block into `<head>` for the anchor-name / position-anchor declarations. Supports `@position-try` fallback blocks for automatic flip behavior (native browsers only; polyfill does not support position-try).

**Options:**

| Option | Type | Description |
|---|---|---|
| `anchor` | `() => Element \| null` | The anchor element getter |
| `floating` | `() => Element \| null` | The floating element getter |
| `positionArea` | `string` | CSS `position-area` value (e.g. `'block-end span-inline'`) |

---

### `keyNavigation` directive

An `AsyncDirective` that adds WAI-ARIA keyboard navigation to any element part. Detects the element's `role` to determine the correct navigation axis and delegates action names to a callback.

```ts
import { keyNavigation } from '@rcarls/rc-common';
import type { KeyboardNavigationAction } from '@rcarls/rc-common';

// Inside a Lit render() method:
html`
  <div role="menu" ${keyNavigation(this._onNavigate, {
    handleEscape: true,
    handleActivate: true,
  })}>
    <slot></slot>
  </div>
`;

private _onNavigate(action: KeyboardNavigationAction) {
  switch (action) {
    case 'next':    this.focusNext();   break;
    case 'prev':    this.focusPrev();   break;
    case 'start':   this.focusFirst();  break;
    case 'end':     this.focusLast();   break;
    case 'escape':  this.close();       break;
    case 'activate': this.activate();  break;
    case 'open-to-first': this.open('first'); break;
    case 'open-to-last':  this.open('last');  break;
  }
}
```

Navigation axis is inferred automatically from the element's `role`:

| Role | Default axis |
|---|---|
| `menu`, `listbox`, `tree` | Vertical (Up/Down) |
| `menubar`, `toolbar`, `tablist` | Horizontal (Left/Right) |
| `grid`, `treegrid` | Both |

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `navigationAxis` | `'horizontal' \| 'vertical'` | auto from role | Override the navigation axis |
| `handleNavAxis` | `boolean` | `true` | Respond to arrow keys on the nav axis |
| `handleOpenAxis` | `boolean` | `false` | Respond to arrow keys on the perpendicular (open/close) axis |
| `handleEscape` | `boolean` | `false` | Fire `'escape'` action on Escape key |
| `handleActivate` | `boolean` | `false` | Fire `'activate'` action on Enter/Space |

---

### `mouseMove` directive

An `AsyncDirective` that fires a callback on pointer movement while a pointer drag is active. Designed for drag-to-resize handles that need continuous delta tracking while preserving the historical `mouseMove` export name.

```ts
import { mouseMove } from '@rcarls/rc-common';

// Inside a Lit render() method:
html`
  <div id="handle" ${mouseMove(this._onDrag)}></div>
`;

private _onDrag(e: MouseEvent) {
  this._resize(e.movementX, e.movementY);
}
```

Attaches `pointerdown` on the element, captures that pointer, then listens for `pointermove`, `pointerup`, `pointercancel`, and `lostpointercapture` on the same element for the active drag cycle. Focuses the handle element on pointerdown.

---

### `isFocusable`

A utility function that returns `true` if an element should participate in keyboard navigation. Checks native element types (`<button>`, `<input>`, `<a href>`, etc.) and the presence of a `tabindex` attribute. Disabled elements are always excluded.

```ts
import { isFocusable, type FocusableElement } from '@rcarls/rc-common';

const items = [...slot.assignedElements()].filter(isFocusable);
```

Does **not** check `tabindex >= 0` — rc-common components mutate tabindex values during roving-tabindex management, so any `tabindex` attribute presence is the correct signal.

---

## Browser support

| Feature | Requirement |
|---|---|
| Controllers and directives | Any browser supporting Web Components + Pointer Events |
| `AnchorController` (native) | Chrome 125+, Safari 18+, Firefox (in development) |
| `AnchorController` (polyfilled) | Chrome 80+, Firefox 85+, Safari 14+ |
