---
'@rcarls/rc-textarea': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-webcomponents': minor
---

**Breaking:** replace `--rc-textarea-padding` with `--rc-textarea-padding-block` and
`--rc-textarea-padding-inline`. The active line highlight bleeds through the inline padding by
negating it, which a multi-value shorthand made invalid: inside a Material filled `rc-field`
(`0 1rem 0.5rem`) the highlight stopped short of the field's edges in the editor and gutter.
`--rc-textarea-padding-inline` is one length applied to both inline sides, so the bleed stays
valid and follows RTL and vertical writing modes through logical insets.
`--rc-textarea-padding-block` accepts any `padding-block` value.

Migration: split each `--rc-textarea-padding` declaration. A single length `L` becomes
`--rc-textarea-padding-block: L; --rc-textarea-padding-inline: L`. A shorthand
`T X B` becomes `--rc-textarea-padding-block: T B; --rc-textarea-padding-inline: X`.
