---
'@rcarls/rc-dialog': minor
'@rcarls/rc-bottom-sheet': minor
---

**Breaking:** `<rc-dialog>` and `<rc-bottom-sheet>` hosts are `display: contents`
by default, set in their `@layer rc-base` styles. The host only wraps the native
`<dialog>`, so it no longer takes a flex gap or grid cell where it is placed.
Migration: move any margin, padding, or border set on the host to the inner
`<dialog>`, and remove `display: contents` rules written to work around the gap.
