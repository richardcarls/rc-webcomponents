---
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-win31': minor
---

Let opt-in native theme styles reach consumer controls inside RC containers while
component recipes retain their themed presentation. Apply the same presentation
boundary and `data-rc-native="off"` subtree opt-out in Material, Substrate, and
Windows 3.1.

Native controls inside an RC host may now gain theme styling when that host does
not provide their appearance. Add `data-rc-native="off"` to content that should
keep its own styles, such as a third-party widget.
