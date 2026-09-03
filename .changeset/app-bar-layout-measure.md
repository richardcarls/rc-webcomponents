---
'@rcarls/rc-app-bar': patch
---

Defer app-bar layout measurements to animation frames, group geometry reads
before style writes, and remeasure when symmetric centering changes live.
