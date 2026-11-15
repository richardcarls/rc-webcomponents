---
'@rcarls/rc-button': patch
---

`rc-button` logs a development warning when a button named by `aria-label`
or `aria-labelledby` shows a text-backed icon without `data-rc-icon`: a
ligature inside a Material Icons or Material Symbols class, or a one- or
two-character arrow, symbol, or emoji glyph. Such an icon would otherwise be
sized as a label. Ordinary short words and abbreviations don't warn.
