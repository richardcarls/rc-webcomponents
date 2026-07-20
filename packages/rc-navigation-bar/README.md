# `@rcarls/rc-navigation-bar`

Bottom navigation landmark that styles consumer-authored links.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-navigation-bar](https://richardcarls.github.io/rc-webcomponents/components/rc-navigation-bar).

Use this for compact PWA navigation where native links should keep working before custom element
upgrade and remain compatible with framework routers.

## Installation

```bash
npm install @rcarls/rc-navigation-bar
```

## Import

```js
import '@rcarls/rc-navigation-bar/define';
```

## Basic usage

```html
<rc-navigation-bar label="Main navigation">
  <a href="/recipes" aria-current="page">
    <span data-rc-navigation-icon aria-hidden="true">R</span>
    <span>Recipes</span>
  </a>
  <a href="/settings">
    <span data-rc-navigation-icon aria-hidden="true">S</span>
    <span>Settings</span>
  </a>
</rc-navigation-bar>
```

The component reads `aria-current` from the native links. Use `active-selector` when a router
exposes active state through classes instead.

## Adaptive usage

Render this component from app layout code for windows narrower than 600 CSS pixels. At 600 CSS
pixels, switch the same destination data to `rc-navigation-rail`; at 840 CSS pixels, the app may
allow and persist rail expansion. Keep that breakpoint
policy outside the component so route matching, view transitions, and page
layout stay coordinated.

## API

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `'Primary navigation'` | Accessible label for the navigation landmark. |
| `activeSelector` | `active-selector` | `string` | `a[aria-current]:not([aria-current="false"])` | Selector used to find the active link. |
| `indicatorTarget` | `indicator-target` | `string` | `[data-rc-navigation-indicator], [data-rc-navigation-icon]` | Selector inside the active link used for indicator geometry. |

| Part | Description |
| --- | --- |
| `nav` | Component-owned navigation landmark. |
| `indicator` | Active item indicator. |
