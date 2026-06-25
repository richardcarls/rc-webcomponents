---
"@rcarls/rc-common": minor
"@rcarls/rc-search-bar": minor
"@rcarls/rc-theme-material": patch
---

**rc-common:** Extract `KeyboardInteractionDirective` — a new focused directive that
tracks keyboard vs. pointer interaction mode and sets/removes `data-interaction-mode="keyboard"`
on the target element. Export: `keyInteraction`, `KeyInteractionOptions`.

**Breaking (internal):** Remove `useInteractionModeAttr` from `KeyNavigationOptions` in
`KeyboardNavigationDirective`. All in-monorepo consumers are updated in this change. The
navigation directive now handles only key-action dispatch; pair it with `keyInteraction`
when both concerns are needed.

**rc-search-bar:** Adopt default appearance matching native `input[type="search"]` and
sibling controls (`rc-select`, `rc-combobox`):
- New `--rc-search-bar-border` token (default `1px solid ButtonBorder`) and
  `--rc-search-bar-shadow` token (default `none`).
- Height, padding, gap, background, and text color all fall through to `--rc-control-*`
  and `--rc-field`/`--rc-field-text` semantic tokens.
- `appearance: textfield` on the slotted `input[type="search"]` suppresses native
  search chrome across browsers.

Replace bespoke `data-focus-visible` host attribute with the `data-interaction-mode="keyboard"`
+ `:focus-within` pattern used by `rc-toolbar`. Focus ring appears only on keyboard
navigation and disappears on pointer interaction.

Clear button is now held in layout when inactive (`inert` + `visibility: hidden`) so the
wrapper width is stable whether the button is visible or not.

**rc-theme-material (search bar):** Correct M3 Search Bar theming:
- Rest state: elevation provided via `--rc-search-bar-shadow` bridge token (Level 1)
  instead of a hardcoded `box-shadow` on `::part(root)`.
- Hover state layer: corrected from 4% to 8% on-surface tint.
- Focus selector: updated from `[data-focus-visible]` to
  `[data-interaction-mode='keyboard']::part(root):focus-within` with Level 2 elevation.
