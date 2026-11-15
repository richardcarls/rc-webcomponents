---
'@rcarls/rc-button': patch
---

`rc-button` logs a development warning when a button named by `aria-label`
or `aria-labelledby` shows only a ligature-shaped word or one or two
characters without `data-rc-icon`, the shape of an icon-font or emoji icon
that would otherwise be sized as a label.
