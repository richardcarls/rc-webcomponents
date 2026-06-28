---
"@rcarls/rc-splitter": minor
"@rcarls/rc-theme-material": minor
"@rcarls/rc-common": patch
---

# rc-splitter WAI-ARIA review and UX enhancements

**rc-splitter:** `collapsible` attribute adds a chevron toggle button on the separator; Ctrl+Arrow and Shift+Arrow (10× step) keyboard shortcuts; `min`/`max` props clamp pane size; visual drag indicator moved to `::before` with 24 px touch-target `::after` circle (WCAG 2.5.8); corrected `aria-orientation` to describe the bar; new `--rc-splitter-handle-*` and `--rc-splitter-collapse-button-*` CSS custom properties; `::part(collapse-button)`.

**rc-theme-material:** M3 bottom-sheet pill handle (4 px × 32 px, `on-surface-variant` 40 %, 24 px strip width).

**rc-common:** `KeyboardNavigationDirective` — `separator` role case (nav axis perpendicular to bar); `next-large`/`prev-large` actions on Shift+Arrow.
