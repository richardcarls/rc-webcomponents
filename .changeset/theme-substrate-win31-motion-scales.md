---
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-win31': minor
---

`rc-theme-substrate` and `rc-theme-win31` now map the full shared
spatial/effects motion scale that `rc-theme-material` already implements,
closing a gap where each declared only its own single compatibility duration.

Substrate adds a small, quicker scale of its own: 100/160/240&nbsp;ms for
effects and 160/240/320&nbsp;ms for spatial, with its existing single easing
curve as the spatial curve (it is already decelerate-shaped) and `ease-out`
for effects. The compatibility token now follows the effects default rather
than its own literal, matching the shared base contract's own convention.
The one remaining hardcoded duration, `rc-list-item`'s 100&nbsp;ms row
transition, now reads from the effects-fast token. Substrate's
`prefers-reduced-motion` override moves from the bridge layer into
`components/modes.css`, in the components layer, matching where the other
two themes keep their mode overrides; a cascade layer test now proves the
later layer's override wins rather than assuming it.

win31 declares all thirteen shared tokens, plus the four directional ones
added last release, at zero duration with `step-end` easing. Previously only
the single compatibility token was set, so an application loading the shared
base tokens alongside this theme inherited base's real 180/300/450&nbsp;ms
spatial motion for every other token in the scale, silently contradicting the
theme's own zero-motion contract. `rc-chip`'s existing zero-duration override
gets its matching `step-end` easing token.

Verifying that claim surfaced a limit worth knowing about even after this
fix: it holds only when the theme class is applied to a container, the
documented pattern, not to `<html>`. The shared `base.css` declares no cascade
layer, so its `:root` values outrank any theme layer whenever both target the
same element, which happens only when the theme class sits on `<html>` itself.
No theme package can fix this by declaring more tokens; see the styling guide
for details.
