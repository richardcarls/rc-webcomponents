---
'@rcarls/rc-theme-material': patch
---

Document icon font wiring as one copy-pasteable rule.

The theme sizes icon markers but sets no `font-family`, so a marker without one
renders as its literal text. That was documented per component, which meant
adopting a component could reintroduce the problem one marker at a time. The
README now lists every marker in the catalog in a single rule, and names the
three that carry no sizing from the theme either.
