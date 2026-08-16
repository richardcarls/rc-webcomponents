# `@rcarls/rc-fab-menu`

Floating action button menu wrapper for an `rc-menu` action surface.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-fab-menu](https://richardcarls.github.io/rc-webcomponents/components/rc-fab-menu).

Use this when a primary floating action needs a short menu of related commands. The component
specializes `rc-menu-button`, so it keeps the same menu keyboard behavior, light dismiss, focus
return, and anchor positioning while adding floating action button placement and reveal styling.

## Installation

```bash
npm install @rcarls/rc-fab-menu
```

## Import

```js
import '@rcarls/rc-fab-menu/define';
```

## Basic usage

```html
<rc-fab-menu>
  <button slot="trigger" type="button" aria-label="Create">
    <span aria-hidden="true">+</span>
  </button>

  <rc-menu label="Create">
    <button data-value="recipe">Recipe</button>
    <button data-value="collection">Collection</button>
  </rc-menu>
</rc-fab-menu>
```

The trigger is a consumer-authored native button. The menu is a normal `rc-menu`, so command
activation comes from `rc-menu-activate` and menu rows keep the same APG menu semantics as the
standalone menu package.

## API

`rc-fab-menu` inherits `open`, `defaultOpen`, `openMenu()`, `closeMenu()`, and `toggleMenu()`
from `rc-menu-button` unchanged. It also overrides `placement`'s default (see below).

| Property    | Attribute   | Type                                                         | Default        | Description                                                                                                                   |
| ----------- | ----------- | ------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `position`  | `position`  | `'bottom-end' \| 'bottom-start' \| 'top-end' \| 'top-start'` | `'bottom-end'` | Viewport corner where the trigger is anchored.                                                                                |
| `placement` | `placement` | `AnchorPlacement`                                             | `'top-end'`    | Preferred popup placement. Overrides `rc-menu-button`'s `'bottom-start'` default so the action menu opens above the trigger. |

| Event                | Detail              | Description                                                  |
| -------------------- | ------------------- | ------------------------------------------------------------ |
| `rc-fab-menu-toggle` | `{ open: boolean }` | Fired when user interaction opens or closes the action menu. |

## Theming

The default styling is design-system neutral and follows the `rc-fab` token names where possible.

| CSS custom property            | Default  | Description                                                                     |
| ------------------------------ | -------- | ------------------------------------------------------------------------------- |
| `--rc-fab-menu-position-css`   | `fixed`  | CSS position value for the floating wrapper.                                    |
| `--rc-fab-menu-inset-block`    | `1.5rem` | Distance from the block-axis edge; falls back through `--rc-fab-inset-block`.   |
| `--rc-fab-menu-inset-inline`   | `1.5rem` | Distance from the inline-axis edge; falls back through `--rc-fab-inset-inline`. |
| `--rc-fab-menu-size`           | (none)   | Trigger minimum inline and block size. Set explicitly or apply a theme.         |
| `--rc-fab-menu-radius`         | (none)   | Trigger border radius, deferring to native button radius when unset.            |
| `--rc-fab-menu-bg`             | (none)   | Trigger background, deferring to native button background when unset.           |
| `--rc-fab-menu-color`          | (none)   | Trigger foreground, deferring to native button color when unset.                |
| `--rc-fab-menu-popup-duration` | `0ms`    | Popup reveal transition duration.                                               |

Use `::part(popup)` for popup container refinements and theme `rc-menu` for action rows.
