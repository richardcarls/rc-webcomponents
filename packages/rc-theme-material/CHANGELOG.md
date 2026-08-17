# @rcarls/rc-theme-material

## 0.4.1

## 0.4.0

### Minor Changes

- e57277f: Add Material 3 search-view, fixed-pane splitter, dialog scrim, and resize enhancements.

  `rc-search-bar` now supports `variant="view"`, controlled/default open state, search-view methods, a rich `suggestions` slot, and datalist-derived text suggestions. `rc-splitter` adds `mode="fixed"` for clampable pixel primary panes. `rc-common` now honors CSS max-size constraints during resize gestures, and `rc-dialog` exposes a scrim token plus resize handle/origin hooks used by themed surfaces.

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

- 9c7476d: Add theme-specific rc-button progress treatments, including compact Material spinners and
  Substrate percentage indicators.
- 3efe74a: Center navigation rail header content on the inline axis and remove Material
  elevation from FABs placed in the header slot.
- ebec800: Dock bottom sheets without a theme to the viewport block-end by default and
  support absolute positioning for non-modal sheets contained by a positioned ancestor.
  Center authored drag handles with a splitter-aligned pill treatment. Align the
  Material theme with its surface, elevation, scrim, drag-handle, and contextual
  button treatment.
- e88eff8: Refine semantic card-title typography and icon-button alignment across both
  themes. Simplify Substrate navigation selection, match its bottom-sheet handle
  to the splitter grip, improve inverse notification action contrast, and theme the
  Markdown editor's composed controls.
- 6f91e7a: Fix collapsed `rc-navigation-rail` items so the whole item's box wraps icon and
  label, not just the icon. The shared component pulled the label out of flow
  (`position: absolute`), so a theme's whole-item background or focus ring only
  covered the icon; Material's detached-pill layout now lives in its own theme
  stylesheet instead of the shared base. Substrate's collapsed rail also grows
  from `5rem` to `6rem` so single-word labels like "Settings" stop wrapping.
- dce5749: Replace the navigation rail's shadow-DOM fallback toggle with a consumer-authored light-DOM
  button, and align collapsed and expanded item layouts across the default and reference themes.
- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- 4d118ff: Share icon-font size and line-height tokens across themed component icon markers.
- 3e89095: Replace rc-menu's generated submenu glyph with an author-supplied `indicator`
  slot on rc-menu-button. Keep the decorative indicator inside the trigger bounds,
  reserve label space for it, and expose theme-neutral size, color, and inset
  tokens for Material, Substrate, and application themes.
- 0dd9ff5: Prevent Material switches from collapsing below their 52 by 32 pixel track geometry in constrained flex and grid layouts.
- 979b989: Use a zero default gap for tighter chip content layout and a smaller default
  font size for slotted remove icons. Derive removable content padding from the
  remove target width and chip gap so the label and trailing icon stay aligned.

## 0.3.2

## 0.3.1

## 0.3.0

### Added

- Add full Material 3 token support.
- Add Material styling for the FAB back-to-top pattern.
- Add Material styling for the splitter collapse handle.

### Changed

- Normalize listbox, menu, menu-button, and menubar styling through inherited component tokens.
- Update search-bar elevation, hover, and keyboard-focus styling.
- Update rc-select selectors for the default native select slot.
- Update transfer-list listbox backgrounds and action button corner radius.
- Update package metadata, README intro, and docs links.

## 0.2.0
