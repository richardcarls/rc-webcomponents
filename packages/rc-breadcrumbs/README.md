# `@rcarls/rc-breadcrumbs`

Breadcrumb trail enhancer for a native `<nav>` and ordered list of links, following the
[WAI-ARIA Breadcrumb pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/).

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-breadcrumbs](https://richardcarls.github.io/rc-webcomponents/components/rc-breadcrumbs).

## Installation

```sh
yarn add @rcarls/rc-breadcrumbs lit
```

```js
import '@rcarls/rc-breadcrumbs/define';
```

## Usage

```html
<rc-breadcrumbs>
  <nav>
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/settings">Settings</a></li>
      <li><a href="/settings/members" aria-current="page">Members</a></li>
    </ol>
  </nav>
</rc-breadcrumbs>
```

The element names an unlabeled `<nav>` "Breadcrumb" in the element's language, lays the
list out as a wrapping row, and draws separators that screen readers skip. Set
`current-href` to move `aria-current="page"` after client-side navigation.

For server-rendered pages, `@rcarls/rc-breadcrumbs/base.css` applies the same layout
before the element upgrades.
