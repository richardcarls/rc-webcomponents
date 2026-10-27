# @rcarls/rc-bottom-sheet

## 0.7.0

### Minor Changes

- f31cca3: Add `--rc-bottom-sheet-handle-offset` to position the handle indicator within its target. It
  defaults to `50%`, which keeps the indicator centered. Set a length to keep the indicator in its
  own row at the top of a handle that also holds the sheet's title.
- ec6ebc6: Load dialog move and resize behavior on demand. `rc-dialog` now imports its
  drag and resize controllers only the first time `movable`, `move-handle`, or
  `resize` enables them, so dialogs that never move or resize, including the
  popups inside `rc-select`, `rc-combobox`, and `rc-markdown-editor`, no longer
  ship that code. The new `@rcarls/rc-dialog/geometry` entry exports
  `DialogGeometry` for subclasses that always resize; `rc-bottom-sheet` uses it,
  so its resize stays available immediately.

  Breaking changes and migration:

  - `rc-dialog` and `rc-bottom-sheet` remove `light-dismiss` / `lightDismiss`.
    Use `closed-by="any"`, which closes on Escape or a backdrop click and now
    falls back to a backdrop click listener where the browser has no native
    `closedby`.
  - `rc-bottom-sheet` now defaults `closed-by` to `any` instead of defaulting
    `light-dismiss` to true. Set `closed-by="closerequest"` to keep backdrop
    clicks from closing a sheet, or `closed-by="none"` to allow only explicit
    actions.

- 57338f5: `rc-dialog`, `rc-bottom-sheet`, and `rc-snackbar` now fade in and out through
  CSS alone, using `@starting-style` and a discrete `display`/`overlay`
  transition, driven by the shared `--rc-motion-effects-*` tokens (and
  `--rc-motion-spatial-*` for `rc-snackbar`'s slide). `showModal()`/`show()`/
  `close()` all stay synchronous, and nothing in any of the three components
  waits on the transition finishing, so a zero-duration theme or a browser
  without support for the CSS involved both degrade to an instant, fully
  correct open and close.

  `rc-dialog` and `rc-bottom-sheet` animate opacity only, not a scale or slide
  transform: both support pointer resize and read `getBoundingClientRect()` to
  compute drag deltas, and a transform is a visual effect that
  `getBoundingClientRect()` reports for as long as it's still animating,
  corrupting that measurement if a resize or drag starts during the entrance.
  `rc-snackbar` has no such feature, so it fades and slides up from the
  block-end edge it's anchored to.

### Patch Changes

- 06f195f: Resolve `snap-points` inside the sheet when each snap applies. Entries may use `calc()` and
  `var()`, including values with inner spaces, and custom properties inherited by the sheet are
  read at their current value, so a page can drive a snap point from an animated property such
  as a scroll-linked peek height.
- 12f443f: Keep `rc-bottom-sheet` docked at its block-end edge. Snapping now sets only
  the sheet's height and leaves its position to CSS, releasing the edge pins a
  drag gesture leaves inline. A viewport resize, such as a software keyboard
  opening under `interactive-widget=resizes-content`, or a containing block that
  moves after a snap no longer strands the sheet off-screen. A field that takes
  focus inside the sheet is scrolled into view within the sheet, and the sheet
  grows past its snap height and maximum block size only when scrolling cannot
  reveal the field, returning to its snap point when focus leaves. A drag now
  interrupts a running snap animation instead of being overridden by it.
- e232e9d: A `snapTo()` call made before the sheet's inner `<dialog>` is attached, as
  from a framework ref callback, now applies when the sheet opens instead of
  being dropped, so a sheet rendered open starts at the requested snap point.
- d3a91dc: Convert focus reveal distances into nested scroll container CSS pixels under
  CSS zoom so focused fields remain visible without growing the sheet.
- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- 8cbc627: A non-modal dialog or sheet that is already open when it connects, through `open` or
  `default-open`, no longer takes focus from the page: native `show()` focuses the first control,
  so a standard bottom sheet rendered open with a page stole focus as soon as its content existed.
  Opening one later with `show()` still moves focus into it.
- 899bb5e: Make `rc-dialog` move and resize options reactive. Toggling `movable`,
  changing `resize`, or changing any other `move-*` or `resize-*` option after
  setup now rebuilds that behavior, so `resize="none"` turns resizing off on a
  mounted `rc-dialog` or `rc-bottom-sheet` and a later value turns it back on.
  Re-wiring the inner `<dialog>` no longer leaves stale move or resize
  controllers attached. `DragController`, `ResizeController`, and
  `DragGestureController` gain `dispose()`. Detaching a handle restores its
  focusability and inline resize styles when they still have controller-written
  values, while preserving later author edits. Active gestures cancel
  and release pointer capture when their controller is removed. `rc-fab` uses
  the new `ScrollObserverController.dispose()` for its optional scroll fallback.
- 25fcfe0: Dialogs, sheets, and their drag and resize gestures now keep their geometry under an
  ancestor's CSS `zoom`, such as an app-wide interface size set on the root. Measured boxes and
  pointer positions are viewport pixels, while a length written to an element's style is zoomed
  again, so a full-screen dialog fell short of or overflowed the viewport, a dragged bottom sheet
  lifted off its docked edge, and each snap shrank or grew the sheet. Positions and sizes are now
  converted to the element's own pixels through a new `cssZoom()` helper in `@rcarls/rc-common`.
  `rc-bottom-sheet-snap` reports `height` in the sheet's own pixels, the unit of its snap points.
- 75f1dbd: Read an ancestor CSS zoom from the inner `<dialog>` rather than the host, so a
  host styled `display: contents`, which reports no zoom, still covers the
  viewport as a fullscreen dialog and resolves percentage snap points
  correctly under an app-wide interface size.
- ac65b5b: A pointer resize now starts only after the pointer moves 8 pixels, like Android's touch slop.
  A tap on a resize handle that is also a button, such as a bottom sheet's drag handle, stays a
  click: it no longer starts a resize, settles the sheet to its nearest snap point, and fires
  resize events before the click runs.
- afcfef8: Read snap duration custom properties as CSS times. `--rc-bottom-sheet-snap-duration` and
  `--rc-splitter-snap-duration` now accept seconds as well as milliseconds, so a theme motion
  token such as `.3s` animates for 300 ms instead of finishing in a fraction of a millisecond.
  `rc-common` exports the shared `parseCssTime` helper.
- Updated dependencies [e3dfa59]
- Updated dependencies [50d5610]
- Updated dependencies [9ee769c]
- Updated dependencies [1179f24]
- Updated dependencies [595fe37]
- Updated dependencies [38cd00c]
- Updated dependencies [5c006de]
- Updated dependencies [a6553ff]
- Updated dependencies [8300209]
- Updated dependencies [2205478]
- Updated dependencies [8cbc627]
- Updated dependencies [ec6ebc6]
- Updated dependencies [4341311]
- Updated dependencies [899bb5e]
- Updated dependencies [5a7a1dd]
- Updated dependencies [2c7c80a]
- Updated dependencies [25fcfe0]
- Updated dependencies [75f1dbd]
- Updated dependencies [0de2332]
- Updated dependencies [51f6403]
- Updated dependencies [9caca6b]
- Updated dependencies [b764a3c]
- Updated dependencies [54d9ead]
- Updated dependencies [57338f5]
- Updated dependencies [b9175e9]
- Updated dependencies [c8b762b]
- Updated dependencies [55e1e7f]
- Updated dependencies [f1ca82d]
- Updated dependencies [b87f27b]
- Updated dependencies [32ebead]
- Updated dependencies [bfefedd]
- Updated dependencies [c130173]
- Updated dependencies [11680b6]
- Updated dependencies [223d36c]
- Updated dependencies [7b91a44]
- Updated dependencies [aa04ead]
- Updated dependencies [ac65b5b]
- Updated dependencies [afcfef8]
- Updated dependencies [11ef1ad]
  - @rcarls/rc-common@0.7.0
  - @rcarls/rc-dialog@0.7.0

## 0.6.0

### Patch Changes

- ee7ba6c: Keep resize pinning, drag origins, and snapped bottom sheets correctly
  positioned when a layout-containing ancestor establishes a non-viewport
  containing block. Report animated snap changes only after the sheet settles so
  consumers can defer discrete content and accessibility state changes until the
  surface motion completes. Expose resize-start timing so content can be prepared
  before an interactive expansion reveals it.
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
- Updated dependencies [57370e4]
  - @rcarls/rc-common@0.6.0
  - @rcarls/rc-dialog@0.6.0

## 0.5.0

### Patch Changes

- ba65db7: Fix an edge case left in the 0.4.2 resize-repin fix: the window-resize re-pin re-measured
  via `getBoundingClientRect()` on the box that was still carrying its _previous_ inline pin,
  so a fixed (non-`dvh`) snap point (for example a `132px` peek height, common for a
  persistent summary sheet) computed the exact same, now-stale target, since neither the
  requested height nor the stale box's edges had changed. Only `dvh`-based snap points were
  actually re-deriving correctly. Now clears the previous `top`/`height` pin before
  re-measuring on resize, so the dialog reverts to its CSS-driven (`inset-block-end`-anchored)
  position first, the same as a sheet that has never been pinned. Added a regression test
  covering this specific case (confirmed it fails without the fix).
- Updated dependencies [4ae2ef0]
- Updated dependencies [689340c]
  - @rcarls/rc-common@0.5.0
  - @rcarls/rc-dialog@0.5.0

## 0.4.2

### Patch Changes

- 5178dcc: Fix `rc-bottom-sheet` snapping to stale geometry after a viewport resize (for example a
  browser window maximize/restore) while open. Snap-point heights are resolved against the
  current viewport at the moment a snap is applied, then frozen as inline `top`/`height`
  styles; nothing re-derived them after that, so a resize with no drag or `snapTo()` call
  in between left the sheet pinned to pre-resize pixel geometry. Now listens for `resize`
  while open and re-applies the last-snapped index against fresh geometry.

  Also stops pinning the inline axis (`left`/`width`) at all: only `top`/`height` are ever
  read again after the initial pin, and freezing the inline axis as an inline style
  permanently overrides any external stylesheet's `inset-inline`/`inline-size` confinement
  (for example a host page confining a sheet to a layout pane narrower than the viewport)
  regardless of specificity, since inline styles always win that cascade. `rc-bottom-sheet`'s
  own `LIGHT_DOM_CSS` already deliberately leaves the inline axis CSS-owned; the pin just
  wasn't honoring that.
  - @rcarls/rc-common@0.4.2
  - @rcarls/rc-dialog@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1
- @rcarls/rc-dialog@0.4.1

## 0.4.0

### Minor Changes

- 48cf73f: Add the rc-bottom-sheet package as a dialog-backed modal bottom-sheet surface.
- 037b1b3: Add shared drag gesture measurement and numeric snap helpers, migrate bottom
  sheet settling to the shared velocity lifecycle, and add anchored settling and
  swipe-to-collapse behavior to splitters.
- c40a1be: Add theme-neutral fast, default, and slow effects and spatial motion token
  pairs. Expose bottom-sheet settle easing through
  `--rc-bottom-sheet-snap-easing` and map sheet settling to the Material spatial
  motion scheme.

  Give direct-child bottom-sheet handles a full-width 48px interaction target
  while preserving the 32 by 4 pixel visual indicator. Replace rectangular
  mobile browser tap highlights on chips with themeable, shape-clipped state
  layers. Keep bottom-sheet snap targets docked to the block-end edge when CSS
  minimum or maximum sizing constrains their requested heights.

  Mount declaratively assigned textarea plugins at connection time and remount
  them after reconnection, preserving plugin effects and adopted styles in
  framework render lifecycles.

### Patch Changes

- ebec800: Dock bottom sheets without a theme to the viewport block-end by default and
  support absolute positioning for non-modal sheets contained by a positioned ancestor.
  Center authored drag handles with a splitter-aligned pill treatment. Align the
  Material theme with its surface, elevation, scrim, drag-handle, and contextual
  button treatment.
- Updated dependencies [e57277f]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
  - @rcarls/rc-dialog@0.4.0
  - @rcarls/rc-common@0.4.0
