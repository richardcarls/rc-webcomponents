<script setup>
import { ref, onMounted } from 'vue';

const priceDisplay = ref('$20 – $80');

onMounted(() => {
  const basic = document.getElementById('basic-range');
  if (basic) {
    basic.addEventListener('rc-range-slider-input', (e) => {
      priceDisplay.value = `$${e.detail.value[0]} – $${e.detail.value[1]}`;
    });
  }
});
</script>

# rc-range-slider

A two-thumb range slider for selecting a value range. Wraps two native `<input type="range">` elements. Use arrow keys on a focused thumb to adjust its value; Shift multiplies the step by 10.

[WAI-ARIA Multi-Thumb Slider Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-range-slider
```

```sh [yarn]
yarn add @rcarls/rc-range-slider
```

:::

```js
import '@rcarls/rc-range-slider/define';
```

## Styling

`rc-range-slider` is headless. Style it via `::part()` selectors and CSS custom properties:

```css
rc-range-slider {
  display: block;
  max-width: 400px;
  --rc-range-slider-track-size: 0.375rem;
  --rc-range-slider-thumb-size: 1.125rem;
}

rc-range-slider::part(track),
rc-range-slider::part(range) { border-radius: 999px; }

rc-range-slider::part(thumb) {
  box-shadow: 0 1px 2px color-mix(in srgb, CanvasText 18%, transparent);
}

rc-range-slider::part(value-display) {
  font-size: 0.75rem;
  color: GrayText;
}
```

## Basic — `fieldset`/`legend`

A `<fieldset>`/`<legend>` names the group without JavaScript.

<ClientOnly>
<div class="demo-section">
  <fieldset>
    <legend>Price range</legend>
    <rc-range-slider id="basic-range">
      <input type="range" name="price-min" min="0" max="100" value="20" aria-label="Minimum price">
      <input type="range" name="price-max" min="0" max="100" value="80" aria-label="Maximum price">
    </rc-range-slider>
  </fieldset>
  <p>{{ priceDisplay }}</p>
</div>
</ClientOnly>

```html
<fieldset>
  <legend>Price range</legend>
  <rc-range-slider id="price">
    <input type="range" name="price-min" min="0" max="100" value="20" aria-label="Minimum price">
    <input type="range" name="price-max" min="0" max="100" value="80" aria-label="Maximum price">
  </rc-range-slider>
</fieldset>
```

```js
slider.addEventListener('rc-range-slider-input', (e) => {
  const [min, max] = e.detail.value;
  output.textContent = `$${min} – $${max}`;
});
```

## Float value display

`display="float"` floats each value above its thumb.

<ClientOnly>
<div class="demo-section">
  <fieldset>
    <legend>Year range</legend>
    <rc-range-slider display="float">
      <input type="range" name="year-start" min="2000" max="2030" value="2010" aria-label="Start year">
      <input type="range" name="year-end" min="2000" max="2030" value="2025" aria-label="End year">
    </rc-range-slider>
  </fieldset>
</div>
</ClientOnly>

```html
<rc-range-slider display="float">
  <input type="range" name="year-start" min="2000" max="2030" value="2010" aria-label="Start year">
  <input type="range" name="year-end"   min="2000" max="2030" value="2025" aria-label="End year">
</rc-range-slider>
```

## Inline-end value display

`display="inline-end"` renders the low – high values after the track.

<ClientOnly>
<div class="demo-section">
  <fieldset>
    <legend>Budget range</legend>
    <rc-range-slider display="inline-end">
      <input type="range" name="budget-min" min="0" max="1000" value="100" aria-label="Minimum budget">
      <input type="range" name="budget-max" min="0" max="1000" value="800" aria-label="Maximum budget">
    </rc-range-slider>
  </fieldset>
</div>
</ClientOnly>

## Readonly

Thumbs are visible and focusable but values cannot be changed.

<ClientOnly>
<div class="demo-section">
  <fieldset>
    <legend>Read-only range</legend>
    <rc-range-slider readonly>
      <input type="range" min="0" max="100" value="30" aria-label="Minimum">
      <input type="range" min="0" max="100" value="70" aria-label="Maximum">
    </rc-range-slider>
  </fieldset>
</div>
</ClientOnly>

## Disabled

<ClientOnly>
<div class="demo-section">
  <fieldset>
    <legend>Disabled range</legend>
    <rc-range-slider disabled>
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="60" aria-label="Maximum">
    </rc-range-slider>
  </fieldset>
</div>
</ClientOnly>

## Vertical orientation

<ClientOnly>
<div class="demo-section">
  <fieldset>
    <legend>Vertical range</legend>
    <rc-range-slider orientation="vertical">
      <input type="range" min="0" max="100" value="25" aria-label="Minimum">
      <input type="range" min="0" max="100" value="75" aria-label="Maximum">
    </rc-range-slider>
  </fieldset>
</div>
</ClientOnly>

```html
<rc-range-slider orientation="vertical">
  <input type="range" min="0" max="100" value="25" aria-label="Minimum">
  <input type="range" min="0" max="100" value="75" aria-label="Maximum">
</rc-range-slider>
```

## API

<ApiTable tag="rc-range-slider" />
