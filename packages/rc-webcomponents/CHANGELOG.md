# @rcarls/rc-webcomponents

## 0.7.0

### Minor Changes

- d0ad1e1: Add a per-component subpath for every component in the aggregate package.

  Registering elements from `@rcarls/rc-webcomponents` was previously
  all-or-nothing: the only side-effectful entry was `./define`, which imports all
  37 components, so an app using three of them still paid for the collection.
  Anyone who wanted tree-shaking had to install the standalone packages instead,
  trading one dependency for 37.

  Each component now has its own subpath (`@rcarls/rc-webcomponents/rc-button`
  for the classes, `@rcarls/rc-webcomponents/rc-button/define` to register the
  element), mirroring the `.` and `./define` pair each standalone package already
  exposes. The subpath is the package name, so migrating between the two spellings
  is a prefix swap, and the generated entries are re-exports rather than copies:
  importing `@rcarls/rc-webcomponents/rc-button/define` produces a byte-identical
  bundle to importing `@rcarls/rc-button/define`, 11.7 kB compressed against
  192 kB for the collection-wide `./define`.

  Installing the aggregate and installing individual packages now cost the same
  bundle bytes, so the choice is about dependency management rather than size.
  `./define` still registers everything for apps that want it.

- 8d6edf2: With `scroll-behavior="hide"`, `rc-app-bar` now publishes read-only geometry onto its scroll
  target: `--rc-app-bar-block-size`, its measured block size, and
  `--rc-app-bar-visible-block-size`, the same value or `0px` while hidden. Hiding only translates
  the bar, so a layout can now give its space back: stack the bar over the scroll container,
  reserve the block size as the container's block-start padding and scroll padding, and pin
  sticky content at the visible size minus the block size, since sticky offsets are measured
  inside that padding. The bar removes both values when it stops hiding, changes
  target, or disconnects.

  The Material design guide documents this recipe and the compact-height patterns for landscape
  phones: app bars that hide on scroll, side sheets instead of modal bottom sheets, full-screen
  task dialogs, media capped by the pane's height, and single-row sticky chips.

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

- 19278d4: Group several native controls into one `rc-field` with a direct `<fieldset>`. Its `<legend>` names
  the group and shows as the field label, each control keeps its own accessible name, and supporting
  text describes the fieldset. The first text-like input or textarea is the primary control behind
  `control`, `focus()`, and `data-populated`; focus moving between grouped controls keeps the field
  focused; and `data-disabled`, `data-required`, and `data-invalid` reflect the whole group. New
  read-only `group` and `controls` properties and a `data-group` host attribute support the mode.

  The primary control grows and other controls attach before or after it. In Material, the legend uses
  the floating label mechanics: it rests on the input line while the group is idle and its primary
  input empty, and floats on focus or once that input has a value; a group with a control before its
  primary input keeps it floated. Grouped placeholders wait for focus. Substrate colors an invalid
  group's legend, and Win31 spaces it like a single field's label.

- 6ec0857: Add `ordered` to `rc-list`. Visible items in an ordered list receive `aria-posinset` and
  `aria-setsize` so assistive technology reports their position; no counters render, and authored
  positions from a rendered slice of a longer list are kept.

  Add an expandable `details` region to `rc-list-item`. A button marked
  `data-rc-list-item-toggle` toggles it; the item wires `aria-expanded`, `aria-controls`, and the
  region's `hidden` state, supports controlled `expanded` and uncontrolled `default-expanded`
  state, and fires `rc-list-item-toggle`. Material styles the region as list supporting text.

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

- 873592e: Add four directional motion tokens to the shared base contract:
  `--rc-motion-effects-easing-enter`/`-exit` and
  `--rc-motion-spatial-easing-enter`/`-exit`. An opening element decelerates
  into place; a closing one accelerates out. There are no matching enter/exit
  duration tokens; pair `-easing-exit` with an existing `-duration-fast` token
  instead.

  All three themes map the new tokens: Material pairs them with its
  standard/emphasized decelerate and accelerate curves, Substrate keeps its one
  curve as the enter curve and adds a generic accelerate shape for exit
  (refined further once Substrate gets its own full spatial/effects scale), and
  `rc-theme-win31` declares all four as `step-end`, matching its zero-motion
  contract, so an application that loads the shared base tokens alongside
  `rc-theme-win31` does not inherit the base defaults' real easing curves for
  these two directions.

- f1ca82d: Add an anchored, non-modal popover package with a Material rich-tooltip recipe. Share native Popover API visibility and fallback behavior across existing popup components.
- 687a9be: Add shared popup surface tokens: `--rc-popup-background`, `--rc-popup-color`,
  `--rc-popup-border`, `--rc-popup-radius`, `--rc-popup-shadow`, and
  `--rc-popup-padding-block`. Menus, adaptive-menu popups, and select and
  combobox listboxes read them before their own fallbacks. Themes set them at the
  theme root, so popups rendered inside other shadow roots keep the theme's
  surface. Select and combobox add `--rc-*-listbox-background` and
  `--rc-*-listbox-color`.

  Breaking: popup surfaces no longer fall back to `--rc-control-radius`. Set
  `--rc-popup-radius` (or the per-component radius token) to change popup
  corners. The Material, Substrate, and Win31 themes no longer set per-component
  popup surface tokens such as `--rc-menu-radius` or
  `--rc-adaptive-menu-popup-background`; override the `--rc-popup-*` tokens
  instead. Material select and combobox listboxes now use the menu container
  color, Material forced-colors popups gain a border, and Substrate listboxes use
  the menu shadow and padding. Material retains its two-layer adaptive-menu popup
  shadow through a component token while other popups continue using the shared
  shadow.

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

- aed2034: Add `rc-virtual-scroller`, a headless virtualization wrapper.

  Mounting a large collection as custom elements costs real time regardless of
  `content-visibility: auto`: upgrade happens at parse and insertion, before
  style resolves, so containment cannot prevent element construction. This
  package stops the count of mounted elements from scaling with collection
  size, without taking over rendering.

  The element measures geometry against a slotted container and dispatches
  `rc-virtual-scroller-range` with the visible `[start, end)` index range; the
  consumer renders that slice into its own container with whatever it already
  uses, and two spacer parts reserve the off-range scroll space. Items per line
  and line pitch are measured from the container's own grid tracks rather than
  configured, so `auto-fill` and container queries stay authoritative. The
  focused item is never dropped from the reported range, so scrolling never
  silently resets keyboard focus to `<body>`.

  `axis="block|inline"` is logical: `block` windows stacked lines, `inline`
  windows a row of items such as a horizontal shelf. Direction and writing mode
  are read from computed style, so RTL pages and vertical text work without
  configuration.

- 6d126fd: Add shared item type tokens: `--rc-item-font-family`, `--rc-item-font-size`,
  `--rc-item-font-weight`, `--rc-item-line-height`, `--rc-item-letter-spacing`,
  and `--rc-item-icon-size`. Menu, listbox, and adaptive-menu items read them.
  Adaptive menu adds `--rc-adaptive-menu-trigger-hover-background`,
  `--rc-adaptive-menu-trigger-shadow`, and
  `--rc-adaptive-menu-trigger-active-shadow`, and styles overflowed `rc-button`
  and `rc-menu-button` rows from its item tokens. Themes declare their menu,
  adaptive-menu, and item tokens on the theme root, so menus inside other shadow
  roots match menus in the document. Substrate's adaptive-menu trigger now shows
  its hover background.

  Breaking: theme menu and adaptive-menu tokens are inherited from the theme root
  instead of set on each element, so a value set on an ancestor now reaches
  nested menus. Material sets menu, listbox, and adaptive-menu item type through
  `--rc-item-*` instead of per-component rules; override those tokens to change
  item type. Themes no longer style the adaptive-menu trigger through
  `::part(overflow-trigger)` hover and pressed rules; use the new trigger tokens.

- e23a39c: Add an accessible native input and textarea field wrapper with Material 3 filled and outlined
  theme treatments, including an explicit provider contract for enhanced native controls.
- 905083b: Give `rc-textarea` a content language and direction separate from its
  interface. The slotted `<textarea>` describes the text: its `lang` and
  `spellcheck` are mirrored onto the editor, so the browser picks the right
  glyphs and spelling dictionary, and its `dir` sets the editor's base
  direction. `dir="auto"` resolves from the value's first strong character,
  uses LTR when there is none (matching native HTML), and updates as the value changes.
  Without `dir`, the editor inherits as before. The host's own `lang` stays
  the interface language.

  A new `line-direction` attribute (`lineDirection` property) chooses how
  each line's direction is set. `base`, the default, keeps every line in the
  editor's direction. `auto` orders and aligns each line with a letter by its
  own first strong character, for prose that mixes scripts, and holds lines
  without one (empty lines, quantities) to the base direction. Widgets and
  line messages are now bidi-isolated, so they never reorder neighboring
  text.

  Changes to the native textarea's `lang` or `dir` rerun plugin rendering.
  The plugin API adds `contentDirection`, `contentLang` and
  `lineDirection(line)`. The React and Solid typings add `lineDirection` and
  `line-direction`.

  **Breaking:**

  - Line numbers are formatted with `Intl.NumberFormat` for the interface
    locale (the host's `lang`, else `<html lang>`), so an `ar-EG` interface
    shows Arabic-Indic digits. Set `lang="ar-EG-u-nu-latn"`, or another
    `-u-nu-latn` tag, on the host to keep Latin digits.
  - `getWordAtCursor()` segments words with `Intl.Segmenter` for the
    textarea's `lang` instead of matching ASCII `\w`. Accented and non-Latin
    words are now found whole, and `don't` and `3.14` are one word each;
    `snake_case` still is. Without `Intl.Segmenter` it scans letters, digits
    and `_`.

- 6b99ced: **Breaking:** replace `LineDisclosureController` with `FoldingActionController`.
  Pass a caller-owned panel as `target` and render it through a block widget, or pass
  `{ fromLine, toLine }` to fold source lines. Panel creation and content revision now
  belong to the plugin. Set `initiallyExpanded: false` to retain the old diagnostic
  panel default; call `clear()` when document identity changes.

  Folding actions keep source text, form values, and undo history intact. The Markdown
  plugin adds gutter folds for heading sections, lists, code blocks, block quotes,
  and GFM tables. The base gutter has a 24px minimum width; Material uses 48px.
  Folding buttons expose `fold-trigger` and `fold-icon` CSS parts, and
  `createMarkdownPlugin({ folding: { createTriggerIcon } })` lets consumers choose
  the Markdown fold icon.

- 3325191: **Breaking:** take `rc-textarea`'s read-only state from the slotted `<textarea readonly>` and
  remove the `read-only` attribute and its display styling without border or padding. A read-only
  editor keeps the enabled field appearance, stays focusable and selectable, announces `aria-
readonly` with the native control's label, and rejects edits. The host reflects `data-readonly`,
  and `readOnly` is now a getter. The plugin `transform()` hook runs while the textarea is
  `readonly`.

  `rc-markdown-editor` passes its `read-only` state to a native textarea in its source editor.
  Material and Substrate fields skip the hover affordance for a read-only control and keep its
  focus indicator.

  Migration: replace `<rc-textarea read-only>` with `readonly` on the slotted textarea, for
  example `<rc-textarea><textarea aria-label="Notes" readonly></textarea></rc-textarea>`. Replace
  `editor.readOnly = value` with `textarea.readOnly = value`. Read-only content that is not a form
  value belongs in ordinary text or list markup instead.

- 0e2d878: **Breaking:** replace `--rc-textarea-padding` with `--rc-textarea-padding-block` and
  `--rc-textarea-padding-inline`. The active line highlight bleeds through the inline padding by
  negating it, which a multi-value shorthand made invalid: inside a Material filled `rc-field`
  (`0 1rem 0.5rem`) the highlight stopped short of the field's edges in the editor and gutter.
  `--rc-textarea-padding-inline` is one length applied to both inline sides, so the bleed stays
  valid and follows RTL and vertical writing modes through logical insets.
  `--rc-textarea-padding-block` accepts any `padding-block` value.

  Migration: split each `--rc-textarea-padding` declaration. A single length `L` becomes
  `--rc-textarea-padding-block: L; --rc-textarea-padding-inline: L`. A shorthand
  `T X B` becomes `--rc-textarea-padding-block: T B; --rc-textarea-padding-inline: X`.

- fb747f6: Declare `rc-base` before each theme's own layers. Components inject their structural
  light-DOM CSS into `rc-base` at runtime, after the theme has loaded, which made it the last
  and strongest layer on pages that don't declare their own order, so it could override theme
  rules. Theme rules now win either way. Apps that declare their own layer order should list
  `rc-base` before the theme layers.

  Add a fourth theme layer, `rc-theme-*.overrides`, after `.components`. Each theme uses it to
  keep `rc-adaptive-menu` overflow rows on the menu's item tokens. Theme button and menu-button
  variants, such as Material's icon-only sizing and filled colors or Win31's bevelled native
  buttons, no longer restyle an overflowed action as a standalone control. A demoted
  icon-only `rc-menu-button` keeps its row padding and indicator inset.

- 877a03f: Add a scoped type scale. An element with `data-rc-type-scale` multiplies every Material
  type size and line height beneath it by `--rc-type-scale`, and derives the RC text
  tokens built on them (`--rc-item-font-size`, `--rc-font-size`, `--rc-button-font`, and
  related line heights) again from the scaled values, so lists, buttons, menus, and plain
  text in the region grow together.

  Marking the theme root itself scales the whole page, for an app-wide text size setting.
  With `bridge.css` alone, RC text scales from the application's Material type tokens;
  the application's Material tokens remain unchanged.

### Patch Changes

- aee912a: Single-open accordions now close a sibling `rc-disclosure` through its native `<details>`
  instead of its `open` property. Writing the property switched the disclosure into
  controlled mode, so a panel the accordion had closed would not reopen from its summary.
  A controlled sibling now receives the close as an `rc-disclosure-toggle` request and
  keeps the state its owner sets.

  The Solid JSX types now declare `rc-disclosure`'s `default-open` attribute and its
  `open` and `defaultOpen` properties.

- 51aac05: `rc-adaptive-menu` no longer throws when actions are added while its first render is still
  pending. The action observer tried to give the overflow trigger a tab stop before the shadow
  tree existed; changes before the first render are now left to the initial sync.
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

- 6f1df83: A bar with `scroll-behavior="hide"` now hides or reveals only after its scroll target travels
  `hide-distance` (32px by default) in one direction. It used to reveal on any upward scroll, so a
  1px reversal while reading or as a fling settled brought it back. Near the top it still always
  shows. A hidden bar reveals itself when focus moves into it and stays visible until focus leaves.
- 12f443f: Keep `rc-bottom-sheet` docked at its block-end edge. Snapping now sets only
  the sheet's height and leaves its position to CSS, releasing the edge pins a
  drag gesture leaves inline. A viewport resize, such as a software keyboard
  opening under `interactive-widget=resizes-content`, or a containing block that
  moves after a snap no longer strands the sheet off-screen. A field that takes
  focus inside the sheet is scrolled into view within the sheet, and the sheet
  grows past its snap height and maximum block size only when scrolling cannot
  reveal the field, returning to its snap point when focus leaves. A drag now
  interrupts a running snap animation instead of being overridden by it.
- 9f590f2: Keep a labeled button at least as wide as its label in content-sized layouts.
  The slotted button clipped its content with `overflow: hidden`, which made it
  a scroll container with a zero automatic minimum size, so a min-content table
  column or an auto grid track could squeeze it narrower than its label. It now
  clips with `overflow: clip`, which looks the same but keeps the label's width
  as the button's minimum.
- 9720b36: Keep a just-selected chip in view when chips resize after the selection. An app that moves a
  filter chip's check mark a frame later first shortens the row, which clamps the scroll offset,
  and then widens the selected chip past the row's end. The group now reveals that chip again
  after later resizes, until the user scrolls the row themselves.
- 2934328: `rc-chip-group` measures its rows once when it first lays out, not twice. Its resize observer's
  first report of each chip no longer schedules another when it matches the first measurement;
  a changed size still triggers another row measurement.
  A collapsed row at its start is no longer scrolled back into place after each measurement,
  which saves a forced layout.
- 3d050f1: Keep wrapped chip rows evenly spaced. Readonly chips in an `rc-chip-group`
  keep the touch-target block size, so expanded rows share the disclosure
  toggle's pitch. `rc-combobox` and `rc-select` return the chip touch-target
  overlap tokens as row gap, so interior chip rows no longer collapse onto each
  other inside a field. Material combobox and select input chips drop their
  extra block padding to render at the 2rem chip height.
- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- 011f3c6: Keep combobox chips clear of their trailing toggle, reset native selects inside
  `rc-field`, keep controlled carousel accessibility state synchronized, and align
  Material chips, menus, lists, disclosures, nested editors, and bottom-sheet
  motion with their MD3 defaults.
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
- f2fdbcc: The React JSX declarations now include `rc-disclosure`'s `default-open` attribute and
  `rc-disclosure-toggle` event. React and Solid ref types accept `undefined` when releasing
  control of the `open` property.
- 2d79bd0: Name the `position` corners for what they already do: each pins to a
  logical block and inline edge, so they turn with the writing mode.

  **Breaking:** the `position` values are renamed. Migrate:

  - `bottom-end` → `block-end-inline-end` (the default)
  - `bottom-start` → `block-end-inline-start`
  - `top-end` → `block-start-inline-end`
  - `top-start` → `block-start-inline-start`

- d50f18c: The open `rc-fab-menu` popup no longer draws the browser's default popover border, padding,
  and background around its menu. Its styles replace `rc-menu-button`'s instead of extending
  them, so the popup now resets those defaults itself and the slotted `rc-menu` draws the
  only surface.
- 25375fa: Drop the inner focus ring from `rc-combobox` and `rc-select` when they are
  composed as `rc-field` controls, since the field's label and active indicator
  already show focus.
- 3f8d110: Clear a page-level focus outline from a native input, select, or textarea inside `rc-field`. The
  field already shows focus, but rc-field's `::slotted()` reset loses to page rules such as a CSS
  reset's Firefox `:-moz-focusring` outline, which drew a dotted box inside the focused field.
- b764a3c: Observe interface locale changes through containing shadow roots and the host's own document.
  An explicit empty `lang` now means an unknown locale rather than falling back to `<html lang>`.
  Typeahead compares complete grapheme prefixes, including decomposed accents and collation
  expansions. Default interpolating messages format numeric positions in the interface locale
  while translation callbacks continue to receive numbers and can accept an optional locale.
  Default messages isolate consumer text whose direction is unknown. Textarea content direction
  uses the native LTR fallback for neutral `dir="auto"` content, recognizes Arabic Letter Mark and
  isolate controls, and reruns plugins when the native textarea's `lang` or `dir` changes.
- 6771ce6: Pin floated Material field labels to the container instead of centering them
  with the control. Filled fields reserve 8px of block padding, so every floated
  label sits at the same offset and a taller control grows the field downward;
  outlined labels now ride the top border for select and combobox controls too. Full-size
  chips in a filled field keep a 0.25rem gap below the floated label.
  Select and combobox controls drop their own block padding inside fields, and
  `rc-textarea` text starts on the input line like a native textarea.

  Add `rc-combobox--dense` and `rc-select--dense`, which render 1.5rem chips so a
  populated chip field keeps the standard 56px height.

- c8b762b: `observeLocale(listener, host)` notifies only for a `dir` or `lang` change on the host, one of its
  ancestors across shadow roots, or inside its subtree. A `lang` on unrelated content no longer
  makes every component on the page re-read its writing direction, a forced layout each, including
  components inside a `content-visibility: hidden` subtree. An optional `scope` names extra elements
  whose locale matters; `AnchorController` passes the popup and its anchor. Subscribers without a host
  still hear every change. Scoped anchors inside shadow roots are observed as well.
- 622a4f8: Theme popovers and tooltips through the shared token layers. `rc-popover` now
  reads the shared `--rc-popup-*` surface tokens before its own fallbacks, like
  menus and listboxes, and `rc-tooltip` takes its default corner from
  `--rc-radius-sm`. The Material theme sets its popover and tooltip tokens on the
  theme root, so surfaces inside other shadow roots inherit them, and the
  Substrate theme adds popover and tooltip styles.
- 7b36b34: Fix the aggregate Solid JSX type declarations for `rc-field`, `rc-select`, and `rc-combobox`,
  stale relative to their real current APIs: `RCFieldControl` was missing `select`; `RCSelectRef`
  (and `RCComboboxRef` through it) predated a listbox option-type refactor and was missing
  `required`, `focus()`, and `blur()`. Also adds the `data-rc-field-control` attribute to the
  `rc-select`/`rc-combobox` intrinsic element types.
- ac65b5b: A pointer resize now starts only after the pointer moves 8 pixels, like Android's touch slop.
  A tap on a resize handle that is also a button, such as a bottom sheet's drag handle, stays a
  click: it no longer starts a resize, settles the sheet to its nearest snap point, and fires
  resize events before the click runs.
- 8387c20: Extend the `rc-textarea` active-line highlight edge to edge. The active line
  and its gutter cell now paint `--rc-textarea-active-line-bg` through the editor
  and gutter padding, so the row reads as one band across the whole control.
- c328259: Keep textarea gutter rows aligned with editor lines in vertical writing modes.
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

- Updated dependencies [aee912a]
- Updated dependencies [51aac05]
- Updated dependencies [9ee769c]
- Updated dependencies [1179f24]
- Updated dependencies [6f1df83]
- Updated dependencies [8d6edf2]
- Updated dependencies [b0a63ef]
- Updated dependencies [06f195f]
- Updated dependencies [12f443f]
- Updated dependencies [e232e9d]
- Updated dependencies [f31cca3]
- Updated dependencies [d3a91dc]
- Updated dependencies [9f590f2]
- Updated dependencies [fbf240b]
- Updated dependencies [9720b36]
- Updated dependencies [2934328]
- Updated dependencies [9059bce]
- Updated dependencies [3d050f1]
- Updated dependencies [595fe37]
- Updated dependencies [38cd00c]
- Updated dependencies [5c006de]
- Updated dependencies [011f3c6]
- Updated dependencies [079e025]
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
- Updated dependencies [4b9bfe6]
- Updated dependencies [3f19f57]
- Updated dependencies [2d79bd0]
- Updated dependencies [d50f18c]
- Updated dependencies [19278d4]
- Updated dependencies [51f6403]
- Updated dependencies [6ec0857]
- Updated dependencies [b764a3c]
- Updated dependencies [cc0205d]
- Updated dependencies [bdb8753]
- Updated dependencies [54d9ead]
- Updated dependencies [94dc987]
- Updated dependencies [6e548d9]
- Updated dependencies [57338f5]
- Updated dependencies [b9175e9]
- Updated dependencies [253ba66]
- Updated dependencies [50c0657]
- Updated dependencies [f1ca82d]
- Updated dependencies [622a4f8]
- Updated dependencies [687a9be]
- Updated dependencies [98628f7]
- Updated dependencies [ca309b6]
- Updated dependencies [3fe08cb]
- Updated dependencies [a86edce]
- Updated dependencies [8363cb8]
- Updated dependencies [c5b62c9]
- Updated dependencies [f4c0244]
- Updated dependencies [9ab269c]
- Updated dependencies [f6eea6f]
- Updated dependencies [c130173]
- Updated dependencies [2dbeccf]
- Updated dependencies [f0f7511]
- Updated dependencies [c5b6f15]
- Updated dependencies [cc7289f]
- Updated dependencies [114e38a]
- Updated dependencies [c590dd9]
- Updated dependencies [2abffd2]
- Updated dependencies [8a30e96]
- Updated dependencies [9499263]
- Updated dependencies [d7e7208]
- Updated dependencies [a63ded3]
- Updated dependencies [182fcfd]
- Updated dependencies [0c9d563]
- Updated dependencies [aed2034]
- Updated dependencies [16420f9]
- Updated dependencies [11680b6]
- Updated dependencies [223d36c]
- Updated dependencies [7b91a44]
- Updated dependencies [ac65b5b]
- Updated dependencies [2599c19]
- Updated dependencies [fef89dc]
- Updated dependencies [fb54f77]
- Updated dependencies [f0d0fba]
- Updated dependencies [6d126fd]
- Updated dependencies [afcfef8]
- Updated dependencies [e23a39c]
- Updated dependencies [1102fd6]
- Updated dependencies [cd1b85b]
- Updated dependencies [77f9c63]
- Updated dependencies [905083b]
- Updated dependencies [6b99ced]
- Updated dependencies [8387c20]
- Updated dependencies [c328259]
- Updated dependencies [f1433a9]
- Updated dependencies [d3fc2f3]
- Updated dependencies [3325191]
- Updated dependencies [4617b45]
- Updated dependencies [0e2d878]
- Updated dependencies [54067cc]
- Updated dependencies [57d6371]
- Updated dependencies [1740c28]
- Updated dependencies [7c1c7c4]
- Updated dependencies [11ef1ad]
  - @rcarls/rc-accordion@0.7.0
  - @rcarls/rc-adaptive-menu@0.7.0
  - @rcarls/rc-menu-button@0.7.0
  - @rcarls/rc-fab-menu@0.7.0
  - @rcarls/rc-select@0.7.0
  - @rcarls/rc-combobox@0.7.0
  - @rcarls/rc-popover@0.7.0
  - @rcarls/rc-tooltip@0.7.0
  - @rcarls/rc-app-bar@0.7.0
  - @rcarls/rc-bottom-sheet@0.7.0
  - @rcarls/rc-button@0.7.0
  - @rcarls/rc-chip-group@0.7.0
  - @rcarls/rc-chip@0.7.0
  - @rcarls/rc-list@0.7.0
  - @rcarls/rc-navigation-bar@0.7.0
  - @rcarls/rc-navigation-rail@0.7.0
  - @rcarls/rc-card@0.7.0
  - @rcarls/rc-carousel@0.7.0
  - @rcarls/rc-dialog@0.7.0
  - @rcarls/rc-disclosure@0.7.0
  - @rcarls/rc-fab@0.7.0
  - @rcarls/rc-field@0.7.0
  - @rcarls/rc-listbox@0.7.0
  - @rcarls/rc-markdown-editor@0.7.0
  - @rcarls/rc-menu@0.7.0
  - @rcarls/rc-menubar@0.7.0
  - @rcarls/rc-progress@0.7.0
  - @rcarls/rc-range-slider@0.7.0
  - @rcarls/rc-scroller@0.7.0
  - @rcarls/rc-search-bar@0.7.0
  - @rcarls/rc-segmented-button@0.7.0
  - @rcarls/rc-slider@0.7.0
  - @rcarls/rc-snackbar@0.7.0
  - @rcarls/rc-splitter@0.7.0
  - @rcarls/rc-switch@0.7.0
  - @rcarls/rc-textarea@0.7.0
  - @rcarls/rc-toolbar@0.7.0
  - @rcarls/rc-transfer-list@0.7.0
  - @rcarls/rc-virtual-canvas@0.7.0
  - @rcarls/rc-virtual-scroller@0.7.0

## 0.6.0

### Minor Changes

- 7382c71: Add a priority-aware action toolbar that moves original controls into an
  overflow menu. Which actions are promoted is a purely declarative computation
  from `max-shown` and each action's `data-priority`/authored `slot`, with no
  runtime measurement of the toolbar's or its children's rendered size: a
  consumer whose promoted count needs to react to available space owns that
  decision and writes the resulting `max-shown` value down. Include controlled
  and uncontrolled open state, keyboard navigation, light dismissal, and a
  non-Popover fallback.

  Fix `--rc-adaptive-menu-touch-target-overlap-inline-start`/`-end`: the host's
  own `max-inline-size: 100%` self-referenced a shrink-to-fit ancestor's
  already-margin-reduced auto size (an app bar's own trailing group, for
  example), quietly clamping the host back down and canceling the overlap out
  from under it. The cap now grows by the overlap amount so it only ever bounds
  the host's real content.

- ffcbf11: Add adaptive chip-group layouts, native-backed filter chips, and shared
  input-chip rendering. Native-backed chips preserve controlled host state,
  follow form resets when uncontrolled, and accept native link actions. Groups
  restore author-owned chip variants when coordination ends. Keep search input
  chrome inside the search surface and align contextual icon sizes with Material 3.
- b639e04: Add coordinated list and list-item layout tokens so container queries can
  stack unchanged content regions while preserving shared subgrid alignment.

  Breaking for the pre-1.0 carousel API: remove the redundant
  `variant="hero|multi-browse"` attribute and property. The variant only
  changed slide geometry, which is already controlled by
  `--rc-carousel-slide-size`. Remove `variant="hero"` without replacement;
  replace `variant="multi-browse"` with
  `--rc-carousel-slide-size: min(75%, 300px)`.

- 40f9776: Add an APG carousel built on native CSS scroll snap, with optional navigation,
  pagination, mouse dragging, looping, and consumer-controlled slide sizing.
  Preserve controlled active-index behavior after rejected swipes, keep visual
  loop clones inert and out of forms, and degrade safely without intersection
  observation.
- a108336: Add shared-column `rc-list` and `rc-list-item` elements with standard and
  segmented appearances, default content truncation, and native-backed single or
  multiple selection coordination. Restore author-owned item state when native
  selection coordination ends.
- 509ee64: Add `rc-progress`, a native `<progress>` enhancer with a formatted value
  display, a track and fill you can restyle with CSS custom properties, and a
  built-in fix for the indeterminate/undefined-binding footgun.

  Keep the native element as the uncontrolled source of truth, support releasing
  a controlled value, and react to live native `value`/`max` changes. Preserve a
  native determinate value while `indeterminate` temporarily removes its
  attribute.

  The bar renders at its intended height with no `display` attribute set,
  matching its own documented default: previously the track/fill/native
  `<progress>` are all absolutely positioned, contributing nothing to the
  control's normal-flow height, so with no value-display text sharing its grid
  row to give it one, the whole bar collapsed to 0px.

- d67efde: Add a native-host scroll region with optional centered content and fullbleed
  layout tracks, aggregate framework typings, RTL-aware boundary state, and
  Material layout defaults.
- 6683eb9: Add shared, lifecycle-safe click delegation and let interactive list items
  forward plain surface clicks to same-root native action targets while
  preserving nested and modified clicks.
- 30eb232: Add icon-only activation-area sizing and Material icon-button variants. Align menu
  selection and submenu affordances, and keep anchored popups within the viewport
  across native and fallback positioning.
- f099b02: Add declarative horizontal cards with a two-fifths media column and symmetric
  row and column grid coordination properties.

### Patch Changes

- e0de31d: Avoid scheduling a redundant carousel update during the initial Lit lifecycle
  while retaining initial pagination and dynamic slide synchronization.
- 57370e4: Align component metadata, aggregate framework typings, development-time native-child
  validation, controlled menu state, package declarations, and public documentation before the
  next release.
- Updated dependencies [a108336]
- Updated dependencies [7382c71]
- Updated dependencies [ffcbf11]
- Updated dependencies [b639e04]
- Updated dependencies [40f9776]
- Updated dependencies [a108336]
- Updated dependencies [509ee64]
- Updated dependencies [d67efde]
- Updated dependencies [b6f52a2]
- Updated dependencies [e0de31d]
- Updated dependencies [6683eb9]
- Updated dependencies [7adbd76]
- Updated dependencies [57370e4]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
- Updated dependencies [7382c71]
- Updated dependencies [b6f52a2]
- Updated dependencies [53baa54]
- Updated dependencies [53baa54]
- Updated dependencies [f099b02]
- Updated dependencies [0a462c5]
- Updated dependencies [30eb232]
- Updated dependencies [d67efde]
- Updated dependencies [985067e]
- Updated dependencies [57370e4]
  - @rcarls/rc-card@0.6.0
  - @rcarls/rc-list@0.6.0
  - @rcarls/rc-adaptive-menu@0.6.0
  - @rcarls/rc-menu@0.6.0
  - @rcarls/rc-menu-button@0.6.0
  - @rcarls/rc-chip-group@0.6.0
  - @rcarls/rc-chip@0.6.0
  - @rcarls/rc-select@0.6.0
  - @rcarls/rc-combobox@0.6.0
  - @rcarls/rc-search-bar@0.6.0
  - @rcarls/rc-carousel@0.6.0
  - @rcarls/rc-progress@0.6.0
  - @rcarls/rc-scroller@0.6.0
  - @rcarls/rc-app-bar@0.6.0
  - @rcarls/rc-button@0.6.0
  - @rcarls/rc-disclosure@0.6.0
  - @rcarls/rc-bottom-sheet@0.6.0
  - @rcarls/rc-textarea@0.6.0
  - @rcarls/rc-dialog@0.6.0
  - @rcarls/rc-fab-menu@0.6.0
  - @rcarls/rc-range-slider@0.6.0
  - @rcarls/rc-slider@0.6.0
  - @rcarls/rc-toolbar@0.6.0
  - @rcarls/rc-virtual-canvas@0.6.0
  - @rcarls/rc-menubar@0.6.0
  - @rcarls/rc-markdown-editor@0.6.0
  - @rcarls/rc-fab@0.6.0
  - @rcarls/rc-listbox@0.6.0
  - @rcarls/rc-navigation-bar@0.6.0
  - @rcarls/rc-navigation-rail@0.6.0
  - @rcarls/rc-splitter@0.6.0
  - @rcarls/rc-transfer-list@0.6.0
  - @rcarls/rc-accordion@0.6.0
  - @rcarls/rc-segmented-button@0.6.0
  - @rcarls/rc-snackbar@0.6.0
  - @rcarls/rc-switch@0.6.0

## 0.5.0

### Minor Changes

- 689340c: Remove pre-1.0 deprecated APIs: the boolean `keyNavigation` option, `rc-disclosure.fragment`,
  `rc-textarea.listNumbers`, `rc-textarea.label`, and `decorationsFromHtml`.

### Patch Changes

- Updated dependencies [d440edc]
- Updated dependencies [ba65db7]
- Updated dependencies [d33b92f]
- Updated dependencies [7c68235]
- Updated dependencies [689340c]
  - @rcarls/rc-app-bar@0.5.0
  - @rcarls/rc-bottom-sheet@0.5.0
  - @rcarls/rc-menu-button@0.5.0
  - @rcarls/rc-segmented-button@0.5.0
  - @rcarls/rc-disclosure@0.5.0
  - @rcarls/rc-textarea@0.5.0
  - @rcarls/rc-combobox@0.5.0
  - @rcarls/rc-dialog@0.5.0
  - @rcarls/rc-fab@0.5.0
  - @rcarls/rc-fab-menu@0.5.0
  - @rcarls/rc-listbox@0.5.0
  - @rcarls/rc-menu@0.5.0
  - @rcarls/rc-menubar@0.5.0
  - @rcarls/rc-navigation-bar@0.5.0
  - @rcarls/rc-navigation-rail@0.5.0
  - @rcarls/rc-range-slider@0.5.0
  - @rcarls/rc-search-bar@0.5.0
  - @rcarls/rc-select@0.5.0
  - @rcarls/rc-slider@0.5.0
  - @rcarls/rc-splitter@0.5.0
  - @rcarls/rc-toolbar@0.5.0
  - @rcarls/rc-transfer-list@0.5.0
  - @rcarls/rc-accordion@0.5.0
  - @rcarls/rc-markdown-editor@0.5.0
  - @rcarls/rc-button@0.5.0
  - @rcarls/rc-card@0.5.0
  - @rcarls/rc-chip@0.5.0
  - @rcarls/rc-snackbar@0.5.0
  - @rcarls/rc-switch@0.5.0
  - @rcarls/rc-virtual-canvas@0.5.0

## 0.4.2

### Patch Changes

- Updated dependencies [5178dcc]
- Updated dependencies [b12bf1b]
  - @rcarls/rc-bottom-sheet@0.4.2
  - @rcarls/rc-disclosure@0.4.2
  - @rcarls/rc-accordion@0.4.2
  - @rcarls/rc-app-bar@0.4.2
  - @rcarls/rc-button@0.4.2
  - @rcarls/rc-card@0.4.2
  - @rcarls/rc-chip@0.4.2
  - @rcarls/rc-combobox@0.4.2
  - @rcarls/rc-dialog@0.4.2
  - @rcarls/rc-fab@0.4.2
  - @rcarls/rc-fab-menu@0.4.2
  - @rcarls/rc-listbox@0.4.2
  - @rcarls/rc-markdown-editor@0.4.2
  - @rcarls/rc-menu@0.4.2
  - @rcarls/rc-menu-button@0.4.2
  - @rcarls/rc-menubar@0.4.2
  - @rcarls/rc-navigation-bar@0.4.2
  - @rcarls/rc-navigation-rail@0.4.2
  - @rcarls/rc-range-slider@0.4.2
  - @rcarls/rc-search-bar@0.4.2
  - @rcarls/rc-select@0.4.2
  - @rcarls/rc-segmented-button@0.4.2
  - @rcarls/rc-slider@0.4.2
  - @rcarls/rc-snackbar@0.4.2
  - @rcarls/rc-splitter@0.4.2
  - @rcarls/rc-switch@0.4.2
  - @rcarls/rc-textarea@0.4.2
  - @rcarls/rc-toolbar@0.4.2
  - @rcarls/rc-transfer-list@0.4.2
  - @rcarls/rc-virtual-canvas@0.4.2

## 0.4.1

### Patch Changes

- 27ed8b6: Fix internal `workspace:*` dependency ranges shipping unresolved in published packages.
  `changeset publish` shells out to plain `npm publish` for any package manager other than
  pnpm, which doesn't understand Yarn's `workspace:` protocol, so every previously published
  version referenced sibling packages as the literal string `workspace:*` (uninstallable
  outside this workspace). Releases now let Yarn pack each workspace so those ranges become
  real versions, then publish the resulting tarballs with npm's CLI through GitHub Actions
  Trusted Publishing. The flow verifies registry metadata and provenance and safely resumes a
  partially completed release.
  - @rcarls/rc-accordion@0.4.1
  - @rcarls/rc-app-bar@0.4.1
  - @rcarls/rc-bottom-sheet@0.4.1
  - @rcarls/rc-button@0.4.1
  - @rcarls/rc-card@0.4.1
  - @rcarls/rc-chip@0.4.1
  - @rcarls/rc-combobox@0.4.1
  - @rcarls/rc-dialog@0.4.1
  - @rcarls/rc-disclosure@0.4.1
  - @rcarls/rc-fab@0.4.1
  - @rcarls/rc-fab-menu@0.4.1
  - @rcarls/rc-listbox@0.4.1
  - @rcarls/rc-markdown-editor@0.4.1
  - @rcarls/rc-menu@0.4.1
  - @rcarls/rc-menu-button@0.4.1
  - @rcarls/rc-menubar@0.4.1
  - @rcarls/rc-navigation-bar@0.4.1
  - @rcarls/rc-navigation-rail@0.4.1
  - @rcarls/rc-range-slider@0.4.1
  - @rcarls/rc-search-bar@0.4.1
  - @rcarls/rc-select@0.4.1
  - @rcarls/rc-segmented-button@0.4.1
  - @rcarls/rc-slider@0.4.1
  - @rcarls/rc-snackbar@0.4.1
  - @rcarls/rc-splitter@0.4.1
  - @rcarls/rc-switch@0.4.1
  - @rcarls/rc-textarea@0.4.1
  - @rcarls/rc-toolbar@0.4.1
  - @rcarls/rc-transfer-list@0.4.1
  - @rcarls/rc-virtual-canvas@0.4.1

## 0.4.0

### Patch Changes

- 5312d29: Disable native buttons while pending or progressing, add determinate progress percentages, and
  support controlled and uncontrolled APG toggle buttons with selected icon switching.
- b35e28d: Fix the Solid JSX typing for `rc-combobox`'s `allow-create` attribute, which had drifted from
  the 0.3.0 attribute rename, and add the missing `prop:allowCreate` property-binding entry.
- 4f77b8c: `rc-navigation-rail` no longer renders an internal `nav` landmark or exposes
  the `label` property and attribute, matching the fix already applied to
  `rc-navigation-bar`. Wrap it in a labeled native `<nav>` element instead.

  BREAKING CHANGE: remove the `label` property/attribute and stop rendering an
  internal `<nav aria-label>`; `rc-navigation-rail` now renders a plain `div`
  for its `nav` part and expects the consumer to own landmark semantics.

- 037b1b3: Add shared drag gesture measurement and numeric snap helpers, migrate bottom
  sheet settling to the shared velocity lifecycle, and add anchored settling and
  swipe-to-collapse behavior to splitters.
- 3e89095: Replace rc-menu's generated submenu glyph with an author-supplied `indicator`
  slot on rc-menu-button. Keep the decorative indicator inside the trigger bounds,
  reserve label space for it, and expose theme-neutral size, color, and inset
  tokens for Material, Substrate, and application themes.
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

- Updated dependencies [5312d29]
- Updated dependencies [3efe74a]
- Updated dependencies [b7270df]
- Updated dependencies [ebec800]
- Updated dependencies [46810f7]
- Updated dependencies [037b1b3]
- Updated dependencies [e57277f]
- Updated dependencies [6f91e7a]
- Updated dependencies [dce5749]
- Updated dependencies [32b1dc4]
- Updated dependencies [51b2c8f]
- Updated dependencies [55e8ab5]
- Updated dependencies [681a940]
- Updated dependencies [468e009]
- Updated dependencies [48cf73f]
- Updated dependencies [f1b38b5]
- Updated dependencies [e11c4b7]
- Updated dependencies [000283d]
- Updated dependencies [f36cd09]
- Updated dependencies [74d9046]
- Updated dependencies [c926344]
- Updated dependencies [acc913e]
- Updated dependencies [fa9bed0]
- Updated dependencies [1161caa]
- Updated dependencies [9a4aa64]
- Updated dependencies [83d4734]
- Updated dependencies [4624eb2]
- Updated dependencies [8944083]
- Updated dependencies [0ae93fc]
- Updated dependencies [756eb36]
- Updated dependencies [2946bd9]
- Updated dependencies [69e31c1]
- Updated dependencies [4cb5551]
- Updated dependencies [1ba0be2]
- Updated dependencies [3a8df14]
- Updated dependencies [e95e204]
- Updated dependencies [4f77b8c]
- Updated dependencies [8c567e0]
- Updated dependencies [ccca8e2]
- Updated dependencies [fdcf5b1]
- Updated dependencies [ea9aa72]
- Updated dependencies [d918392]
- Updated dependencies [193ef66]
- Updated dependencies [9c3bc6f]
- Updated dependencies [f45b5ec]
- Updated dependencies [4171a9d]
- Updated dependencies [985068e]
- Updated dependencies [94c7807]
- Updated dependencies [04f5d75]
- Updated dependencies [b53b5d2]
- Updated dependencies [c50d9e2]
- Updated dependencies [be4f0ae]
- Updated dependencies [4df89fd]
- Updated dependencies [838c7a0]
- Updated dependencies [d49cde9]
- Updated dependencies [e88eff8]
- Updated dependencies [be4dc7e]
- Updated dependencies [037b1b3]
- Updated dependencies [3e89095]
- Updated dependencies [c40a1be]
- Updated dependencies [ffce603]
- Updated dependencies [aecba33]
- Updated dependencies [979b989]
  - @rcarls/rc-button@0.4.0
  - @rcarls/rc-navigation-rail@0.4.0
  - @rcarls/rc-markdown-editor@0.4.0
  - @rcarls/rc-toolbar@0.4.0
  - @rcarls/rc-bottom-sheet@0.4.0
  - @rcarls/rc-textarea@0.4.0
  - @rcarls/rc-virtual-canvas@0.4.0
  - @rcarls/rc-search-bar@0.4.0
  - @rcarls/rc-splitter@0.4.0
  - @rcarls/rc-dialog@0.4.0
  - @rcarls/rc-card@0.4.0
  - @rcarls/rc-chip@0.4.0
  - @rcarls/rc-fab@0.4.0
  - @rcarls/rc-fab-menu@0.4.0
  - @rcarls/rc-navigation-bar@0.4.0
  - @rcarls/rc-segmented-button@0.4.0
  - @rcarls/rc-snackbar@0.4.0
  - @rcarls/rc-switch@0.4.0
  - @rcarls/rc-accordion@0.4.0
  - @rcarls/rc-app-bar@0.4.0
  - @rcarls/rc-combobox@0.4.0
  - @rcarls/rc-disclosure@0.4.0
  - @rcarls/rc-listbox@0.4.0
  - @rcarls/rc-menu-button@0.4.0
  - @rcarls/rc-menubar@0.4.0
  - @rcarls/rc-range-slider@0.4.0
  - @rcarls/rc-select@0.4.0
  - @rcarls/rc-slider@0.4.0
  - @rcarls/rc-transfer-list@0.4.0
  - @rcarls/rc-menu@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [88b4086]
  - @rcarls/rc-select@0.3.2
  - @rcarls/rc-app-bar@0.3.2
  - @rcarls/rc-combobox@0.3.2
  - @rcarls/rc-dialog@0.3.2
  - @rcarls/rc-fab@0.3.2
  - @rcarls/rc-listbox@0.3.2
  - @rcarls/rc-menu@0.3.2
  - @rcarls/rc-menu-button@0.3.2
  - @rcarls/rc-menubar@0.3.2
  - @rcarls/rc-range-slider@0.3.2
  - @rcarls/rc-search-bar@0.3.2
  - @rcarls/rc-slider@0.3.2
  - @rcarls/rc-splitter@0.3.2
  - @rcarls/rc-textarea@0.3.2
  - @rcarls/rc-toolbar@0.3.2
  - @rcarls/rc-transfer-list@0.3.2
  - @rcarls/rc-markdown-editor@0.3.2
  - @rcarls/rc-accordion@0.3.2
  - @rcarls/rc-disclosure@0.3.2
  - @rcarls/rc-virtual-canvas@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies [808afe4]
  - @rcarls/rc-textarea@0.3.1
  - @rcarls/rc-markdown-editor@0.3.1
  - @rcarls/rc-accordion@0.3.1
  - @rcarls/rc-app-bar@0.3.1
  - @rcarls/rc-combobox@0.3.1
  - @rcarls/rc-dialog@0.3.1
  - @rcarls/rc-disclosure@0.3.1
  - @rcarls/rc-fab@0.3.1
  - @rcarls/rc-listbox@0.3.1
  - @rcarls/rc-menu@0.3.1
  - @rcarls/rc-menu-button@0.3.1
  - @rcarls/rc-menubar@0.3.1
  - @rcarls/rc-range-slider@0.3.1
  - @rcarls/rc-search-bar@0.3.1
  - @rcarls/rc-select@0.3.1
  - @rcarls/rc-slider@0.3.1
  - @rcarls/rc-splitter@0.3.1
  - @rcarls/rc-toolbar@0.3.1
  - @rcarls/rc-transfer-list@0.3.1
  - @rcarls/rc-virtual-canvas@0.3.1

## 0.3.0

### Added

- Add the `./react` export for React JSX type augmentation.
- Add typed refs and custom event detail exports for React users.
- Add `canvasScaleX` and `canvasScaleY` to aggregate React and Solid virtual-canvas refs.
- Add aggregate typing coverage for listbox action events and options.

### Changed

- Align aggregate React and Solid typings for `rc-listbox`, `rc-menubar`, and `rc-fab`.
- Update package metadata, README intro, docs links, and published aggregate exports.

### Fixed

- Remove non-existent `rc-fab` props from `solid.d.ts`.
- Fix published declaration and theme exports.

### Dependencies

- Sync component dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- Updated dependencies
  - @rcarls/rc-app-bar@0.2.0
  - @rcarls/rc-accordion@0.2.0
  - @rcarls/rc-combobox@0.2.0
  - @rcarls/rc-dialog@0.2.0
  - @rcarls/rc-disclosure@0.2.0
  - @rcarls/rc-fab@0.2.0
  - @rcarls/rc-listbox@0.2.0
  - @rcarls/rc-markdown-editor@0.2.0
  - @rcarls/rc-menu@0.2.0
  - @rcarls/rc-menu-button@0.2.0
  - @rcarls/rc-menubar@0.2.0
  - @rcarls/rc-range-slider@0.2.0
  - @rcarls/rc-search-bar@0.2.0
  - @rcarls/rc-select@0.2.0
  - @rcarls/rc-slider@0.2.0
  - @rcarls/rc-splitter@0.2.0
  - @rcarls/rc-textarea@0.2.0
  - @rcarls/rc-toolbar@0.2.0
  - @rcarls/rc-transfer-list@0.2.0
