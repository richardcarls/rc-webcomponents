# @rcarls/rc-webcomponents

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
