---
'@rcarls/rc-common': minor
'@rcarls/rc-webcomponents': minor
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-bottom-sheet': minor
'@rcarls/rc-button': minor
'@rcarls/rc-chip': minor
'@rcarls/rc-combobox': minor
'@rcarls/rc-dialog': minor
'@rcarls/rc-disclosure': minor
'@rcarls/rc-fab-menu': minor
'@rcarls/rc-field': minor
'@rcarls/rc-listbox': minor
'@rcarls/rc-menu': minor
'@rcarls/rc-menu-button': minor
'@rcarls/rc-menubar': minor
'@rcarls/rc-popover': minor
'@rcarls/rc-progress': minor
'@rcarls/rc-range-slider': minor
'@rcarls/rc-search-bar': minor
'@rcarls/rc-select': minor
'@rcarls/rc-slider': minor
'@rcarls/rc-snackbar': minor
'@rcarls/rc-textarea': minor
'@rcarls/rc-toolbar': minor
'@rcarls/rc-tooltip': minor
'@rcarls/rc-transfer-list': minor
---

**Breaking:** shared token defaults now have one owner, the token contract in
`themes/token-contract.mjs`. `base.css`, component fallbacks, and the styling
guide are generated from it.

- Components fall back to the same defaults `base.css` declares, so a page
  without `base.css` now renders like one with it. Fallbacks that differed
  before change without `base.css`: for example, `rc-button`, `rc-field`, and
  `rc-search-bar` use a `2.25em` control block size instead of `2.5rem`,
  popups use a `0.125em` radius, and dialogs, sheets, and snackbars fade over
  `120ms`. Fallbacks that defer to native or inherited styling, such as
  `rc-button`'s `revert` background, are unchanged.
- `base.css` no longer declares derived tokens (`--rc-border`,
  `--rc-control-radius`, the `--rc-popup-*` tokens, `--rc-motion-duration`,
  and the item type tokens). Components resolve them where they read them, so
  a theme scoped to a class or shadow host that sets only `--rc-surface` now
  reaches popups too. Migration: if your own CSS reads one of these tokens
  without a fallback, add the fallback or declare the token yourself.
- `base.css` no longer declares `--rc-font-family: inherit`, which left the
  token unset anyway. Components still inherit the page font.
- `--rc-item-font-family`, `--rc-item-font-size`, and `--rc-item-line-height`
  default to the shared type tokens, so menu, listbox, and adaptive-menu items
  follow a theme's `--rc-font-*` tokens unless it sets an item type scale.
- `--rc-shadow` defaults to `0 2px 8px color-mix(in srgb, CanvasText 15%, transparent)`,
  the value components already used, which follows dark color schemes.
- `@rcarls/rc-common` adds `rcToken()`, which reads a shared token with its
  contract default as the fallback.
