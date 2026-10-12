---
'@rcarls/rc-theme-material': minor
---

Draw Material disclosures as expandable list items. The summary now centers its
title in the 56px row and replaces the native disclosure triangle with a
trailing chevron that points down while closed and turns to point up while open,
the Android expandable-list-item affordance. The chevron keeps that direction in
RTL and vertical writing modes and stops turning under reduced motion.

Accordions now group their panels like a segmented `rc-list`: a 2px gap instead
of 8px, no outline, extra-small inner corners, and extra-large logical outer
corners on the first and last panel. A standalone `rc-disclosure` keeps its
outlined, uniformly rounded panel. This also removes a duplicate
`--rc-accordion-gap` declaration in `disclosure.css` that the accordion rule
always overrode.
