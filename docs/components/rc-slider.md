<script setup>
import { ref, onMounted } from 'vue';

const volumeDisplay = ref('Volume: 40');

onMounted(() => {
  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider) {
    volumeSlider.addEventListener('rc-slider-input', (e) => {
      volumeDisplay.value = `Volume: ${e.detail.value}`;
    });
  }
});
</script>

# rc-slider

A single-thumb slider wrapping a native `<input type="range">`. The component adds a custom-styled track, fill bar, and optional value display while keeping the native input as the accessible control.

[WAI-ARIA Slider Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)

<AtAGlance
  package-name="@rcarls/rc-slider"
  tag="rc-slider"
  native="Requires a native input[type=range] child"
  state="Controlled or uncontrolled value"
  :events="['rc-slider-input', 'rc-slider-change']"
  :related="[
    { label: 'Progressive enhancement', href: '/guide/progressive-enhancement' },
    { label: 'rc-range-slider', href: '/components/rc-range-slider' }
  ]"
/>

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-slider
```

```sh [yarn]
yarn add @rcarls/rc-slider
```

:::

```js
import '@rcarls/rc-slider/define';
```

## Styling

`rc-slider` is headless — it ships no visual styles. Add the CSS below (or your own variation) to make the track, fill, and thumb visible. This CSS is also used in every demo on this page.

```css
rc-slider { display: block; max-width: 400px; }

.rc-slider-root { display: grid; grid-template-columns: 1fr; gap: 0.4em; }
.rc-slider-root[data-display="inline-end"] { grid-template-columns: 1fr auto; align-items: center; }
.rc-slider-root[data-display="inline-start"] { grid-template-columns: auto 1fr; align-items: center; }

.rc-slider-label { font-size: 0.875rem; font-weight: 500; }

.rc-slider-control { position: relative; display: flex; align-items: center; height: 24px; }

.rc-slider-track { position: absolute; inset: 0; display: flex; align-items: center; pointer-events: none; }
.rc-slider-track::before {
  content: ''; display: block; width: 100%; height: 6px;
  background: var(--rc-track-bg, light-dark(rgba(0,0,0,0.18), rgba(255,255,255,0.22)));

  border-radius: 3px;
}

.rc-slider-progress {
  position: absolute; height: 6px; border-radius: 3px;
  background: var(--rc-accent, Highlight); pointer-events: none;
}

.rc-slider-control input[type="range"] {
  position: absolute; inset: 0; width: 100%; height: 100%;
  margin: 0; appearance: none; background: transparent; cursor: pointer;
}
.rc-slider-control input[type="range"]:disabled { cursor: not-allowed; }
.rc-slider-control input[type="range"]::-webkit-slider-runnable-track { height: 6px; background: transparent; border: none; }
.rc-slider-control input[type="range"]::-moz-range-track { height: 6px; background: transparent; border: none; }
.rc-slider-control input[type="range"]::-webkit-slider-thumb {
  appearance: none; width: 18px; height: 18px; border-radius: 50%;
  background: ButtonFace; border: 2px solid var(--rc-accent, Highlight); cursor: pointer; margin-top: -6px;
}
.rc-slider-control input[type="range"]::-moz-range-thumb {
  appearance: none; width: 18px; height: 18px; border-radius: 50%;
  background: ButtonFace; border: 2px solid var(--rc-accent, Highlight); cursor: pointer;
}
.rc-slider-control input[type="range"]:not(:disabled):hover::-webkit-slider-thumb { background: var(--rc-accent, Highlight); }
.rc-slider-control input[type="range"]:not(:disabled):hover::-moz-range-thumb { background: var(--rc-accent, Highlight); }
.rc-slider-control input[type="range"]:focus-visible { outline: none; }
.rc-slider-control input[type="range"]:focus-visible::-webkit-slider-thumb { outline: 2px solid Highlight; outline-offset: 2px; }
.rc-slider-control input[type="range"]:focus-visible::-moz-range-thumb { outline: 2px solid Highlight; outline-offset: 2px; }

.rc-slider-value { font-variant-numeric: tabular-nums; font-size: 0.875rem; min-width: 2.5em; text-align: right; color: GrayText; }
.rc-slider-root[data-display="inline-start"] .rc-slider-value { text-align: left; }
.rc-slider-root[data-display="float"] .rc-slider-value {
  position: absolute; top: -1.4em; font-size: 0.75rem; min-width: 0;
  text-align: start; transform: translateX(-50%); white-space: nowrap;
}
```

## Basic — `for`/`id` label

Arrow keys adjust by one step; Page Up/Down by 10.

<ClientOnly>
<div class="demo-section">
  <label for="volume-input">Volume</label>
  <rc-slider id="volume-slider" display="inline-end">
    <input id="volume-input" type="range" name="volume" min="0" max="100" value="40">
  </rc-slider>
  <p class="rc-slider-display">{{ volumeDisplay }}</p>
</div>
</ClientOnly>

```html
<label for="volume-input">Volume</label>
<rc-slider display="inline-end">
  <input id="volume-input" type="range" name="volume" min="0" max="100" value="40">
</rc-slider>
```

```js
slider.addEventListener('rc-slider-input', (e) => {
  console.log(e.detail.value);
});
```

## Float value display — wrapping `label`

`display="float"` floats the current value above the thumb.

<ClientOnly>
<div class="demo-section">
  <label>
    Playback speed
    <rc-slider display="float">
      <input type="range" name="speed" min="0" max="100" value="50">
    </rc-slider>
  </label>
</div>
</ClientOnly>

```html
<label>
  Playback speed
  <rc-slider display="float">
    <input type="range" name="speed" min="0" max="100" value="50">
  </rc-slider>
</label>
```

## Inline-start value display

`display="inline-start"` renders the value before the track in the grid.

<ClientOnly>
<div class="demo-section">
  <label>
    Balance
    <rc-slider display="inline-start">
      <input type="range" name="balance" min="0" max="100" value="30">
    </rc-slider>
  </label>
</div>
</ClientOnly>

## Direct `aria-label` on the input

When no visible label is needed, `aria-label` on the native input provides the accessible name directly — works pre-upgrade and with JS disabled.

<ClientOnly>
<div class="demo-section">
  <rc-slider display="inline-end">
    <input type="range" name="brightness" min="0" max="100" value="70" aria-label="Brightness">
  </rc-slider>
</div>
</ClientOnly>

```html
<rc-slider display="inline-end">
  <input type="range" name="brightness" aria-label="Brightness" min="0" max="100" value="70">
</rc-slider>
```

## Readonly

The thumb is visible and focusable but the value cannot be changed.

<ClientOnly>
<div class="demo-section">
  <label>
    Read-only level
    <rc-slider display="inline-end" readonly>
      <input type="range" min="0" max="100" value="65">
    </rc-slider>
  </label>
</div>
</ClientOnly>

## Vertical orientation

<ClientOnly>
<div class="demo-section">
  <label>
    Level
    <rc-slider orientation="vertical" display="inline-end">
      <input type="range" name="level" min="0" max="100" value="60">
    </rc-slider>
  </label>
</div>
</ClientOnly>

```html
<rc-slider orientation="vertical" display="inline-end">
  <input type="range" min="0" max="100" value="60">
</rc-slider>
```

## Disabled

<ClientOnly>
<div class="demo-section">
  <label>
    Disabled
    <rc-slider display="inline-end" disabled>
      <input type="range" min="0" max="100" value="50">
    </rc-slider>
  </label>
</div>
</ClientOnly>

## Material bridge

`@rcarls/rc-theme-material` maps Material slider track, label, shape, and state
tokens into this component. The native range input remains consumer-owned. See
[Theme previews](/guide/theme-previews) for integration details.

## API

<ApiTable tag="rc-slider" />
