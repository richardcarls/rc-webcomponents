---
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
---

`rc-theme-material` and `rc-theme-substrate` refine `prefers-reduced-motion:
reduce` from removing every transition and animation to removing only
spatial motion; effects motion (color and opacity) is kept, shortened.
Vestibular harm, the reason for the preference, comes from movement across
the visual field; a color or opacity change doesn't trigger it, and removing
it too was also removing motion that aids comprehension.

Material's effects duration shortens to 50/70/100&nbsp;ms (from its full
150/200/300&nbsp;ms scale); Substrate's to 40/55/70&nbsp;ms, scaled down from
its own faster 100/160/240&nbsp;ms base. `rc-theme-win31` needs no change: it
already declares every duration at zero unconditionally.

Several component recipes that bypassed the shared motion scale entirely,
referencing a raw duration primitive directly, are rewired to the
appropriate effects or spatial token so this refinement actually reaches
them: Material's `rc-disclosure`, `rc-list-item`, `rc-bottom-sheet`'s snap
duration, `rc-button`'s ripple, and its shared state-layer opacity fade;
Substrate's `rc-listbox`, `rc-splitter`, and `rc-disclosure`. Most land on
their existing value exactly; `rc-button`'s ripple duration normalizes from
450&nbsp;ms to 500&nbsp;ms, the nearest real spatial tier.
