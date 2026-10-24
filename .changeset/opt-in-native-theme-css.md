---
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-win31': minor
---

Add independent opt-in `native.css` and CSS-only `css-components.css` entrypoints to the
Material, Substrate, and Windows 3.1 themes. Native controls can use the theme presentation
without registration, while documented class recipes style common HTML controls and static
card, list, chip-group, and disclosure markup without changing behavior.

Native styles stop at RC controls that own their native children. Add
`data-rc-native="off"` to an element to keep native styles off it and its subtree.
