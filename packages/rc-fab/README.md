# `@rcarls/rc-fab`

A "floating action button (FAB)" implementation, adapted from Material Design 3.

The component uses a native shadow-DOM `<button>` and provides no
positioning behavior; consumers own where the action floats in their layout.

## Installation

```sh
npm install @rcarls/rc-fab
```

```js
import '@rcarls/rc-fab/define';
```

## Usage

```html
<rc-fab label="New item">
  <span slot="icon" aria-hidden="true">+</span>
</rc-fab>

<rc-fab variant="extended" label="New item">
  <span slot="icon" aria-hidden="true">+</span>
</rc-fab>
```

`label` is required for an accessible name. It is visually hidden in the
regular variant and visible in the extended variant.

## Accessibility

- The inner control is a native `<button type="button">`.
- `disabled` maps to the native button's disabled state.
- Decorative icon content should use `aria-hidden="true"`.
- The component does not create a landmark or choose a page position.
