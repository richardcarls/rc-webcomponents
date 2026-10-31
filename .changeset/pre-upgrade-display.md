---
'@rcarls/rc-webcomponents': minor
---

Adds `@rcarls/rc-webcomponents/themes/pre-upgrade.css`, which gives every shadow-DOM element
the `display` it takes once defined while it is still undefined. A server-rendered page that
links it early no longer reflows when the elements register. The values are generated from
each element's own `:host` styles at build time.
