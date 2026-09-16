---
'@rcarls/rc-disclosure': minor
'@rcarls/rc-accordion': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
---

Give `rc-disclosure` and `rc-accordion` a public styling contract.

Both were styled by targeting the native `<details>` element directly, so neither exposed a
single `--rc-*` property and no theme could change them without rewriting theme CSS. They now
follow the light-DOM base pattern `rc-button` and `rc-listbox` already use: `rc-disclosure`
installs one structural stylesheet per containing `Document` or `ShadowRoot`, in `@layer rc-base`
behind a `data-rc-light-dom-base` sentinel, reading documented properties with UA-like defaults.

One recipe covers both supported child forms, a bare `<details>` inside `rc-accordion` and one
wrapped in `rc-disclosure`, so neither theme repeats the panel rules. `rc-accordion` owns only
`--rc-accordion-gap`.

Motion is opt-in. `--rc-disclosure-duration` defaults to `0ms`, so a disclosure with no theme keeps
the platform's snap-open behavior, and the height animation runs on `::details-content` behind a
`@supports selector()` check. This replaces Material's `60rem` `max-block-size` ceiling, which
clipped content taller than the guess and made every non-summary child its own animation unit.

**Fixes a missing expand affordance in the Material theme.** It set `display: grid` on the
`<summary>` and then styled `summary::marker`. Any `display` other than `list-item` drops the
marker box, so that rule styled nothing and the theme drew no replacement: a Material disclosure
had no disclosure triangle at all. The base layer never sets `display` on a summary, so the
marker survives. A theme may still change it, as Substrate does, but only alongside a
replacement affordance.
