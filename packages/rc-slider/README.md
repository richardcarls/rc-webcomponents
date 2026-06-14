# @rcarls/rc-slider

Styled range input web component with composable shadow-DOM track and value
display hooks.

## Styling Hooks

`rc-slider` progressively enhances a direct child `<input type="range">`. The
input remains consumer-owned light DOM for native form participation and direct
consumer styling, while the component renders its track and value display in
shadow DOM.

Consumers can decorate the track with a real named slot:

```html
<rc-slider>
  <span slot="track-background" class="threshold-bands"></span>
  <input type="range" min="0" max="100" value="40">
</rc-slider>
```

The component exposes `root`, `control`, `track`, `progress`, and
`value-display` CSS parts. The root part reflects `data-readonly`,
`data-disabled`, and `data-has-value-text`.

Native input styling stays with the consumer:

```css
rc-slider > input[type="range"] {
  appearance: auto;
}
```
