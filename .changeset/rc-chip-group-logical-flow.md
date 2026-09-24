---
'@rcarls/rc-chip-group': patch
---

Follow the writing mode as well as the direction. Assist-mode arrow keys
move toward the inline end, so ArrowDown advances in vertical text; row
counting for `max-rows` measures along the block axis; and scroll layout
keeps the changed chip in view along the inline axis, with logical overflow
on the scroll track.
