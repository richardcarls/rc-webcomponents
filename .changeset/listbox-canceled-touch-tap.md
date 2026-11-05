---
'@rcarls/rc-common': patch
---

Tapping an option in `rc-listbox`, `rc-select`, or `rc-combobox` now selects it in Firefox
for Android. Inside a scrollable list, Firefox can cancel a still tap (`pointercancel`)
instead of ending it (`pointerup`), so most taps only focused the option. A canceled touch
that the browser follows with `click` now counts as a tap. A scroll gets no `click`, so it
still selects nothing.
