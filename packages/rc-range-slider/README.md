# @rcarls/rc-range-slider

WAI-ARIA APG multi-thumb range slider web component with native form
participation.

`rc-range-slider` progressively enhances two direct child
`<input type="range">` elements. Before upgrade, those inputs are the usable
no-JavaScript fallback. After upgrade, the inputs remain in light DOM as hidden
form reflectors while custom shadow-DOM thumbs provide the APG slider
interaction surface.

```html
<rc-range-slider aria-label="Price range">
  <input type="range" name="price-min" min="0" max="100" value="20" aria-label="Minimum">
  <input type="range" name="price-max" min="0" max="100" value="80" aria-label="Maximum">
</rc-range-slider>
```

The custom thumbs expose `role="slider"`, stable tab order, dynamic
`aria-valuemin` / `aria-valuemax` bounds, keyboard support, and optional
`aria-valuetext` through `low-value-text` and `high-value-text`. The hidden
native inputs keep their `name`, current `value`, and disabled state so normal
form submission keeps working.

## Styling Hooks

The component exposes `root`, `group`, `track`, `range`, `thumb`, `low-thumb`,
`high-thumb`, `value-display`, `low-value-display`, and `high-value-display`
CSS parts.

Consumers can decorate the track with a real named slot:

```html
<rc-range-slider aria-label="Price range">
  <span slot="track-background" class="threshold-bands"></span>
  <input type="range" name="price-min" min="0" max="100" value="20" aria-label="Minimum">
  <input type="range" name="price-max" min="0" max="100" value="80" aria-label="Maximum">
</rc-range-slider>
```

Visual thumb styling belongs to CSS parts, not native input pseudo-elements,
because the upgraded interaction surface is custom shadow DOM. The fallback
inputs remain ordinary native range controls before the component upgrades.
