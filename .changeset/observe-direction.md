---
'@rcarls/rc-common': minor
---

Add `observeDirection(listener)`, one shared observer that reports a `dir`
attribute change anywhere in the document, since the platform fires no
event for it. `FlowController` and `NavigationIndicatorController` now
follow it, so the navigation bar and rail indicator stay on the current
link when a page switches direction at runtime.
