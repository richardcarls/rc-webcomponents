---
'@rcarls/rc-webcomponents': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-win31': minor
---

Add four directional motion tokens to the shared base contract:
`--rc-motion-effects-easing-enter`/`-exit` and
`--rc-motion-spatial-easing-enter`/`-exit`. An opening element decelerates
into place; a closing one accelerates out. There are no matching enter/exit
duration tokens; pair `-easing-exit` with an existing `-duration-fast` token
instead.

All three themes map the new tokens: Material pairs them with its
standard/emphasized decelerate and accelerate curves, Substrate keeps its one
curve as the enter curve and adds a generic accelerate shape for exit
(refined further once Substrate gets its own full spatial/effects scale), and
`rc-theme-win31` declares all four as `step-end`, matching its zero-motion
contract, so an application that loads the shared base tokens alongside
`rc-theme-win31` does not inherit the base defaults' real easing curves for
these two directions.
