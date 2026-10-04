---
'@rcarls/rc-common': patch
'@rcarls/rc-dialog': patch
'@rcarls/rc-bottom-sheet': patch
'@rcarls/rc-fab': patch
'@rcarls/rc-webcomponents': patch
---

Make `rc-dialog` move and resize options reactive. Toggling `movable`,
changing `resize`, or changing any other `move-*` or `resize-*` option after
setup now rebuilds that behavior, so `resize="none"` turns resizing off on a
mounted `rc-dialog` or `rc-bottom-sheet` and a later value turns it back on.
Re-wiring the inner `<dialog>` no longer leaves stale move or resize
controllers attached. `DragController`, `ResizeController`, and
`DragGestureController` gain `dispose()`. Detaching a handle restores its
focusability and inline resize styles when they still have controller-written
values, while preserving later author edits. Active gestures cancel
and release pointer capture when their controller is removed. `rc-fab` uses
the new `ScrollObserverController.dispose()` for its optional scroll fallback.
