# `@rcarls/rc-navigation-rail`

Navigation rail landmark that styles consumer-authored links.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-navigation-rail](https://richardcarls.github.io/rc-webcomponents/components/rc-navigation-rail).

Use this for medium and expanded PWA layouts where native links should keep working before custom
element upgrade and remain compatible with framework routers.

## Installation

```bash
npm install @rcarls/rc-navigation-rail
```

## Import

```js
import '@rcarls/rc-navigation-rail/define';
```

## Basic usage

```html
<rc-navigation-rail label="Main navigation" toggleable>
  <a href="/recipes" aria-current="page">
    <span data-rc-navigation-icon aria-hidden="true">R</span>
    <span>Recipes</span>
  </a>
  <a href="/settings">
    <span data-rc-navigation-icon aria-hidden="true">S</span>
    <span>Settings</span>
  </a>
</rc-navigation-rail>
```

## Adaptive usage

Render this component from app layout code for windows at least 600 CSS pixels wide. Keep it
collapsed at medium widths, and only offer or persist `expanded` at widths of at least 840 CSS
pixels. Use the same destination data and
active-link rules as `rc-navigation-bar` so compact and rail layouts stay in
sync.

## Slots

| Slot | Description |
| --- | --- |
| default | Navigation links. Direct `<a>` children are recommended. |
| `header` | Content above the navigation links. |
| `footer` | Content pinned after the navigation links. |
| `toggle` | Custom expand/collapse control. |

## API

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `'Primary navigation'` | Accessible label for the navigation landmark. |
| `expanded` | `expanded` | `boolean` | `false` | Whether the rail is expanded. Host writes are silent. |
| `defaultExpanded` | `default-expanded` | `boolean` | `false` | Initial expanded state for uncontrolled usage. |
| `toggleable` | `toggleable` | `boolean` | `false` | Render the default expand/collapse toggle when no custom toggle is slotted. |
| `expandLabel` | `expand-label` | `string` | `'Expand navigation'` | Accessible label used by the default toggle while collapsed. |
| `collapseLabel` | `collapse-label` | `string` | `'Collapse navigation'` | Accessible label used by the default toggle while expanded. |
| `activeSelector` | `active-selector` | `string` | `a[aria-current]:not([aria-current="false"])` | Selector used to find the active link. |
| `indicatorTarget` | `indicator-target` | `string` | `[data-rc-navigation-indicator], [data-rc-navigation-icon]` | Selector inside the active link used for indicator geometry. |

| Method | Description |
| --- | --- |
| `expand()` | Expands the rail. |
| `collapse()` | Collapses the rail. |
| `toggleExpanded()` | Toggles expanded state. |

| Event | Detail | Description |
| --- | --- | --- |
| `rc-navigation-rail-toggle` | `{ expanded: boolean }` | Fired when user interaction or a method toggles expanded state. |
