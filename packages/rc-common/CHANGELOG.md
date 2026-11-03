# @rcarls/rc-common

## 0.7.0

### Minor Changes

- 9ee769c: Anchor popups in logical terms only. A placement is now `block-start`,
  `block-end`, `inline-start`, or `inline-end`, each with an optional
  `-start`/`-end` edge alignment, and all of them follow the writing mode and
  direction. Block sides open above or below a row in horizontal text and
  beside it in vertical text; inline sides open along the reading direction,
  so `inline-end` opens to the left in RTL. `resolveAnchorPlacement` exposes
  the resolution for other consumers.

  **Breaking:** the physical placements `top*`, `bottom*`, `left*`, and
  `right*` are removed from `AnchorPlacement`, `rc-menu-button`'s and
  `rc-fab-menu`'s `placement`, and the React and Solid typings. Migrate:

  - `bottom*` → `block-end*`
  - `top*` → `block-start*`
  - `right*` → `inline-end*` (in LTR)
  - `left*` → `inline-start*` (in LTR)

  Defaults move with them and render the same in horizontal LTR text:
  `rc-menu-button`, `rc-select`, and `rc-combobox` open at `block-end-start`,
  `rc-adaptive-menu`'s overflow menu at `block-end-end`, and `rc-fab-menu` at
  `block-start-end`. In vertical text these popups now open beside their
  trigger instead of over the next item. Vertical menubars and vertical
  adaptive menus open submenus at `inline-end-start`. Open popups also
  re-resolve their physical side and alignment when an ancestor's `dir`
  changes, and `rc-fab-menu` keeps its corner-aware default even when nested in
  a vertical menubar.

- 595fe37: `rc-combobox` now falls back to text registered under `rc-select`, below
  its own `rc-combobox` text, so an app no longer registers the shared keys
  twice. `resolveMessages()` and `MessagesController` take an `inherit` scope
  for the same layering in other components: within each locale the
  component's own scope wins, a more specific locale wins over its base
  language, and only keys the component has defaults for are taken.
- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- a6553ff: Batch layout sampling into a shared animation-frame read phase so mounting a
  large component route no longer alternates forced layout reads with component
  writes. Closed anchored popups now skip placement work until they open, while
  scroller boundaries, carousel positioning, flow state, and opted-in initial
  scroll observation settle before the next paint.

  Add `RafScheduler.schedulePhased()`, live `AnchorController.disabled` getters,
  and the `ScrollObserverController.initialEvaluation` timing option.

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

- 4341311: Add reusable fullscreen dialogs and declarative dialog popup mode to `rc-select` and
  `rc-combobox`. Dialog selection and creation are staged until Done, while close and Escape
  discard the draft. Fullscreen surfaces follow the visual viewport under browser zoom and
  software keyboards, and anchored popups now clamp to the visual viewport.
- 51f6403: Arrow keys follow the reading direction everywhere. `keyNavigation` now also
  flips the cross axis in RTL, so a vertical menu opens its submenu with
  ArrowLeft, as the APG describes. A horizontal menubar and segmented button
  advance with ArrowLeft in RTL, Alt+ArrowLeft moves items toward the selected
  list of a transfer list in RTL, and the arrow toward the inline start reaches
  the chips of a multiple select or combobox (ArrowRight in RTL).

  Add `inlineArrowKeys(flow)` for content that runs along the inline axis, such
  as chips or text.

- 9caca6b: Add `layoutOrientation(rendered, flow)`, the inverse of
  `renderedOrientation`, for code that can only read `aria-orientation` and
  needs the layout behind it.
- b764a3c: Observe interface locale changes through containing shadow roots and the host's own document.
  An explicit empty `lang` now means an unknown locale rather than falling back to `<html lang>`.
  Typeahead compares complete grapheme prefixes, including decomposed accents and collation
  expansions. Default interpolating messages format numeric positions in the interface locale
  while translation callbacks continue to receive numbers and can accept an optional locale.
  Default messages isolate consumer text whose direction is unknown. Textarea content direction
  uses the native LTR fallback for neutral `dir="auto"` content, recognizes Arabic Letter Mark and
  isolate controls, and reruns plugins when the native textarea's `lang` or `dir` changes.
- 54d9ead: Localize every component's built-in text. Button names, role
  descriptions, announcements, and default labels now resolve per key from
  the element's `messages` property, then from text registered with
  `registerMessages(locale, catalog)` in `@rcarls/rc-common`, then from the
  English defaults. The locale is the element's own `lang`, else
  `<html lang>`; an ancestor's `lang` is ignored, because it usually marks
  content rather than the interface. Components re-render when that locale
  changes or new text is registered. `RcMessageCatalog` types the catalog,
  and each package adds its scope to it.

  Numbers a component formats as text follow the same locale:
  `rc-progress`'s default percentage and `rc-splitter`'s `aria-valuetext`
  use `Intl.NumberFormat`. `TypeaheadController` matches prefixes with an
  `Intl.Collator`, so case and accents are ignored the way the locale
  ignores them, and takes a `locale` option. `ItemsCollectionController`'s
  `setCreateOption(text, label?)` takes the option's visible text from its
  caller.

  `rc-transfer-list`'s direction arrows are now decorative: screen readers
  read only the action name, and the arrows turn over in RTL.

  **Breaking:** chrome-text properties are replaced by `messages`. Migrate:

  - `rc-search-bar` `clear-label` / `clearLabel` → `messages.clear`
  - `rc-adaptive-menu` `overflow-label` / `overflowLabel` → `messages.overflow`
  - `rc-chip-group` `show-all-label` / `showAllLabel` and `show-less-label` /
    `showLessLabel` → `messages.showAll` and `messages.showLess`
  - `rc-select` and `rc-combobox` `dialog-confirm-label` /
    `dialogConfirmLabel` and `dialog-cancel-label` / `dialogCancelLabel` →
    `messages.done` and `messages.cancel`
  - `rc-editor-toolbar` `label` → `messages.toolbar`

  Per-instance names stay attributes, but now default to `undefined` and fall
  back to a message: `label` on `rc-adaptive-menu`, `rc-chip-group`,
  `rc-menubar`, and `rc-splitter`; `available-label` and `selected-label`
  on `rc-transfer-list`; `low-label` and `high-label` on `rc-range-slider`.
  Read the resolved name from the rendered `aria-label` instead of the
  property.

- b9175e9: Position the navigation indicator in logical coordinates, so it lands on the
  current link in RTL and in vertical writing modes instead of mirroring to
  the opposite side or swapping its width and height.

  Add `physicalOffset`, the inverse of `logicalRect`: it turns a logical
  offset from the start corner into the physical `translate` an element
  anchored at `inset-inline-start`/`inset-block-start` needs.

- 55e1e7f: Add `observeLocale(listener, host?)`, shared observers that report a `dir` or
  `lang` attribute change in the host's document and containing shadow roots,
  since the platform fires no event for either. `FlowController` and `NavigationIndicatorController`
  follow it, so the navigation bar and rail indicator stay on the current
  link when a page switches direction at runtime, and localized component
  text re-renders when a page switches language.
- f1ca82d: Add an anchored, non-modal popover package with a Material rich-tooltip recipe. Share native Popover API visibility and fallback behavior across existing popup components.
- b87f27b: Remove exports that no component uses.

  Breaking changes and migration:

  - `mouseMove` and `MouseMoveDirective` are removed. Use
    `DragGestureController`, which captures the pointer and reports deltas.
  - `delegateClickTo`, `isEventFromInteractiveDescendant`, and
    `DEFAULT_INTERACTIVE_SELECTOR` are removed. Use `ClickDelegateController`,
    which now takes the `interactiveSelector` option directly. The
    `DelegateClickOptions` and `InteractiveDescendantOptions` types are removed
    with them.
  - `getDirectChild(host, selector)` is removed. Use
    `host.querySelector(selector)`.
  - `resolveAnchorPlacement`, `PhysicalAnchorPlacement`, `isTextEntryElement`,
    and `POPOVER_FALLBACK_OPEN` are no longer exported. They remain internal to
    `AnchorController`, `SoftKeyboardViewport`, and `PopoverController`.
  - Modules no longer carry default exports, which the package entry never
    re-exported.

- 32ebead: Add writing-mode and direction aware geometry helpers.

  `resolveFlow(el)` reads an element's computed `writing-mode` and `direction`
  and reports which physical axis the inline and block axes run along, and on
  which side each starts. The other helpers translate through it:
  `getScrollOffset`/`setScrollOffset` measure scroll distance from the logical
  start (absorbing the negative `scrollLeft` of RTL and `vertical-rl` scroll
  containers), `clientSize`/`scrollSize` read sizes along a logical axis,
  `logicalRect` expresses a rect as logical offsets from its container,
  `logicalDelta` projects a pointer delta onto a logical axis, and
  `arrowKeys(orientation, flow)` maps an ARIA orientation to its next,
  previous, and cross-axis arrow keys, flipped for RTL.

  Components use these instead of comparing `direction` by hand, so RTL and
  vertical writing modes are handled the same way everywhere.

- c130173: Add pointer and keyboard reordering to `rc-list`.

  Set `reorderable` and give each item a native `<button data-rc-reorder-handle>`. People can drag
  a handle, and the items it passes shift out of the way while the nearest scroll container
  scrolls near its edges. On touch and pen, a long press on an item also starts a drag, while
  movement before activation remains available for scrolling. Or they can focus a handle and use
  Space, the block-axis arrow keys, Home, End, and Escape. Each step is announced, focus stays on
  the moved item's handle, and geometry and keys follow the writing mode. `reorderable` implies
  `ordered`.

  Each committed move fires a cancelable `rc-list-reorder` event with `{ item, from, to }`. Left
  alone, the list moves the node itself; a framework that renders the items cancels the event and
  reorders its own data. `reorderMessages` overrides the announcements and the handle hint.

  `rc-common` gains the `ReorderController` behind it and a `LiveAnnouncer` live-region helper.
  `rc-theme-material` styles the lifted item with the dragged elevation, surface, and state layer,
  animates the shifting items with standard motion, and presents plain handles as standard icon
  buttons.

- 11680b6: Expose and navigate the orientation a widget actually renders in. An
  `orientation` attribute names a layout: `horizontal` runs along the inline
  axis and `vertical` along the block axis, so both turn over in vertical
  writing modes, the way a native `<input type="range">` does. Toolbar,
  menubar, and adaptive menu now report the rendered orientation as
  `aria-orientation`, and their arrow keys follow it, so a horizontal toolbar
  in vertical text navigates with ArrowDown.

  `keyNavigation` treats an explicit `navigationAxis` and role defaults as
  layout orientations and converts them the same way; an explicit
  `aria-orientation` attribute is still used as is. Add `renderedOrientation`
  and a `FlowController` that keeps a host's writing mode and direction current
  for rendering.

  `rc-toolbar` now reflects `orientation` to its host attribute, and its
  vertical layout is keyed off that attribute rather than `aria-orientation`.

### Patch Changes

- e3dfa59: Convert anchor fallback positions, popup measurements, and viewport spacing
  between viewport and local CSS pixels under zoom.
- 50d5610: Stop anchor-positioned popups from polling layout on every animation frame while idle. Geometry
  is now checked during a bounded settling window and restarted by resize, scroll, visibility, or
  relevant element changes.
- 1179f24: Drop the `@oddbird/css-anchor-positioning` polyfill. Browsers without full
  native anchor positioning now use `AnchorController`'s script positioning,
  which applies the same placement and flip rules and re-positions when the page
  scrolls or the viewport, anchor, or floating element resizes. Those browsers no
  longer download the 41 kB polyfill the first time a popup opens.
- 38cd00c: Convert viewport measurements to local CSS pixels when reordering items,
  positioning navigation indicators, and clamping anchored popups under CSS zoom.
  Reorder previews now account for the scroll container's zoom, while anchor
  corrections settle without repeated overshoot.
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
- c8b762b: `observeLocale(listener, host)` notifies only for a `dir` or `lang` change on the host, one of its
  ancestors across shadow roots, or inside its subtree. A `lang` on unrelated content no longer
  makes every component on the page re-read its writing direction, a forced layout each, including
  components inside a `content-visibility: hidden` subtree. An optional `scope` names extra elements
  whose locale matters; `AnchorController` passes the popup and its anchor. Subscribers without a host
  still hear every change. Scoped anchors inside shadow roots are observed as well.
- bfefedd: Ship the ES module build as one file per source module behind the same
  `rc-common.js` entry, so application bundlers can place shared code in lazily
  loaded chunks instead of keeping every used export in the initial load. The
  package exports and the UMD build are unchanged.
- 223d36c: Put the default resize grip at the target's end corner, where browsers put
  the native resize grip: bottom-right in LTR, bottom-left in RTL and in
  `vertical-rl`. Keyboard resizing and the grip cursor act on the same corner,
  so ArrowLeft widens a box from its left edge in RTL. An explicit `origin`
  still selects the edge as before.
- 7b91a44: Keep `ResizeController`'s resize grip at the end corner after the page
  direction changes at runtime, and re-derive an author handle's resize
  cursor too. A writing-mode change is picked up the next time a pointer
  enters the element or the grip takes focus, since no event reports it.
- aa04ead: Preserve an element's rendered position when pinning its box inside a scrolled,
  zoomed containing block. Scroll offsets and border widths are already local CSS
  pixels, so only viewport measurements need zoom conversion.
  On browsers without `currentCSSZoom`, derive the effective zoom from computed
  styles so resize and placement stay aligned.
- ac65b5b: A pointer resize now starts only after the pointer moves 8 pixels, like Android's touch slop.
  A tap on a resize handle that is also a button, such as a bottom sheet's drag handle, stays a
  click: it no longer starts a resize, settles the sheet to its nearest snap point, and fires
  resize events before the click runs.
- afcfef8: Read snap duration custom properties as CSS times. `--rc-bottom-sheet-snap-duration` and
  `--rc-splitter-snap-duration` now accept seconds as well as milliseconds, so a theme motion
  token such as `.3s` animates for 300 ms instead of finishing in a fraction of a millisecond.
  `rc-common` exports the shared `parseCssTime` helper.
- 11ef1ad: Harden virtual scrolling for document and element scroll containers, viewport resizing,
  shadow-root focus, hidden panes, and uniform spanning grids. Separate layout
  sampling from range calculation and avoid repeating item measurements during
  unchanged scroll frames. Scroll ancestor discovery now follows slots and shadow hosts.

  Breaking: `first` and `last` are read-only computed outputs. Use `scrollToIndex()`
  for navigation and read `range` for rendering instead of assigning output values.
  Virtualization requires uniform line pitch and capacity in sequential DOM order;
  detected unsupported layouts render the full collection. Set `items-per-line`
  for ambiguous uniform grid capacity, or remove it to restore automatic inference.
  Numeric inputs now normalize invalid values and floor integer configuration.

## 0.6.0

### Minor Changes

- 6683eb9: Add shared, lifecycle-safe click delegation and let interactive list items
  forward plain surface clicks to same-root native action targets while
  preserving nested and modified clicks.

### Patch Changes

- ee7ba6c: Keep resize pinning, drag origins, and snapped bottom sheets correctly
  positioned when a layout-containing ancestor establishes a non-viewport
  containing block. Report animated snap changes only after the sheet settles so
  consumers can defer discrete content and accessibility state changes until the
  surface motion completes. Expose resize-start timing so content can be prepared
  before an interactive expansion reveals it.
- 30eb232: Add icon-only activation-area sizing and Material icon-button variants. Align menu
  selection and submenu affordances, and keep anchored popups within the viewport
  across native and fallback positioning.

## 0.5.0

### Minor Changes

- 689340c: Remove pre-1.0 deprecated APIs: the boolean `keyNavigation` option, `rc-disclosure.fragment`,
  `rc-textarea.listNumbers`, `rc-textarea.label`, and `decorationsFromHtml`.

### Patch Changes

- 4ae2ef0: Fix `ItemsCollectionController` (used by `rc-listbox`, and transitively by
  `rc-select` and `rc-combobox`) toggling an option on the first touch contact
  instead of letting a scrollable options list scroll. Touch activation now
  waits for `pointerup` within a 10px tap threshold; a larger move cancels the
  pending activation. Mouse and pen still activate on `pointerdown`.

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- ccca8e2: Add navigation bar and rail packages with shared active-indicator positioning.
- 037b1b3: Add shared drag gesture measurement and numeric snap helpers, migrate bottom
  sheet settling to the shared velocity lifecycle, and add anchored settling and
  swipe-to-collapse behavior to splitters.

### Patch Changes

- e57277f: Add Material 3 search-view, fixed-pane splitter, dialog scrim, and resize enhancements.

  `rc-search-bar` now supports `variant="view"`, controlled/default open state, search-view methods, a rich `suggestions` slot, and datalist-derived text suggestions. `rc-splitter` adds `mode="fixed"` for clampable pixel primary panes. `rc-common` now honors CSS max-size constraints during resize gestures, and `rc-dialog` exposes a scrim token plus resize handle/origin hooks used by themed surfaces.

## 0.3.2

### Patch Changes

- 88b4086: Fix Firefox for Android bug: `<label>`-wrapped multiple selects [Bugzilla 1475723](https://bugzilla.mozilla.org/show_bug.cgi?id=1475723)

## 0.3.1

## 0.3.0

### Breaking

- Remove `useInteractionModeAttr` from `KeyNavigationOptions`; use `keyInteraction` with `keyNavigation` when keyboard interaction state is needed.

### Added

- Add native-child, observer, animation-frame, typeahead, and scroll-ancestor utilities.
- Add typed listbox action option helpers and `ItemsCollectionController`.
- Add `KeyboardInteractionDirective` with `keyInteraction` and `KeyInteractionOptions` exports.

### Changed

- Add separator-role keyboard support and large-step arrow actions to keyboard navigation.
- Update package metadata, README intro, and docs links.

### Migration

- Pair `keyInteraction` with `keyNavigation` anywhere downstream code previously relied on `useInteractionModeAttr`.

## 0.2.0
