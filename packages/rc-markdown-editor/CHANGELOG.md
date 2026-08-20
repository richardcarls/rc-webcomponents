# @rcarls/rc-markdown-editor

## 0.4.2

### Patch Changes

- @rcarls/rc-button@0.4.2
- @rcarls/rc-select@0.4.2
- @rcarls/rc-textarea@0.4.2
- @rcarls/rc-toolbar@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-button@0.4.1
- @rcarls/rc-select@0.4.1
- @rcarls/rc-textarea@0.4.1
- @rcarls/rc-toolbar@0.4.1

## 0.4.0

### Patch Changes

- b7270df: Compose the Markdown editor toolbar from `rc-toolbar`, `rc-button`, and
  `rc-select`, and include native buttons inside direct `rc-button` wrappers in
  toolbar roving-focus navigation.
- 0ae93fc: Document `rc-markdown-editor`'s `toolbar`/`rich-view` CSS parts, its 18 CSS
  custom properties, the `value`/`default-value` attributes, and its default
  slot, plus `rc-editor-toolbar`'s full set of `active-*`, `code-language`, and
  `source-mode` attributes, in the generated API reference.
- 756eb36: Fix `sourceMode` so host-driven writes are silent, matching the library's
  controlled/uncontrolled convention. The property setter previously dispatched
  `rc-mode-change` on every change regardless of source, so setting
  `el.sourceMode = true` from a host fired the same user-interaction event as
  the toolbar button or Ctrl+Shift+S. The event now only fires from those two
  genuinely user-driven paths.
- 2946bd9: Fix `value` so it can be set declaratively via the `value` HTML attribute. It
  previously had no `@property` decorator at all, so `<rc-markdown-editor
value="...">` was silently ignored and only the JS `.value` assignment worked.
- ffce603: Preserve controlled Markdown values across initial rich/source mode setup,
  ignore change events emitted by the inactive source editor, and sanitize rich
  Markdown output while retaining the editor's supported underline markup. Keep
  source-mode focus and read-only behavior aligned with the active editor surface.
- Updated dependencies [5312d29]
- Updated dependencies [b7270df]
- Updated dependencies [46810f7]
- Updated dependencies [32b1dc4]
- Updated dependencies [51b2c8f]
- Updated dependencies [55e8ab5]
- Updated dependencies [f1b38b5]
- Updated dependencies [e11c4b7]
- Updated dependencies [74d9046]
- Updated dependencies [9c3bc6f]
- Updated dependencies [c50d9e2]
- Updated dependencies [be4f0ae]
- Updated dependencies [4df89fd]
- Updated dependencies [c40a1be]
- Updated dependencies [aecba33]
  - @rcarls/rc-button@0.4.0
  - @rcarls/rc-toolbar@0.4.0
  - @rcarls/rc-textarea@0.4.0
  - @rcarls/rc-select@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [88b4086]
  - @rcarls/rc-select@0.3.2
  - @rcarls/rc-textarea@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies [808afe4]
  - @rcarls/rc-textarea@0.3.1
  - @rcarls/rc-select@0.3.1

## 0.3.0

### Added

- Add an inline link popover for link creation, editing, opening, and removal.
- Add word expansion for collapsed character-format selections.
- Add Ctrl/Cmd-click link opening in rich mode.
- Add active link toolbar state.

### Changed

- Render rich-mode links with pointer cursor and underline styling.
- Update package metadata, README intro, and docs links.

### Fixed

- Give the heading-level select an accessible name.
- Fix Markdown code-block language updates through the published plugin path.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-textarea@0.2.0
