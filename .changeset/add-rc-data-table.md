---
'@rcarls/rc-data-table': minor
'@rcarls/rc-pagination': patch
'@rcarls/rc-webcomponents': minor
'@rcarls/rc-react': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-tailwind': minor
'@rcarls/rc-theme-win31': minor
---

Adds `rc-data-table`, a sortable-header enhancer for a native `<table>` that follows the
WAI-ARIA sortable table example. Authored `<button>` or link controls in
`<th data-rc-sort-key>` headers request a sort; the element reflects it as `aria-sort` on the
active header, draws a distinct indicator for each sort state, and fires a cancelable
`rc-data-table-sort` for the consumer to re-render the rows. It never sorts data itself. The
host becomes a focusable group named by the caption while the table overflows. The aggregate,
the React wrappers, and all four themes cover it.

`rc-pagination` now places its live region on the document body instead of inside the
element, so it never joins the consumer's markup.
