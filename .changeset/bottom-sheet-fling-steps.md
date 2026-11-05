---
'@rcarls/rc-bottom-sheet': minor
---

A swipe on `rc-bottom-sheet` now settles at the next snap point beyond the
release in its direction instead of the first or last point. A short swipe can
settle at the middle point of a three-point sheet, while a longer swipe released
beyond it can reach the final point. Sheets with two snap points behave as before.
