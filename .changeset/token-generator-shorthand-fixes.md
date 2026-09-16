---
'@rcarls/rc-theme-material': patch
---

Fix two token generator defects that produced plausible but wrong output.

A font shorthand read as a single number. `var(--weight, 500) var(--size, 1rem) / var(--lh)
var(--family)` both starts and ends with `var(`, and the anchored pattern's fallback group is
greedy, so it matched as one `var(--weight)` whose fallback was the rest of the declaration and
resolved to `500`. The export carried `card/title-font` and `card/subtitle-font` as floats that
were really a collapsed shorthand. A value now counts as an alias only when its opening `var(`
closes at the end of the string.

A mix weight written as a `calc` only worked by accident. Material writes its state layers as
`color-mix(in srgb, var(--color) calc(var(--opacity, 0.08) * 100%), transparent)`. The old code
pattern-matched a trailing percentage off the operand, leaving a malformed remainder that
happened to resolve through the greedy match above. Mix operands are now split at parenthesis
depth zero and the weight resolves through the same resolver.
