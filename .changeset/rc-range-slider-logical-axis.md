---
'@rcarls/rc-range-slider': patch
---

Run a horizontal range slider along the inline axis, like the native range
input it enhances. In RTL the range grows from the right, pointer positions
are measured from the right edge, and ArrowLeft raises a thumb's value, as
the APG describes; Up and Down always raise and lower. In vertical text the
thumbs report `aria-orientation="vertical"`. Thumbs are centered with
logical margins, and the floating value is centered correctly in RTL.
`orientation="vertical"` stays physically vertical, bottom to top.
