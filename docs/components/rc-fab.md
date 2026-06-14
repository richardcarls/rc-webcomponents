# rc-fab

A floating action button with regular icon-only and extended icon-and-label
variants. Consumers own its position and visual emphasis.

<AtAGlance
  package-name="@rcarls/rc-fab"
  tag="rc-fab"
  native="Uses a native shadow-DOM button"
  state="Stateless action control"
/>

## Installation

```sh
yarn add @rcarls/rc-fab
```

```js
import '@rcarls/rc-fab/define';
```

## Usage

<ClientOnly>
<div class="demo-section" style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;">
  <rc-fab label="New recipe">
    <span slot="icon" aria-hidden="true">+</span>
  </rc-fab>
  <rc-fab variant="extended" label="New recipe">
    <span slot="icon" aria-hidden="true">+</span>
  </rc-fab>
  <rc-fab label="Unavailable action" disabled>
    <span slot="icon" aria-hidden="true">+</span>
  </rc-fab>
</div>
</ClientOnly>

```html
<rc-fab label="New recipe">
  <span slot="icon" aria-hidden="true">+</span>
</rc-fab>

<rc-fab variant="extended" label="New recipe">
  <span slot="icon" aria-hidden="true">+</span>
</rc-fab>
```

The `label` supplies the accessible name in both variants. It is visually
hidden for `regular` and shown beside the icon for `extended`.

## Accessibility

- The component uses a native `<button type="button">`.
- Mark decorative icon content `aria-hidden="true"`.
- Use `disabled` when the action is unavailable.
- Positioning and landmark semantics belong to the consumer.

## API

<ApiTable tag="rc-fab" />
