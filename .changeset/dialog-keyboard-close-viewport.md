---
'@rcarls/rc-common': minor
'@rcarls/rc-dialog': patch
---

Keep a fullscreen `rc-dialog` from shrinking for a moment when a software
keyboard closes. Firefox for Android reports a viewport shorter than the
keyboard-open one for a few frames on the way back to full height; while the
keyboard closes, the surface now takes only growth until the full height
returns, a text field takes focus again, the width changes, or a one-second
backstop passes.

`rc-common` adds `SoftKeyboardViewport`, which applies that filtering to any
viewport measurement and can instead hold the keyboard-free height for window
size classes, along with the `deepActiveElement`, `isTextEntryElement`, and
`isTextEntryFocused` helpers it uses.
