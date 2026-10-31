# `@rcarls/rc-data-table`

Sortable-header enhancer for a native `<table>`, following the
[WAI-ARIA sortable table example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/).

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-data-table](https://richardcarls.github.io/rc-webcomponents/components/rc-data-table).

## Installation

```sh
yarn add @rcarls/rc-data-table lit
```

```js
import '@rcarls/rc-data-table/define';
```

## Usage

```html
<rc-data-table sort-key="name" sort-direction="ascending">
  <table>
    <caption>
      Plants. Column headers with buttons are sortable.
    </caption>
    <thead>
      <tr>
        <th scope="col" data-rc-sort-key="name"><button type="button">Name</button></th>
        <th scope="col" data-rc-sort-key="price"><button type="button">Price</button></th>
      </tr>
    </thead>
    <tbody>
      <!-- rows, in the current sort order -->
    </tbody>
  </table>
</rc-data-table>
```

The element reflects the sort state as `aria-sort`, draws a sort indicator in every sortable
header, and fires a cancelable `rc-data-table-sort` when a header is activated. It never
sorts rows: re-render them in the requested order.
