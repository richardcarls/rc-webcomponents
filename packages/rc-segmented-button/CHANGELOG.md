# @rcarls/rc-segmented-button

## 0.7.0

### Minor Changes

- fef89dc: Move the segmented appearance into the component behind one switch.

  Turning the native fieldset into a segmented control took 27 `--_rc-*`
  declarations that every theme had to restate, 23 of them byte-identical. Two of
  those blocks were accessibility recipes rather than taste: the visually hidden
  legend that keeps the group's accessible name, and the hidden but focusable
  radio. A theme that got either wrong removed the accessible name or made the
  control unreachable by keyboard.

  The component now owns the recipe and a theme sets
  `--rc-segmented-button-appearance: segmented`. Four genuine theme choices become
  public properties: `--rc-segmented-button-cursor`,
  `--rc-segmented-button-disabled-cursor`,
  `--rc-segmented-button-vertical-divider`, and
  `--rc-segmented-button-selected-icon-display`.

  Unset, the fieldset, legend, and radios keep their browser appearance, as
  before. The switch is read with a style container query (Chrome 111, Safari 18,
  Firefox 128); where that is unsupported the recipe does not apply and the
  control falls back to the same native appearance.

  To migrate a theme, replace its `--_rc-segmented-button-*` block with the single
  `--rc-segmented-button-appearance: segmented` declaration, plus any of the four
  public properties whose value differs from the default.

### Patch Changes

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- 51f6403: Arrow keys follow the reading direction everywhere. `keyNavigation` now also
  flips the cross axis in RTL, so a vertical menu opens its submenu with
  ArrowLeft, as the APG describes. A horizontal menubar and segmented button
  advance with ArrowLeft in RTL, Alt+ArrowLeft moves items toward the selected
  list of a transfer list in RTL, and the arrow toward the inline start reaches
  the chips of a multiple select or combobox (ArrowRight in RTL).

  Add `inlineArrowKeys(flow)` for content that runs along the inline axis, such
  as chips or text.

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

- fb54f77: Keep the selected segment visible in forced-colors mode.

  Forced colors replaces the background a theme selects a segment with, which left
  selection legible only through the optional selected-icon slot. The base styles
  now restate the selected segment in `Highlight` and `HighlightText`, matching the
  `rc-chip` treatment, so selection survives in every theme whether or not the icon
  slot is used.

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

## 0.5.0

### Minor Changes

- 7c68235: Fix two spacing bugs in the optional selected-icon (checkmark) pattern:
  `--rc-segmented-button-segment-gap` had no fallback value, so there was no
  gap at all between the checkmark and the label text; and the checkmark
  slot was `display: none` when unchecked (zero width, zero gap consumed),
  so a segment's width visibly grew when it became selected.

  The selected-icon slot now always reserves its width (new
  `--rc-segmented-button-selected-icon-size`, default `1.25em`), toggling
  only `visibility` between checked/unchecked states, with a matching
  pure-CSS mirror spacer on the opposite side (RTL-safe via logical
  `inline-size`) so the label text stays centered instead of leaning toward
  the now-always-reserved leading icon slot. Segment width is now constant
  regardless of selection state. `--rc-segmented-button-segment-gap`
  defaults to `0.5em`. Both changes are backward compatible for consumers
  not using the selected-icon slot at all.

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- 193ef66: Add the rc-segmented-button package for native radio group enhancement.

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- d918392: Document all 14 `rc-segmented-button` CSS custom properties in the generated
  API reference, including which ones defer to native fieldset/label/radio
  styling when unset.
