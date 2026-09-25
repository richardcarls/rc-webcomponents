---
'@rcarls/rc-range-slider': minor
---

Run a horizontal range slider along the inline axis, like the native range
input it enhances. In RTL the range grows from the right, pointer positions
are measured from the right edge, and ArrowLeft raises a thumb's value, as
the APG describes. In vertical text the slider runs from the inline start
(the top, or the bottom in RTL), its thumbs report
`aria-orientation="vertical"`, and the arrow keys move a thumb the way it
moves on screen, with Right always raising and Left lowering, as a native
range input does in Chromium. Thumbs are centered with logical margins, and
the floating value is centered correctly in every writing mode.

`orientation="vertical"` now follows the block axis instead of forcing a
physical bottom-to-top track. Its ARIA orientation, pointer mapping, arrow
keys, range fill, thumbs, and floating values all turn with the writing mode.
