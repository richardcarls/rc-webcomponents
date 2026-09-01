---
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-list': patch
'@rcarls/rc-menu': patch
'@rcarls/rc-menu-button': patch
'@rcarls/rc-webcomponents': minor
---

Add a priority-aware action toolbar that moves original controls into an
overflow menu. Which actions are promoted is a purely declarative computation
from `max-shown` and each action's `data-priority`/authored `slot`, with no
runtime measurement of the toolbar's or its children's rendered size: a
consumer whose promoted count needs to react to available space owns that
decision and writes the resulting `max-shown` value down. Include controlled
and uncontrolled open state, keyboard navigation, light dismissal, and a
non-Popover fallback.

Fix `--rc-adaptive-menu-touch-target-overlap-inline-start`/`-end`: the host's
own `max-inline-size: 100%` self-referenced a shrink-to-fit ancestor's
already-margin-reduced auto size (an app bar's own trailing group, for
example), quietly clamping the host back down and canceling the overlap out
from under it. The cap now grows by the overlap amount so it only ever bounds
the host's real content.
