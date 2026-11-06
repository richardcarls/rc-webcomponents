---
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-button': minor
'@rcarls/rc-chip': minor
'@rcarls/rc-chip-group': minor
'@rcarls/rc-common': minor
'@rcarls/rc-markdown-editor': minor
'@rcarls/rc-menu': minor
'@rcarls/rc-navigation-bar': minor
'@rcarls/rc-navigation-rail': minor
'@rcarls/rc-segmented-button': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-tailwind': minor
'@rcarls/rc-theme-win31': minor
---

**Breaking:** components share one icon marker and one label marker. The
component a marker sits in sets its role and size.

| Removed | Use |
| --- | --- |
| `data-rc-button-icon`, `data-rc-chip-icon`, `data-rc-menu-leading`, `data-rc-navigation-icon` | `data-rc-icon` |
| `data-rc-button-selected-icon`, `data-rc-segmented-button-selected-icon`, `data-rc-navigation-collapse-icon` | `data-rc-icon="selected"` |
| `data-rc-navigation-expand-icon` | `data-rc-icon` |
| `data-rc-button-label`, `data-rc-chip-label`, `data-rc-menu-label`, `data-rc-navigation-label`, `data-group-label` | `data-rc-label` |
| `data-rc-menu-trailing` | content after the `data-rc-label` element |

A navigation rail toggle shows its `selected` icon while the rail is expanded,
as a toggle `rc-button` does. Theme icon geometry now covers `selected` icons
and menu item icons. A menu group's heading is the `[data-rc-label]` that is
the group's direct child.

Migration: rename the markers as the table shows. In CSS, scope a role by its
component context, for example `rc-chip [data-rc-icon]`.
