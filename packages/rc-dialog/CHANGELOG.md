# @rcarls/rc-dialog

## 0.7.0

### Minor Changes

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

- 4341311: Add reusable fullscreen dialogs and declarative dialog popup mode to `rc-select` and
  `rc-combobox`. Dialog selection and creation are staged until Done, while close and Escape
  discard the draft. Fullscreen surfaces follow the visual viewport under browser zoom and
  software keyboards, and anchored popups now clamp to the visual viewport.
- 5a7a1dd: `rc-dialog` gains `variant="side"`, a modal side sheet. The surface docks to the inline end at
  full block size, pads every edge for the physical safe-area insets, and rounds only its start
  corners. Like the fullscreen variant, it never moves or resizes. Theme it with
  `--rc-dialog-side-inline-size`, `--rc-dialog-side-background`, `--rc-dialog-side-radius`, and
  `--rc-dialog-side-shadow`. A landscape phone can now show a sheet's content beside the page
  instead of in a bottom sheet that leaves only a strip of content visible.

  A theme or consumer can now set a standard dialog's preferred width through
  `--rc-dialog-inline-size`, which defaults to `fit-content`. Set it to `100%` for a dialog with
  fluid content, such as a search field or a list, which otherwise shrinks to its minimum width.

  The Material theme maps the side sheet to Material 3: `surface-container-low`, large leading
  corners, and level 1 elevation. Its design guide documents side sheets, task dialog sizing, and
  full-screen dialogs when the window is compact in either dimension. The React and Solid typings
  accept the new variant.

- 2c7c80a: Give `rc-dialog` a surface styling contract.

  It exposed only `--rc-dialog-scrim`, so both themes drew the surface by selecting the native
  `<dialog>` directly. It now installs a light-DOM base stylesheet, the same pattern as `rc-button`
  and `rc-disclosure`, and exposes minimum and maximum inline and block bounds, padding, border, radius, background,
  foreground, and shadow, plus fullscreen-specific padding and background for the two values that
  variant genuinely needs of its own.

  Fullscreen geometry, meaning position, size, margin, radius, and shadow, stays structural rather
  than something a theme sets: filling the visual viewport is what keeps the surface correct under browser zoom
  and a software keyboard.

  Material's explicit block bound with `overflow: hidden` moved into the base layer rather than
  staying a theme value. It exists because Chromium does not reliably clip a scrolling element's
  own border radius at the scroll boundary, which is a correctness fix every theme needs.

  `--rc-dialog-visual-viewport-left`, `-top`, `-width`, and `-height` are no longer documented as
  theme properties. They are geometry the component writes while a fullscreen dialog is open:
  readable if something inside the dialog needs the same measurements, but setting them does not
  move the dialog. They are candidates for private `--_rc-dialog-*` names in a future revision.

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

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- 8300209: Cap a fullscreen dialog's tracked size at the viewport, so a size left
  over from before a rotation can't overflow the page. On Firefox for
  Android that overflow widened the layout viewport and left the page
  zoomed in after the dialog closed.
- 2205478: Keep a fullscreen `rc-dialog` from shrinking for a moment when a software
  keyboard closes. Firefox for Android reports a viewport shorter than the
  keyboard-open one for a few frames on the way back to full height; while the
  keyboard closes, the surface now takes only growth until the full height
  returns, a text field takes focus again, the width changes, or a one-second
  backstop passes.

  `rc-common` adds `SoftKeyboardViewport`, which applies that filtering to any
  viewport measurement and can instead hold the keyboard-free height for window
  size classes, along with the `deepActiveElement`, `isTextEntryElement`, and
  `isTextEntryFocused` helpers it uses.

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
- 0de2332: Size fullscreen dialogs correctly under ancestor CSS zoom in browsers without
  `currentCSSZoom`. The Substrate dialog entrance now fades without scaling the
  surface, so resizing during the transition reads stable geometry.
- 223d36c: Put the default resize grip at the target's end corner, where browsers put
  the native resize grip: bottom-right in LTR, bottom-left in RTL and in
  `vertical-rl`. Keyboard resizing and the grip cursor act on the same corner,
  so ArrowLeft widens a box from its left edge in RTL. An explicit `origin`
  still selects the edge as before.
- 7b91a44: Keep `ResizeController`'s resize grip at the end corner after the page
  direction changes at runtime, and re-derive an author handle's resize
  cursor too. A writing-mode change is picked up the next time a pointer
  enters the element or the grip takes focus, since no event reports it.
- ac65b5b: A pointer resize now starts only after the pointer moves 8 pixels, like Android's touch slop.
  A tap on a resize handle that is also a button, such as a bottom sheet's drag handle, stays a
  click: it no longer starts a resize, settles the sheet to its nearest snap point, and fires
  resize events before the click runs.
- Updated dependencies [e3dfa59]
- Updated dependencies [50d5610]
- Updated dependencies [9ee769c]
- Updated dependencies [1179f24]
- Updated dependencies [595fe37]
- Updated dependencies [38cd00c]
- Updated dependencies [5c006de]
- Updated dependencies [a6553ff]
- Updated dependencies [2205478]
- Updated dependencies [4341311]
- Updated dependencies [899bb5e]
- Updated dependencies [25fcfe0]
- Updated dependencies [51f6403]
- Updated dependencies [9caca6b]
- Updated dependencies [b764a3c]
- Updated dependencies [54d9ead]
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

## 0.6.0

### Patch Changes

- 57370e4: Align component metadata, aggregate framework typings, development-time native-child
  validation, controlled menu state, package declarations, and public documentation before the
  next release.
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [4ae2ef0]
- Updated dependencies [689340c]
  - @rcarls/rc-common@0.5.0

## 0.4.2

### Patch Changes

- @rcarls/rc-common@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1

## 0.4.0

### Minor Changes

- e57277f: Add Material 3 search-view, fixed-pane splitter, dialog scrim, and resize enhancements.

  `rc-search-bar` now supports `variant="view"`, controlled/default open state, search-view methods, a rich `suggestions` slot, and datalist-derived text suggestions. `rc-splitter` adds `mode="fixed"` for clampable pixel primary panes. `rc-common` now honors CSS max-size constraints during resize gestures, and `rc-dialog` exposes a scrim token plus resize handle/origin hooks used by themed surfaces.

### Patch Changes

- Updated dependencies [e57277f]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
  - @rcarls/rc-common@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [88b4086]
  - @rcarls/rc-common@0.3.2

## 0.3.1

### Patch Changes

- @rcarls/rc-common@0.3.1

## 0.3.0

### Added

- Add non-modal `show()` support and the `modal` property for controlled open behavior.
- Add `rc-dialog-open` and `rc-dialog-toggle` events.

### Changed

- Warn in development when the inner `<dialog>` has no enabled button.
- Update package metadata, README intro, and docs links.

### Fixed

- Restore focus to `document.body` when the opener is removed while the dialog is open.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
