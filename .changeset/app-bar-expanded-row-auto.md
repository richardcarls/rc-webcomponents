---
'@rcarls/rc-app-bar': patch
---

An expanded `rc-app-bar` sizes its title row to the title while fully expanded and uses the
measured size only to animate a collapse. Expanding from collapsed, or switching to `expanded`
before the title could be measured, no longer paints the bar at its compact height for a frame,
which pushed the content below it down.
