# `@rcarls/rc-pagination`

Pagination enhancer for a native `<nav>` holding page links or buttons, with a server-safe
page range helper.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-pagination](https://richardcarls.github.io/rc-webcomponents/components/rc-pagination).

## Installation

```sh
yarn add @rcarls/rc-pagination lit
```

```js
import '@rcarls/rc-pagination/define';
```

## Usage

```html
<rc-pagination total="3" page="2">
  <nav>
    <ul>
      <li><a href="?page=1" data-rc-page="previous" rel="prev">Previous</a></li>
      <li><a href="?page=1" data-rc-page="1">1</a></li>
      <li><a href="?page=2" data-rc-page="2" aria-current="page">2</a></li>
      <li><a href="?page=3" data-rc-page="3">3</a></li>
      <li><a href="?page=3" data-rc-page="next" rel="next">Next</a></li>
    </ul>
  </nav>
</rc-pagination>
```

The element keeps `aria-current="page"` current, names the landmark and numbered controls,
disables steps past either end, and fires a cancelable `rc-pagination-change` on activation.

Build the list with `paginationRange()` from `@rcarls/rc-pagination/range`, which has no DOM
dependency and runs on a server:

```js
import { paginationRange } from '@rcarls/rc-pagination/range';

paginationRange({ page: 6, total: 12 }); // [1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]
```
