# @rcarls/rc-virtual-scroller

Headless virtualization wrapper that reports the visible index range for a
consumer-owned list or grid and reserves the off-range scroll space.

```html
<rc-scroller>
  <rc-virtual-scroller count="4000" item-size="288">
    <ul class="cards">
      <!-- only the items in the current range -->
    </ul>
  </rc-virtual-scroller>
</rc-scroller>
```

```js
const scroller = document.querySelector('rc-virtual-scroller');

const render = ({ start, end }) => renderItems(recipes.slice(start, end), start);

// The element may have measured before this listener existed.
if (scroller.range) render(scroller.range);

scroller.addEventListener('rc-virtual-scroller-range', (event) => render(event.detail));
```

The element measures on its own schedule, which can be before your listener is
attached, and it never re-sends an unchanged range. Render once from the
read-only `range` property when you subscribe, then follow the event.

The element never creates, recycles, or positions item DOM. It measures
geometry, dispatches `rc-virtual-scroller-range`, and sizes two spacer parts
around the default slot. You slot one container element and render the reported
slice into it with whatever you already use.

That split is the whole point. The markup, the CSS layout, and the
accessibility semantics stay with the code that owns them, so a native
`grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr))` keeps working
untouched, `<ul>` still contains `<li>`, and a framework's keyed list still
reuses the nodes that stayed in range.

## Why not `content-visibility: auto`

CSS containment skips layout and paint for offscreen content, but a custom
element upgrades when it is parsed or inserted, before style is resolved.
Containment cannot prevent element construction, so a collection of a few
thousand custom elements still pays for all of them up front. Virtualization is
the only thing that avoids that cost.

## Axis, direction, and writing mode

`axis` is logical. `block`, the default, windows lines that stack the way
paragraphs do: top to bottom in horizontal text, right to left in
`vertical-rl`. `inline` windows items running the way text runs, such as a
horizontal shelf. For the inline axis, lay the container's items along it with
`display: flex` or a grid with `grid-auto-flow: column`.

```html
<rc-virtual-scroller axis="inline" count="500" item-size="160">
  <ul class="shelf">
    <!-- display: flex -->
  </ul>
</rc-virtual-scroller>
```

Direction and writing mode come from the element's computed style, so RTL
pages and vertical text need no configuration. The visible range is measured
from where the scroll container's visible box sits relative to the element, in
the element's own flow, so it never depends on the sign conventions of
`scrollLeft` in RTL.

## Geometry

`count` is the true total. `item-size` is the estimated line pitch in pixels;
it is used for the first frame and whenever nothing can be measured yet, so a
reasonable value matters for the first paint and for restoring a saved scroll
position.

Items per line and line pitch are measured from the slotted container rather
than configured. On the block axis a line holds one item per grid column
(`grid-template-columns`); on the inline axis, one item per grid row
(`grid-template-rows`). Grid columns and rows are logical, so this holds in
vertical writing modes too. The pitch is the offset between two items one line
apart, which keeps `auto-fill`, container queries, and the gap authoritative in
CSS instead of duplicated in JavaScript. `rc-virtual-scroller-range` reports
`itemsPerLine`, `lineSize`, and a `measured` flag that is `false` while the
geometry is still the `item-size` estimate.

`overscan` (default `2`) is how many extra lines render past each edge.
`disabled` reports the whole collection as the range and stops measuring, which
makes an A/B against the non-virtualized cost a one-attribute change.

The element measures against the nearest scrolling ancestor. Set the
`scrollTarget` property when that ancestor only becomes scrollable after its own
upgrade, or when the real scrollport is further up the tree.

`scrollToIndex(index, { align, behavior })` scrolls an arbitrary index into
view along `axis`, including one that is not currently rendered. `align` is
`start` (the default), `center`, `end`, or `nearest`. It is accurate to the
current line pitch, so it is only as accurate as `item-size` until at least one
line has rendered.

## Accessibility

A virtualized set must still tell assistive technology how big it really is,
because the DOM no longer says so. The element does not write these for you:
the roles belong to your markup, and guessing at them would fight a container
that manages its own rows.

- For a list, put `aria-setsize` (the true `count`) and `aria-posinset` (the
  item's real index, not its position in the rendered slice) on each item.
- For a grid, use `aria-rowcount` / `aria-rowindex`, and
  `aria-colcount` / `aria-colindex` where columns are also virtualized.
- Set `aria-busy="true"` on the container while a batch is being swapped in, as
  the [WAI-ARIA APG feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/)
  describes.

The one thing the element does handle is focus. Unmounting the focused element
moves focus to `<body>` with no error and no visible cause, which is how a
keyboard user silently loses their place. The reported range is always widened
to include the focused item, contiguously, so your render stays a plain slice;
it collapses again as soon as focus moves. Scrolling a long way while holding
focus therefore renders a larger range on purpose.

The element sets `overflow-anchor: none` on itself. Browser scroll anchoring
exists to hold the reading position when content above the viewport changes
size, which is what this element does every frame, so leaving it on makes the
two fight and the scroll position drift.

Import `@rcarls/rc-virtual-scroller` to use the class without registering it, or
import `@rcarls/rc-virtual-scroller/define` to register
`<rc-virtual-scroller>`.
