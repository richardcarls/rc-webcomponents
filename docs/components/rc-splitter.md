# rc-splitter

A resizable pane splitter. Drag the separator or use arrow keys to resize adjacent panes. Shift multiplies keyboard movement by 10×. Home collapses the primary pane; End expands it.

[WAI-ARIA Window Splitter Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-splitter
```

```sh [yarn]
yarn add @rcarls/rc-splitter
```

:::

```js
import '@rcarls/rc-splitter/define';
```

<style>
.splitter-demo rc-splitter { --rc-splitter-separator-size: 8px; }
.splitter-demo rc-splitter[orientation="vertical"] { height: 260px; }
.splitter-demo article {
  box-sizing: border-box;
  max-height: 50vh;
  padding: 0.5em 0.75em;
  border: 1px solid ButtonBorder;
  overflow: auto;
  font-size: 0.875rem;
}
.splitter-demo article h3 { margin: 0 0 0.4em; font-size: 0.95rem; }
.splitter-demo article p { margin: 0; color: var(--vp-c-text-2); }
</style>

## Basic usage

<ClientOnly>
<div class="demo-section splitter-demo">
  <rc-splitter>
    <article>
      <h3>Primary pane</h3>
      <p>Drag the separator or focus it and use arrow keys. Shift multiplies step by 10×.</p>
    </article>
    <article slot="secondary">
      <h3>Secondary pane</h3>
      <p>Home collapses the primary pane; End expands it fully.</p>
    </article>
  </rc-splitter>
</div>
</ClientOnly>

```html
<rc-splitter>
  <article>Primary content</article>
  <article slot="secondary">Secondary content</article>
</rc-splitter>
```

## Vertical orientation

<ClientOnly>
<div class="demo-section splitter-demo">
  <rc-splitter orientation="vertical">
    <article>
      <h3>Top pane</h3>
      <p>Drag the horizontal separator to resize.</p>
    </article>
    <article slot="secondary">
      <h3>Bottom pane</h3>
      <p>Keyboard: arrow keys, Shift for 10× steps.</p>
    </article>
  </rc-splitter>
</div>
</ClientOnly>

```html
<rc-splitter orientation="vertical">
  <article>Top content</article>
  <article slot="secondary">Bottom content</article>
</rc-splitter>
```

## Nested splitters

<ClientOnly>
<div class="demo-section splitter-demo">
  <rc-splitter>
    <rc-splitter orientation="vertical">
      <article><h3>Top-left</h3><p>Nested vertical splitter.</p></article>
      <article slot="secondary"><h3>Bottom-left</h3><p>Independent resize.</p></article>
    </rc-splitter>
    <rc-splitter orientation="vertical" slot="secondary">
      <article><h3>Top-right</h3><p>Nested vertical splitter.</p></article>
      <article slot="secondary"><h3>Bottom-right</h3><p>Independent resize.</p></article>
    </rc-splitter>
  </rc-splitter>
</div>
</ClientOnly>

## Percentage mode

`mode="percent"` tracks size as a percentage of the container. `step` controls arrow-key increment.

<ClientOnly>
<div class="demo-section splitter-demo">
  <rc-splitter mode="percent" step="10">
    <article>
      <h3>Primary (percent mode)</h3>
      <p>Arrow keys step by 10%. Home collapses, End expands.</p>
    </article>
    <article slot="secondary">
      <h3>Secondary</h3>
      <p>Size is tracked as a percentage of the container width.</p>
    </article>
  </rc-splitter>
</div>
</ClientOnly>

```html
<rc-splitter mode="percent" step="10">
  <div>Primary</div>
  <div slot="secondary">Secondary</div>
</rc-splitter>
```

## Fixed (non-interactive)

`fixed` makes the separator non-interactive. `value` sets the initial primary pane size in pixels.

<ClientOnly>
<div class="demo-section splitter-demo">
  <rc-splitter value="200" fixed>
    <article>
      <h3>Fixed 200 px</h3>
      <p>The separator is non-interactive when <code>fixed</code> is set.</p>
    </article>
    <article slot="secondary">
      <h3>Secondary</h3>
      <p>Takes the remaining space.</p>
    </article>
  </rc-splitter>
</div>
</ClientOnly>

```html
<rc-splitter value="300" fixed>
  <div>Fixed 300 px primary</div>
  <div slot="secondary">Remainder</div>
</rc-splitter>
```

## API

<ApiTable tag="rc-splitter" />
