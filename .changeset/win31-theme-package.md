---
'@rcarls/rc-theme-win31': minor
---

Add a Windows 3.1 era theme package with full component coverage.

`@rcarls/rc-theme-win31` maps a period `--win31-*` token layer onto the public
`--rc-*` contract and ships one stylesheet per component, matching the coverage
of the existing themes. Metrics derive from the MS Sans Serif 8pt cell and scale
from a single `--win31-unit` token, so the theme can be doubled without any
proportion changing.

The theme is light only, has no hover states outside menus, treats disabled as a
color rather than an opacity, draws focus and selection as separate marks, and
yields entirely under forced colors.
