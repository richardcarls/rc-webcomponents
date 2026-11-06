---
'@rcarls/rc-bottom-sheet': minor
---

An `rc-bottom-sheet` with a single snap point now pairs it with the sheet's
natural height, its content height capped by its CSS block-size limits, as a
second stop at index 1, so a peek can expand to fit. Drags settle at, and handle
activation toggles between, the two. A sheet without snap points still resizes
freely, and activating its handle does nothing.

The new read-only `nextActivationIndex` reports the snap index that activating
the handle moves to next, or `null`, so a consumer can label the handle with the
direction it moves, such as "Expand" or "Collapse".

**Migration:** a single-point sheet whose content is taller than that point now
expands to its natural height on a drag or tap. Set `resize="none"` to keep it
fixed at the point.
