# `@rcarls/rc-react`

React wrappers for rc-webcomponents elements, with typed props, events, and refs.

Docs: [https://richardcarls.github.io/rc-webcomponents/guide/react](https://richardcarls.github.io/rc-webcomponents/guide/react).

Each wrapper is a [`@lit/react`](https://lit.dev/docs/frameworks/react/) component that
registers its element when its module loads, sets element properties from props, and maps
every custom event to an `on` prop in camel case. Each wrapper has the same name as the element
class it wraps, such as `RCSelect`. Every module is a React client component, and
every module imports safely during a server render.

## Installation

```sh
yarn add @rcarls/rc-react @rcarls/rc-webcomponents lit
```

## Wrappers

Import wrappers from the subpath named after the component package:

```tsx
'use client';

import { RCSelect } from '@rcarls/rc-react/rc-select';

export function StatusPicker() {
  return (
    <RCSelect popup-mode="dialog" onRcSelectChange={(event) => console.log(event.detail.value)}>
      <select name="status" aria-label="Status">
        <option>Draft</option>
        <option>Published</option>
      </select>
    </RCSelect>
  );
}
```

During a server render, a wrapper outputs the tag with its attributes and children. Props
that are element properties, such as `popupMode` or `value`, are set in the browser after
hydration. Pass the attribute form, such as `popup-mode`, for state the server markup needs.

## Plain tags from server components

`RCRegister` registers elements that a page renders as plain tags, for example from a React
Server Component. Render it once in the root layout with every tag the page uses:

```tsx
import { RCRegister } from '@rcarls/rc-react';

<RCRegister tags={['rc-app-bar', 'rc-card', 'rc-chip']} />;
```

Each definition loads as its own chunk once the page has hydrated.
