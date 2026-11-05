---
'@rcarls/rc-bottom-sheet': minor
---

A swipe on `rc-bottom-sheet` now settles at the next snap point beyond the
release in its direction instead of the first or last point. A sheet with three
snap points steps from collapsed to half-expanded to expanded, as Material's
Android bottom sheet does. Sheets with two snap points behave as before.
