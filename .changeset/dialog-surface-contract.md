---
'@rcarls/rc-dialog': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
---

Give `rc-dialog` a surface styling contract.

It exposed only `--rc-dialog-scrim`, so both themes drew the surface by selecting the native
`<dialog>` directly. It now installs a light-DOM base stylesheet, the same pattern as `rc-button`
and `rc-disclosure`, and exposes inline and block bounds, padding, border, radius, background,
foreground, and shadow, plus fullscreen-specific padding and background for the two values that
variant genuinely needs of its own.

Fullscreen geometry, meaning position, size, margin, radius, and shadow, stays structural rather
than something a theme sets: filling the visual viewport is what keeps the surface correct under browser zoom
and a software keyboard.

Material's explicit block bound with `overflow: hidden` moved into the base layer rather than
staying a theme value. It exists because Chromium does not reliably clip a scrolling element's
own border radius at the scroll boundary, which is a correctness fix every theme needs.

`--rc-dialog-visual-viewport-left`, `-top`, `-width`, and `-height` are no longer documented as
theme properties. They are geometry the component writes while a fullscreen dialog is open:
readable if something inside the dialog needs the same measurements, but setting them does not
move the dialog. They are candidates for private `--_rc-dialog-*` names in a future revision.
