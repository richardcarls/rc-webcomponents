---
'@rcarls/rc-theme-material': patch
---

Full-screen dialogs now use the Material 3 `surface` role, matching their top app bar, instead
of the basic dialog's `surface-container-high`. Apps no longer need to set
`--rc-dialog-fullscreen-background` themselves.
