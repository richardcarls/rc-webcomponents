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

`rc-fab-menu` inherits `open`, `defaultOpen`, `placement`, `openMenu()`, `closeMenu()`, and
`toggleMenu()` from `rc-menu-button`.

| Property   | Attribute  | Type                                                         | Default        | Description                                    |
| ---------- | ---------- | ------------------------------------------------------------ | -------------- | ---------------------------------------------- |
| `position` | `position` | `'bottom-end' \| 'bottom-start' \| 'top-end' \| 'top-start'` | `'bottom-end'` | Viewport corner where the trigger is anchored. |

| Event                | Detail              | Description                                                  |
| -------------------- | ------------------- | ------------------------------------------------------------ |
| `rc-fab-menu-toggle` | `{ open: boolean }` | Fired when user interaction opens or closes the action menu. |

## Theming

The default styling is design-system neutral and follows the `rc-fab` token names where possible.

| CSS custom property            | Default                              | Description                                  |
| ------------------------------ | ------------------------------------ | -------------------------------------------- |
| `--rc-fab-menu-position-css`   | `fixed`                              | CSS position value for the floating wrapper. |
| `--rc-fab-menu-inset-block`    | `var(--rc-fab-inset-block, 1.5rem)`  | Distance from the block-axis edge.           |
| `--rc-fab-menu-inset-inline`   | `var(--rc-fab-inset-inline, 1.5rem)` | Distance from the inline-axis edge.          |
| `--rc-fab-menu-size`           | `var(--rc-fab-size, 3.5rem)`         | Trigger minimum inline and block size.       |
| `--rc-fab-menu-radius`         | `var(--rc-fab-radius, 9999px)`       | Trigger border radius.                       |
| `--rc-fab-menu-bg`             | `var(--rc-fab-bg, ButtonFace)`       | Trigger background.                          |
| `--rc-fab-menu-color`          | `var(--rc-fab-color, ButtonText)`    | Trigger foreground.                          |
| `--rc-fab-menu-popup-duration` | `160ms`                              | Popup reveal transition duration.            |

Use `::part(popup)` for popup container refinements and theme `rc-menu` for action rows.
