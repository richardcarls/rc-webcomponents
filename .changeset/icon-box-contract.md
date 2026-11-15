---
'@rcarls/rc-common': minor
'@rcarls/rc-carousel': minor
'@rcarls/rc-page-turner': minor
'@rcarls/rc-combobox': minor
'@rcarls/rc-select': minor
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-chip': minor
'@rcarls/rc-search-bar': minor
'@rcarls/rc-menu-button': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-tailwind': minor
'@rcarls/rc-theme-win31': minor
---

**Breaking:** component icon areas share one icon box contract
(`iconBoxStyles()`, new in `@rcarls/rc-common`). Each box is a square sized
by one custom property. Built-in icons are SVGs that fill it and scale with
text, slotted `svg` and `img` icons are centered and kept inside it, an SVG
without a size fills it, slotted text takes its font size, and the box clips
overflow and keeps its size while an icon element renders late.

- `rc-carousel` and `rc-page-turner` add `--rc-carousel-navigation-icon-size`
  and `--rc-page-turner-navigation-icon-size` (default `1.5rem`).
- `rc-combobox` renames `--rc-combobox-toggle-size` to
  `--rc-combobox-toggle-icon-size`, which also sizes the toggle icon box.
- `rc-select` sizes the `toggle-indicator` part as a square box from
  `--rc-select-toggle-indicator-size`, and the dialog cancel icon is
  `1.5rem`.
- `rc-adaptive-menu` renames `--rc-adaptive-menu-icon-size` to
  `--rc-adaptive-menu-overflow-icon-size`.
- `rc-chip` draws its remove icon as an SVG, and `--rc-chip-remove-icon-size`
  is now the box length (default `1.125rem`) instead of a font size (default
  `smaller`).
- `rc-search-bar` draws its clear icon as an SVG and adds
  `--rc-search-bar-clear-icon-size` (default `1.25em`).
- `rc-menu-button` centers a slotted `indicator` in the
  `--rc-menu-button-indicator-size` box instead of stretching it.

Migration: rename `--rc-combobox-toggle-size` to
`--rc-combobox-toggle-icon-size` and `--rc-adaptive-menu-icon-size` to
`--rc-adaptive-menu-overflow-icon-size`. Replace a font-size value of
`--rc-chip-remove-icon-size`, such as `smaller`, with a length.
