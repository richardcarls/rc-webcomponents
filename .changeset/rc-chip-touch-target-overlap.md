---
'@rcarls/rc-chip': minor
---

Add `--rc-chip-touch-target-overlap-block-start` and `-block-end`, zero by
default. A theme or consumer sets one to let a chip's accessible
touch-target inflation on that side overlap into whatever sits just
outside the host, such as a height-constrained field's own block padding
(a multi-select value area in `rc-search-bar` or `rc-combobox`, say),
instead of also reserving layout space there. The block-axis counterpart
to `@rcarls/rc-button`'s, `@rcarls/rc-menu-button`'s, and
`@rcarls/rc-adaptive-menu`'s own inline-axis touch-target overlap tokens.
