---
'@rcarls/rc-theme-material': patch
---

Give the Material typefaces a generic fallback. `--md-ref-typeface-plain`
and `--md-ref-typeface-brand` are now `Roboto, system-ui, sans-serif`, so a
page without Roboto renders in the system sans-serif instead of the
browser's default serif.
