# `@rcarls/rc-app-bar`

A Material-style top app bar modeled with web-component conventions: a
structural row for a leading nav control, a title region, and trailing
actions, plus an optional expanded title row (`variant="medium"`) that
collapses when the associated scroll container scrolls.

The component is headless and carries no landmark role — wrap the page-level
instance in `<header>` so landmark semantics stay under consumer control
(secondary instances, such as one bar per split pane, should not be banners).

---

## Installation

```bash
npm install @rcarls/rc-app-bar
```

## Import

```js
// Registers <rc-app-bar>
import '@rcarls/rc-app-bar/define';

// Or import the class without registering
import { RCAppBar } from '@rcarls/rc-app-bar';
```

---

## Basic usage

```html
<header>
  <rc-app-bar scroll-target="#content">
    <button slot="leading" aria-label="Back">&larr;</button>
    <span>Inbox</span>
    <rc-toolbar slot="trailing" label="Actions">
      <button aria-label="Search">…</button>
    </rc-toolbar>
  </rc-app-bar>
</header>
<div id="content" class="scroll-area">…</div>
```

Medium variant with a collapsible expanded title — provide the title in both
the default slot and `expanded-title`; the bar exposes exactly one to
assistive technology at a time:

```html
<rc-app-bar variant="medium" scroll-target="#content">
  <button slot="leading" aria-label="Back">&larr;</button>
  <span>Slow-Roasted Tomato Pasta</span>
  <rc-toolbar slot="trailing" label="Actions">…</rc-toolbar>
  <h1 slot="expanded-title">Slow-Roasted Tomato Pasta</h1>
</rc-app-bar>
```

Search layout is composition, not a variant — slot a search field (such as
`<rc-search-bar>` wrapping a native input) into the default title region.

---

## Scrolled state: controlled and uncontrolled

The scrolled (elevated/collapsed) state follows this library's
controlled/uncontrolled convention:

- **Uncontrolled** — set `scrollTarget` (element property) or the
  `scroll-target` attribute (CSS selector, or the keyword `window`). The bar
  observes the container with a passive listener and drives the state itself,
  firing `rc-app-bar-scroll` on each threshold crossing.
- **Controlled** — assign the `scrolled` property. Host writes apply silently
  (no events) and detach the observer. Assign `undefined` to release back to
  observation.

The state is output for CSS as a `data-scrolled` attribute on the host and a
`scrolled` custom state (`rc-app-bar:state(scrolled)`), following the
headless-library `data-*` state convention. Neither is an input: writing the
attribute yourself has no effect on behavior.

```css
rc-app-bar[data-scrolled] {
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.2);
}

/* equivalent, using the custom state */
rc-app-bar:state(scrolled) {
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.2);
}
```

---

## API

### Properties / attributes

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `variant` | `variant` | `'small' \| 'medium'` | `'small'` | Structural variant; `medium` adds the collapsible expanded title row |
| `scrolled` | — | `boolean \| undefined` | `undefined` | Controlled scrolled state; `undefined` = uncontrolled (observer-driven) |
| `scrollTarget` | `scroll-target` | `Element \| Document \| Window \| string \| null` | `null` | Scroll container to observe; the attribute form is a CSS selector or `window` |
| `scrollThreshold` | `scroll-threshold` | `number` | `4` | Scroll offset in px past which the bar becomes scrolled (strict `>`) |

### CSS custom properties

| Property | Default | Description |
|---|---|---|
| `--rc-app-bar-bg` | `Canvas` | Bar background |
| `--rc-app-bar-color` | `CanvasText` | Bar text color |
| `--rc-app-bar-height` | `64px` | Title row block size |
| `--rc-app-bar-expanded-height` | `48px` | Expanded title row block size |
| `--rc-app-bar-title-font-size` | `1.375rem` | Inline title font size |
| `--rc-app-bar-expanded-title-font-size` | `1.5rem` | Expanded title font size |
| `--rc-app-bar-divider-scrolled` | `1px solid GrayText` | Bottom divider shown while scrolled |
| `--rc-app-bar-shadow-scrolled` | `none` | Box shadow applied while scrolled |
| `--rc-app-bar-transition-duration` | `200ms` | Collapse and fade duration |
| `--rc-app-bar-padding-inline` | `0.75em` | Horizontal padding |
| `--rc-app-bar-gap` | `0.5em` | Gap between title row regions |

### CSS parts

| Part | Element | Description |
|---|---|---|
| `root` | container `div` | The bar container |
| `title-row` | `div` | The main row |
| `leading` | `div` | Wrapper around the leading slot |
| `title` | `div` | Wrapper around the inline title slot |
| `trailing` | `div` | Wrapper around the trailing slot |
| `expanded` | `div` | Wrapper around the expanded title row |

### Slots

| Slot | Description |
|---|---|
| `leading` | Navigation control, typically a back or menu icon button |
| *(default)* | Inline title content, or a search field for a search layout |
| `trailing` | Trailing actions, typically an `rc-toolbar` |
| `expanded-title` | Larger title for `variant="medium"`; hidden in `small` |

### Events

| Event | Detail | Description |
|---|---|---|
| `rc-app-bar-scroll` | `{ scrolled: boolean }` | Fired on each threshold crossing in uncontrolled mode; never fired by host property writes |

---

## Accessibility notes

- The host has no implicit role. Wrap the page-level bar in `<header>` for the
  banner landmark; do not give secondary pane bars a banner role.
- In `variant="medium"`, the inactive title copy (inline while expanded,
  expanded row while collapsed) is `aria-hidden` and `visibility: hidden`, so
  the title is announced once and collapsed content is unfocusable.
- The collapse and fade transitions are disabled under
  `prefers-reduced-motion: reduce`.
- The scrolled divider uses `GrayText`, so the state survives dark mode and
  `forced-colors: active` without relying on color alone. The reserved
  transparent border renders as a constant divider in forced-colors mode.

---

## Browser support

Evergreen browsers. `ElementInternals.states` (`:state(scrolled)`) is
feature-detected; the `data-scrolled` attribute is always set and is the
portable styling hook.
