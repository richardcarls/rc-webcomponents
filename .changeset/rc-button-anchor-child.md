---
'@rcarls/rc-button': minor
---

Support a direct native `<a href>` child, styled the same as a `<button>`
child (border, padding, background, `full-width`), for a real navigation
action styled as a button, without losing native link affordances (open in
new tab, copy link). `icon-only` sizing, the touch-target hit-slop, and the
`disabled`/`pending`/`progress` states stay button-only: those assume a real
`HTMLButtonElement`.

Treat that anchor as a valid direct child in development validation as well as
styling and documentation.
