---
'@rcarls/rc-theme-substrate': minor
---

Theme `rc-field`, the last component Substrate left without coverage.

The field takes Substrate's palette and the hover, focus, and invalid treatment
its other form controls already share, so it reads as one of them. `rc-field`
keeps owning its layout, invalid border, disabled opacity, focus outline, and
forced-colors fallbacks; the theme only supplies values.

An `rc-select`, `rc-combobox`, or `rc-textarea` acting as the field's control
provider now stops drawing its own border, background, and focus ring, which
otherwise nested visibly inside the field's. A standalone control outside a
field is unaffected.

The field also fills its container up to a readable measure instead of
shrink-wrapping, so a provider-backed field with no value no longer collapses
to its toggle.
