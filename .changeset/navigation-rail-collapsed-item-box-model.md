---
'@rcarls/rc-navigation-rail': patch
'@rcarls/rc-theme-material': patch
'@rcarls/rc-theme-substrate': patch
---

Fix collapsed `rc-navigation-rail` items so the whole item's box wraps icon and
label, not just the icon. The shared component pulled the label out of flow
(`position: absolute`), so a theme's whole-item background or focus ring only
covered the icon; Material's detached-pill layout now lives in its own theme
stylesheet instead of the shared base. Substrate's collapsed rail also grows
from `5rem` to `6rem` so single-word labels like "Settings" stop wrapping.
