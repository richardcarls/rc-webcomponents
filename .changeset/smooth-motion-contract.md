---
'@rcarls/rc-bottom-sheet': minor
'@rcarls/rc-chip': patch
'@rcarls/rc-theme-material': minor
'@rcarls/rc-textarea': patch
'@rcarls/rc-webcomponents': patch
---

Add theme-neutral fast, default, and slow effects and spatial motion token
pairs. Expose bottom-sheet settle easing through
`--rc-bottom-sheet-snap-easing` and map sheet settling to the Material spatial
motion scheme.

Give direct-child bottom-sheet handles a full-width 48px interaction target
while preserving the 32 by 4 pixel visual indicator. Replace rectangular
mobile browser tap highlights on chips with themeable, shape-clipped state
layers. Keep bottom-sheet snap targets docked to the block-end edge when CSS
minimum or maximum sizing constrains their requested heights.

Mount declaratively assigned textarea plugins at connection time and remount
them after reconnection, preserving plugin effects and adopted styles in
framework render lifecycles.
