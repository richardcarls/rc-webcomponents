---
'@rcarls/rc-app-bar': minor
---

Change the default `slot="center"` layout: it now fills the flexible space
between leading and trailing, capped by the new
`--rc-app-bar-center-max-inline-size` before it centers within available
space instead of continuing to stretch, rather than always mirroring the
leading/trailing edges to stay exactly viewport-centered. Add the new
`center-symmetric` attribute to keep the previous behavior (exact
viewport-centering regardless of asymmetric leading/trailing widths).
