---
'@rcarls/rc-field': patch
---

Suppress Chromium's tap-highlight flash on the native control. Firefox has no
equivalent behavior, so an unstyled control only flashed on Chrome despite the
existing focus-outline reset.
