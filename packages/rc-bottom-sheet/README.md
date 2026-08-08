# `@rcarls/rc-bottom-sheet`

Modal bottom-sheet wrapper for a native `<dialog>`.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-bottom-sheet](https://richardcarls.github.io/rc-webcomponents/components/rc-bottom-sheet).

## Installation

```bash
npm install @rcarls/rc-bottom-sheet
```

```bash
yarn add @rcarls/rc-bottom-sheet
```

```js
import '@rcarls/rc-bottom-sheet/define';
```

## Usage

Place a `<dialog>` element directly inside `<rc-bottom-sheet>`. The inner dialog
must have `aria-labelledby` or `aria-label`.

```html
<rc-bottom-sheet id="filters" snap-points="40dvh 70dvh 100dvh">
  <dialog aria-label="Filter recipes">
    <button
      type="button"
      data-rc-bottom-sheet-handle
      data-rc-dialog-resize-axis="y"
      data-rc-dialog-resize-origin="top"
      aria-label="Resize sheet"
    ></button>
    <button value="close" formmethod="dialog">Done</button>
  </dialog>
</rc-bottom-sheet>

<script type="module">
  document.querySelector('#filters').showModal();
</script>
```

`rc-bottom-sheet` inherits `rc-dialog` methods and events, including
`showModal()`, `show()`, `close()`, `requestClose()`, `rc-dialog-toggle`, and
`rc-dialog-request-close`. It defaults to light dismiss, vertical top-origin
resize, downward swipe-dismiss, and fixed positioning at the viewport's bottom
edge. Add an optional
`[data-rc-bottom-sheet-handle]` element inside the dialog for an authored
handle. Handles without a theme use the same centered 32 by 4 pixel pill
geometry as the splitter-style drag indicator.

For an embedded non-modal sheet, place the component in a positioned container,
set `--rc-bottom-sheet-position: absolute`, and open it with `show()`. The sheet
then docks to that container's block-end edge instead of the viewport.

List `snap-points` as CSS heights in ascending order. Slow drag releases
settle at the nearest point; a swipe at `swipe-velocity` or faster settles at
the first or last point. Settling animates unless the user prefers reduced
motion.

Call `snapTo(index)` to move programmatically. The
`rc-bottom-sheet-snap` event reports the selected `index`, target `height`,
and whether the trigger was a drag or API call.
