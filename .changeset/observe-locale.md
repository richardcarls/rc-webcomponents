---
'@rcarls/rc-common': minor
---

Add `observeLocale(listener)`, one shared observer that reports a `dir` or
`lang` attribute change anywhere in the document, since the platform fires
no event for either. `FlowController` and `NavigationIndicatorController`
follow it, so the navigation bar and rail indicator stay on the current
link when a page switches direction at runtime, and localized component
text re-renders when a page switches language.
