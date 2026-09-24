---
'@rcarls/rc-carousel': patch
---

Scroll, snap, and drag the track along the inline axis in logical terms, so
navigation, swipe settling, and mouse dragging work in RTL and in vertical
writing modes. Previously every slide index mapped to the wrong scroll
position in RTL, where the track's scroll offset runs negative. The
built-in previous and next chevrons also mirror in RTL.
