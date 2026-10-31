---
'@rcarls/rc-pagination': minor
'@rcarls/rc-webcomponents': minor
'@rcarls/rc-react': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-tailwind': minor
'@rcarls/rc-theme-win31': minor
---

Adds `rc-pagination`, a pagination enhancer for a native `<nav>` holding page links or
buttons tagged with `data-rc-page`. It keeps `aria-current="page"` on the current page, names
the landmark and numbered controls, disables steps past either end, and fires a cancelable
`rc-pagination-change` that can hand link navigation to a client-side router. The DOM-free
`paginationRange()` helper, also at `@rcarls/rc-pagination/range`, builds the page list on a
server. The aggregate, the React wrappers, and all four themes cover it.
