---
version: material-3-baseline
name: rc-theme-material
description: >
  Material Design 3 composition guide for building Android-style progressive
  web apps from rc-webcomponents with the rc-theme-material theme. Values below
  include the M3 baseline tokens the theme vendors in defaults.css and
  composition guidance for spacing; an app that brings its own scheme
  overrides the matching --md-sys-* variables.

colors:
  # Light / dark pairs resolve through light-dark() on --md-sys-color-*.
  primary: '#6750a4' # --md-sys-color-primary
  on-primary: '#ffffff'
  primary-container: '#eaddff'
  on-primary-container: '#21005d'
  secondary: '#625b71'
  on-secondary: '#ffffff'
  secondary-container: '#e8def8' # selection indicators, tonal buttons
  on-secondary-container: '#1d192b'
  tertiary: '#7d5260'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffd8e4'
  on-tertiary-container: '#31111d'
  error: '#b3261e'
  on-error: '#ffffff'
  error-container: '#f9dedc'
  on-error-container: '#410e0b'
  surface: '#fdf8fd' # page, app bar at rest, rail
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f2f8' # cards, sheets, disclosures, chips
  surface-container: '#f2ecf2' # navigation bar, scrolled app bar
  surface-container-high: '#ece6ec' # dialogs
  surface-container-highest: '#e6e1e5' # filled text fields
  on-surface: '#1c1b1f'
  on-surface-variant: '#49454f'
  outline: '#79747e'
  outline-variant: '#cac4d0'
  inverse-surface: '#313033' # snackbar
  inverse-on-surface: '#f4eff4'
  inverse-primary: '#d0bcff'
  scrim: '#000000'

  primary-dark: '#d0bcff'
  on-primary-dark: '#381e72'
  primary-container-dark: '#4f378b'
  secondary-container-dark: '#4a4458'
  error-dark: '#f2b8b5'
  surface-dark: '#141317'
  surface-container-low-dark: '#1c1b1f'
  surface-container-dark: '#211f23'
  surface-container-high-dark: '#2b292e'
  surface-container-highest-dark: '#363438'
  on-surface-dark: '#e6e1e5'
  on-surface-variant-dark: '#cac4d0'
  outline-dark: '#938f99'
  outline-variant-dark: '#49454f'

typography:
  # --md-sys-typescale-<role>-<size>-{font,weight,size,line-height,tracking}
  display-large:
    fontFamily: Roboto
    fontSize: 57px
    fontWeight: 400
    lineHeight: 64px
    letterSpacing: -0.25px
  display-medium:
    fontFamily: Roboto
    fontSize: 45px
    fontWeight: 400
    lineHeight: 52px
    letterSpacing: 0
  display-small:
    fontFamily: Roboto
    fontSize: 36px
    fontWeight: 400
    lineHeight: 44px
    letterSpacing: 0
  headline-large:
    fontFamily: Roboto
    fontSize: 32px
    fontWeight: 400
    lineHeight: 40px
    letterSpacing: 0
  headline-medium:
    fontFamily: Roboto
    fontSize: 28px
    fontWeight: 400
    lineHeight: 36px
    letterSpacing: 0
  headline-small:
    fontFamily: Roboto
    fontSize: 24px
    fontWeight: 400
    lineHeight: 32px
    letterSpacing: 0
  title-large:
    fontFamily: Roboto
    fontSize: 22px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0
  title-medium:
    fontFamily: Roboto
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: 0.15px
  title-small:
    fontFamily: Roboto
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.1px
  body-large:
    fontFamily: Roboto
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0.5px
  body-medium:
    fontFamily: Roboto
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0.25px
  body-small:
    fontFamily: Roboto
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0.4px
  label-large:
    fontFamily: Roboto
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.1px
  label-medium:
    fontFamily: Roboto
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.5px
  label-small:
    fontFamily: Roboto
    fontSize: 11px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.5px

rounded:
  # --md-sys-shape-corner-*
  none: 0px
  extra-small: 4px # snackbar, inner corners of segmented lists and accordions
  small: 8px # chips, menus
  medium: 12px # cards
  large: 16px # standalone disclosures, FAB
  extra-large: 28px # dialogs, bottom sheet top corners, segmented group ends
  full: 999px # buttons, icon buttons, navigation indicators

spacing:
  # 4dp grid. Window margins follow the width class.
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px # compact window margin, list inline padding
  '6': 24px # medium+ window margin, dialog padding
  pane-gap: 24px # between panes in list-detail and supporting-pane layouts
  touch-target: 48px # minimum activation area (components reserve 3rem)

components:
  button-filled:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label-large}'
    rounded: '{rounded.full}'
    height: 40px
  button-tonal:
    backgroundColor: '{colors.secondary-container}'
    textColor: '{colors.on-secondary-container}'
    rounded: '{rounded.full}'
  button-outlined:
    textColor: '{colors.primary}'
    borderColor: '{colors.outline-variant}'
    rounded: '{rounded.full}'
  button-text:
    textColor: '{colors.primary}'
    rounded: '{rounded.full}'
  icon-button:
    size: 40px
    iconSize: 24px
    rounded: '{rounded.full}'
  fab:
    backgroundColor: '{colors.primary-container}'
    textColor: '{colors.on-primary-container}'
    size: 56px
    rounded: '{rounded.large}'
  top-app-bar:
    backgroundColor: '{colors.surface}'
    scrolledBackgroundColor: '{colors.surface-container}'
    typography: '{typography.title-large}'
    height: 64px
  navigation-bar:
    backgroundColor: '{colors.surface-container}'
    indicatorColor: '{colors.secondary-container}'
    typography: '{typography.label-medium}'
  navigation-rail:
    backgroundColor: '{colors.surface}'
    indicatorColor: '{colors.secondary-container}'
  card:
    backgroundColor: '{colors.surface-container-low}'
    rounded: '{rounded.medium}'
    padding: 16px
  list-item:
    minHeight: 56px
    paddingInline: 16px
    typography: '{typography.body-large}'
  segmented-list:
    itemBackgroundColor: '{colors.surface-container-low}'
    gap: 2px
    outerRadius: '{rounded.extra-large}'
    innerRadius: '{rounded.extra-small}'
  dialog:
    backgroundColor: '{colors.surface-container-high}'
    rounded: '{rounded.extra-large}'
    padding: 24px
    minWidth: 280px
    maxWidth: 560px
    headline: '{typography.headline-small}'
  full-screen-dialog:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.none}'
    header: top-app-bar
  bottom-sheet:
    backgroundColor: '{colors.surface-container-low}'
    rounded: '{rounded.extra-large}'
    handle: 32x4px
  side-sheet:
    backgroundColor: '{colors.surface-container-low}'
    rounded: '{rounded.large}'
    maxWidth: 400px
  chip:
    backgroundColor: '{colors.surface-container-low}'
    selectedBackgroundColor: '{colors.secondary-container}'
    typography: '{typography.label-large}'
    rounded: '{rounded.small}'
    height: 32px
  text-field:
    backgroundColor: '{colors.surface-container-highest}'
    indicatorColor: '{colors.on-surface-variant}'
    focusColor: '{colors.primary}'
    typography: '{typography.body-large}'
  snackbar:
    backgroundColor: '{colors.inverse-surface}'
    textColor: '{colors.inverse-on-surface}'
    actionColor: '{colors.inverse-primary}'
    rounded: '{rounded.extra-small}'
---

# rc-theme-material design guide

This guide is for AI coding agents (and the people working with them)
building an app from rc-webcomponents with `@rcarls/rc-theme-material`. It
covers what importing the theme does not: which component fills which
Material 3 role, how components combine into an Android-style app, and how a
layout adapts across window sizes.

It is written from the Material 3 guidelines and Android's adaptive-app
guidance. Where the theme deliberately deviates, or does not yet cover a
pattern, the section says so. Attribute and token reference lives on the
[docs site](https://richardcarls.github.io/rc-webcomponents/); this guide
names only what composition needs.

## Overview

Three owners, kept apart:

| Owner             | Owns                                                                                             | Never owns                                  |
| ----------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| rc-webcomponents  | Semantics, ARIA, keyboard support, focus, events, structural layout                              | Color, elevation, decorative shape          |
| rc-theme-material | Material geometry, color roles, typography, elevation, motion, state layers                      | Behavior, ARIA, which actions exist         |
| Your app          | Information architecture, routes, state, which component is used where, responsive mode switches | Component internals (`--_rc-*`, shadow DOM) |

Rules that follow from this:

- **Build on native children where required.** Components such as `rc-button`,
  `rc-dialog`, `rc-disclosure` and `rc-field` wrap an authored `<button>`,
  `<dialog>`, `<details>` or `<input>`. Keep required native children in the DOM
  and label them; they carry the accessibility and form behavior. Containers
  such as `rc-app-bar` and `rc-accordion` have different child contracts.
- **Style through tokens.** Adapt with `--md-sys-*` (system) and
  `--rc-<component>-*` (component) properties, theme classes and documented
  `data-*` hooks. Never target shadow internals or `--_rc-*` private tokens.
- **Switch modes from app state.** Window-size changes that alter behavior
  (navigation bar to rail, full-screen to basic dialog, docked search to search
  view) are attribute or property writes from your code, not CSS.

## Setup beyond import

### Entry points

```css
/* Standalone: baseline light and dark scheme, bridge, component styles. */
@import '@rcarls/rc-theme-material/theme.css';
```

```css
/* Your app already defines --md-sys-* (for example from Material Theme Builder). */
@import '@rcarls/rc-theme-material/bridge.css';
@import '@rcarls/rc-theme-material/components.css';
```

```css
/* Only what you use. */
@import '@rcarls/rc-theme-material/bridge.css';
@import '@rcarls/rc-theme-material/components/button.css';
@import '@rcarls/rc-theme-material/components/dialog.css';
@import '@rcarls/rc-theme-material/state-layer.css';
```

To bring a brand scheme, generate one with Material Theme Builder and declare
its `--md-sys-color-*` values on the theme scope, after the import. Keep the
roles and their pairings; change only the values.

### Scope and color scheme

The theme applies inside `.rc-theme-material`. Put it on `<html>` so dialogs,
sheets and popovers rendered in the top layer stay in scope:

```html
<html class="rc-theme-material" lang="en">
  <head>
    <meta name="color-scheme" content="light dark" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#fdf8fd" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#141317" media="(prefers-color-scheme: dark)" />
  </head>
</html>
```

Colors resolve through `light-dark()`, so `color-scheme` picks light or dark.
For a user override, set `color-scheme: light` or `dark` on the scope; do not
swap stylesheets.

### Cascade layers

The theme declares `rc-base`, then its `defaults`, `bridge` and `components`
layers. App CSS outside any layer outranks every layer, so app rules win without
`!important`. If your app uses layers, declare yours after the theme's.

### Fonts and icons

Neither ships with the theme. Load Roboto (or your brand face, set through
`--md-sys-typescale-*-font` and `--md-ref-typeface-*`) and an icon font, then
give every icon marker the font in one rule:

```css
:is(
  [data-rc-icon],
  [data-rc-button-icon],
  [data-rc-button-selected-icon],
  [data-rc-chip-icon],
  [data-rc-list-leading],
  [data-rc-menu-icon],
  [data-rc-menu-leading],
  [data-rc-navigation-icon],
  [data-rc-navigation-collapse-icon],
  [data-rc-navigation-expand-icon],
  [data-rc-segmented-button-selected-icon]
) {
  font-family: 'Material Symbols Outlined';
}
```

Without it, markers render their ligature text (`menu`, `close`). The rule
includes the list and menu leading markers, which hold icons in list rows and
in actions that `rc-adaptive-menu` promotes or overflows. Three
markers get no sizing from the theme, so give them a `font-size` as well:
`data-rc-navigation-collapse-icon`, `data-rc-navigation-expand-icon` and
`data-rc-segmented-button-selected-icon`. The rest follow
`--rc-icon-font-size` and `--rc-icon-font-line-height`.

Mark decorative icons `aria-hidden="true"` and put the accessible name on the
control.

## Colors

- **Pair roles.** Text and icons on a role use its `on-*` partner:
  `on-primary` on `primary`, `on-secondary-container` on
  `secondary-container`. Never put `primary` text on `primary-container`.
- **One accent per view.** `primary` marks the single most important action
  or state. `secondary-container` marks selection: navigation indicators,
  selected chips, tonal buttons, pressed toolbar buttons. `tertiary` is for
  contrasting accents, not a second primary.
- **Surfaces climb the container ladder** instead of casting shadows:

  | Role                        | Use                                                                       |
  | --------------------------- | ------------------------------------------------------------------------- |
  | `surface`                   | Page background, top app bar at rest, navigation rail, full-screen dialog |
  | `surface-container-low`     | Cards, bottom and side sheets, disclosures, segmented list items, chips   |
  | `surface-container`         | Navigation bar, scrolled app bar, toolbars, menus' listbox                |
  | `surface-container-high`    | Basic dialogs                                                             |
  | `surface-container-highest` | Filled text fields                                                        |

  Content inside a container uses a step **below** it, so a card on a dialog
  is `surface-container-low`, never the dialog's own step (it would vanish).

- **Error is a tone, not a component.** Add `data-tone="danger"` to a button
  variant for destructive actions; `rc-field` shows error state from native
  validity or `invalid`.
- **Color never carries meaning alone.** Pair it with text, an icon or shape.
- **Forced colors** are handled by the theme with system colors. Do not
  re-add custom colors inside `@media (forced-colors: active)`.

## Typography

Use the type scale through `--md-sys-typescale-<role>-<size>-*`. Common
assignments:

| Element                              | Role                                                      |
| ------------------------------------ | --------------------------------------------------------- |
| Top app bar title                    | title-large (medium/large bars: headline-small/medium)    |
| Dialog headline                      | headline-small                                            |
| Section header above a list or group | title-small, `primary` or `on-surface-variant`            |
| List item headline / supporting text | body-large / body-medium in `on-surface-variant`          |
| Card title / subtitle                | title-medium / body-medium                                |
| Buttons, chips, tabs                 | label-large                                               |
| Navigation labels                    | label-medium                                              |
| Body copy                            | body-large on compact, body-medium in dense desktop panes |

```css
.section-heading {
  margin: 0;
  font: var(--md-sys-typescale-title-small-weight) var(--md-sys-typescale-title-small-size) /
    var(--md-sys-typescale-title-small-line-height) var(--md-sys-typescale-title-small-font);
  letter-spacing: var(--md-sys-typescale-title-small-tracking);
  color: var(--md-sys-color-primary);
}
```

Keep reading measure near 40–75 characters; widen panes, not lines.

For a reading region, add `data-rc-type-scale` and set a positive
`--rc-type-scale` factor. With `theme.css`, the Material type sizes and line
heights and the RC text tokens derived from them scale inside the region.
With `bridge.css` alone, RC text tokens scale from the application's Material
values while those Material tokens remain unchanged. A nested marked region
uses its own factor. The front matter above records the unscaled bundled
`*-value` sources; update those source tokens alongside branded final values.

```html
<main data-rc-type-scale style="--rc-type-scale: 1.25">…</main>
```

## Layout and window size classes

### Size classes

Use Android's window size classes. Read them from the viewport in app code
(`matchMedia`) and expose them as state:

| Width class | Range       | Navigation                            | Typical layout                                  |
| ----------- | ----------- | ------------------------------------- | ----------------------------------------------- |
| Compact     | < 600px     | Navigation bar                        | Single pane, full-screen dialogs, bottom sheets |
| Medium      | 600–839px   | Navigation rail                       | Single pane, wider margins, basic dialogs       |
| Expanded    | 840–1199px  | Navigation rail (optionally expanded) | List-detail, supporting pane                    |
| Large       | 1200–1599px | Expanded rail                         | Two panes with a bounded detail track           |
| Extra-large | ≥ 1600px    | Expanded rail                         | Same composition, larger margins                |

| Height class | Range     | Effect                                                                                                          |
| ------------ | --------- | --------------------------------------------------------------------------------------------------------------- |
| Compact      | < 480px   | Landscape phone: prefer the navigation bar, move bottom actions to the inline end, dock panes instead of sheets |
| Medium       | 480–899px | Standard                                                                                                        |
| Expanded     | ≥ 900px   | More vertical room; do not stretch reading measure                                                              |

Android's default navigation suite shows a navigation bar when the width
**or** height is compact, and a rail otherwise
(`NavigationSuiteScaffoldDefaults.calculateFromAdaptiveInfo` in the `androidx`
`material3-adaptive-navigation-suite` library). Its newer `navigationSuiteType`
uses a short bar with each label beside its icon at compact height.

At compact height, list and reading screens follow these patterns:

- **App bars** hide on scroll and give their space back; see
  [Components and composition patterns](#components-and-composition-patterns)
  for the layout recipe.
- **Sheets** leave the screen. Controls that shape the content, such as
  filters, dock as a pane at the inline start. Content about the selection,
  such as nutrition, becomes a second column that scrolls with the page: a
  pane pinned at the inline end would push the FAB toward the middle of the
  screen, while a scrolling column lets the FAB keep its corner and float
  over it like any other content. A short form is a full-screen dialog. See
  [Sheets and the FAB](#sheets-and-the-fab).
- **Dialogs** for multi-field tasks are full-screen.
- **Tall media** is capped by the pane's height. Make the scroll region a
  `container-type: size` container, which is safe because layout already
  gives it a definite size, and query its height or use `cqb` units: a
  window media query cannot see how much the bars and panes have taken.
- **Sticky chip rows** stay on one row (`rc-chip-group max-rows="1"`).

```js
const widthClass = () =>
  matchMedia('(min-width: 840px)').matches
    ? 'expanded'
    : matchMedia('(min-width: 600px)').matches
      ? 'medium'
      : 'compact';
```

Measure when your app shell mounts and on resize, not once at module load.

### Canonical layouts

- **List-detail.** Compact shows the list or the detail, routed. Expanded
  shows both side by side; selection drives the detail. Use CSS grid with a
  bounded list track (about 360px), or `rc-splitter` when the user should
  resize. Keep the URL as the source of truth for the selection so back
  navigation works at every size.
- **Supporting pane.** Primary content plus a secondary pane (filters,
  details). Compact width moves the pane into a bottom sheet or below the
  content; medium and wider dock it beside the content. Content that stays
  relevant throughout the task belongs in a persistent pane once the
  container is wide enough; a transient overlay is for one-off tasks. Decide
  from the container's width, not the device type. In compact-height
  landscape, dock the pane from medium width instead of using a sheet.
- **Pane order.** Panes that shape the content, such as filters and sort,
  dock at the inline start, after the navigation rail: rail, filters,
  content. Panes about the current content, such as nutrition or details,
  dock at the inline end; at compact height they scroll with the content
  instead (see the compact-height list above). The FAB sits in the rail's header or floats at the
  bottom inline end, so neither pane ever has to make room for it.
- **List-detail Back.** Show Back in the single-pane presentation; suppress it
  only while the parent list is visible beside the detail.
- **Feed.** A grid of cards whose column count comes from container width:

  ```css
  .feed {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
    gap: 1rem;
  }
  ```

### Choosing the adaptive mechanism

From narrowest to broadest:

1. One geometry token, such as `--rc-carousel-slide-size`.
2. A coordinated token set for tracks or placement, as with `rc-card` and
   `rc-list-item` region tokens, often inside a container query.
3. An attribute or property written from app state when the mode changes
   ARIA, keyboard behavior, focus, popup placement or rendered controls:
   `rc-dialog variant`, `rc-search-bar variant`, `rc-navigation-rail
expanded`, `rc-adaptive-menu max-shown`, `rc-splitter orientation`,
   `rc-toolbar orientation`.
4. A component's own `auto` mode, only where it measures a failure it owns,
   such as `rc-chip-group layout="auto"` with `max-rows`.

Container queries style descendants; they cannot set attributes. Never hide
controls with CSS to "move" them; use `rc-adaptive-menu` so hidden actions
reach the overflow menu.

### Edge-to-edge

- Draw backgrounds behind system bars; keep controls inside
  `env(safe-area-inset-*)`. The full-screen dialog variant pads with safe-area
  insets already.
- Use `dvh` (or the dialog's visual-viewport tracking) for full-height
  surfaces so the on-screen keyboard does not hide actions.
- Keep drag targets (sheet handles, splitters) away from system gesture
  edges.
- Use logical properties (`padding-inline`, `inset-block-end`) in app CSS so
  RTL and vertical writing modes work.

## Elevation & Depth

- Material 3 expresses depth mostly through **tonal surface roles**; shadows
  are reserved for floating elements (FAB, menus, dialogs, elevated cards).
- The theme maps shadows to `--rc-shadow-level0` through `--rc-shadow-level4`
  and drops them where M3 does, such as a FAB in the navigation rail header.
- The app bar does not cast a shadow when content scrolls under it: it
  changes to `surface-container`. Wire `scroll-target` so this happens.
- Scrims are `scrim` at 32% for modal dialogs and sheets; non-modal sheets
  have none.

## Shapes

| Component                                    | Corner                                                      |
| -------------------------------------------- | ----------------------------------------------------------- |
| Buttons, icon buttons, navigation indicators | full                                                        |
| Snackbar                                     | extra-small                                                 |
| Chips, menus                                 | small                                                       |
| Cards                                        | medium                                                      |
| FAB, standalone disclosure                   | large                                                       |
| Side sheet leading corners                   | large                                                       |
| Dialogs, bottom sheet top corners            | extra-large                                                 |
| Full-screen dialog                           | none                                                        |
| Segmented list or accordion group            | extra-large outer ends, extra-small inner corners, 2px gaps |

Do not round a single element inside a group; the theme assigns group
corners from position (`data-rc-list-position` on list items,
`:first-child`/`:last-child` in accordions).

## Motion

The theme splits motion into **spatial** (position, size) and **effects**
(color, opacity) scales, bridged from Material durations and easing curves to
`--rc-motion-spatial-*` and `--rc-motion-effects-*`.

- Use standard easing for recurring, small changes (state layers, chips,
  toggles). Reserve emphasized and expressive motion for prominent container
  or route transitions.
- Effects motion never overshoots.
- Don't apply expressive motion to repeated progression, timers or
  decorative loops.
- Under `prefers-reduced-motion`, the theme zeroes spatial durations and
  shortens effects durations. Your app's own transitions should read the same
  tokens so they follow suit:

  ```css
  .pane {
    transition: translate var(--rc-motion-spatial-duration-default)
      var(--rc-motion-spatial-easing-default, ease);
  }
  ```

See the [motion guide](https://richardcarls.github.io/rc-webcomponents/guide/motion).

## Components and composition patterns

Each pattern names the Material role, the composition, and the theme hooks.

### App shell

A standard screen is a top app bar, the content region it observes, one
navigation component chosen by size class, and at most one FAB.

```html
<body>
  <rc-app-bar scroll-target="#content">
    <h1 class="app-title">Library</h1>
    <rc-adaptive-menu slot="trailing" label="Library actions" max-shown="1">
      <rc-button icon-only class="rc-icon-button--standard" data-priority="20">
        <button type="button" aria-label="Search">
          <span data-rc-menu-leading aria-hidden="true">search</span>
          <span data-rc-menu-label>Search</span>
        </button>
      </rc-button>
      <rc-button class="rc-button--text" slot="overflow">
        <button type="button"><span data-rc-menu-label>Settings</span></button>
      </rc-button>
    </rc-adaptive-menu>
  </rc-app-bar>

  <nav aria-label="Main">
    <rc-navigation-bar><!-- compact: links --></rc-navigation-bar>
  </nav>

  <main id="content">…</main>

  <rc-fab>
    <button type="button">
      <span data-rc-icon aria-hidden="true">add</span>
      New item
    </button>
  </rc-fab>
</body>
```

```css
.app-title {
  margin: 0;
  font-weight: inherit;
}
```

- **Top app bar.** The default is the small bar. Add
  `variant="expanded"` with `.rc-app-bar--medium` or `.rc-app-bar--large` for
  headline-sized titles on top-level screens, plus `scroll-behavior="collapse"`
  to shrink on scroll. `.rc-app-bar--center-aligned` is for a single centered
  title on a root screen. `scroll-behavior="hide"` suits long reading views.
  Always set `scroll-target` to the element that actually scrolls.
- **Compact height.** On a landscape phone, list and reading screens hide
  the top app bar on scroll (`scroll-behavior="hide"`), and an expanded bar
  starts compact. Stack the bar over its scroll container and reserve
  `var(--rc-app-bar-block-size)` as the container's block-start padding and
  scroll padding. Sticky offsets are measured inside that padding, so sticky
  content below the bar pins at `calc(var(--rc-app-bar-visible-block-size) -
var(--rc-app-bar-block-size))`; both values are published on the bar's
  scroll target. Hands-busy task bars and full-screen dialog bars stay pinned,
  since they carry actions the task needs.
- **App bar title.** The title slot holds the screen's one page heading, so
  the body doesn't repeat it. A collapsed or small bar shows one line with an
  ellipsis; an expanded title may wrap to a few lines before clipping. Put
  status (step, sync state) in a one-line subtitle under the title. Never put
  a progress indicator in a top app bar: it is not part of the M3 anatomy.
- **App bar actions** are 24px icons centered in independent 48px targets.
  Don't let margins meant for labeled buttons shrink or offset them.
- **App bar slots.** `leading` holds back or close (never a hamburger when a
  rail is visible). `trailing` holds at most two or three icon actions; put
  the rest in `rc-adaptive-menu` overflow. Author each action as an
  `rc-button`: icon-only with `.rc-icon-button--standard` when promoted, and
  `.rc-button--text` with `slot="overflow"` when it should always stay in the
  menu. Larger `data-priority` values are promoted first, up to `max-shown`.
  The component never measures space, so write `max-shown` from size-class
  state. Utilities like Settings and Help belong in overflow, not in
  navigation.
- **Navigation.** Three to five top-level destinations. Don't render a
  navigation suite with a single destination, or with disabled or unreleased
  ones; until there are two, the app bar title links home and utilities live
  in overflow. Render
  `rc-navigation-bar` on compact width or compact height, and
  `rc-navigation-rail` otherwise; switch the element from app state, keeping
  the same links and `aria-current="page"`. Put the screen's FAB in the rail's
  `header` slot when the rail is shown (the theme removes its shadow there).
  `expanded` on the rail shows labels beside icons on expanded and wider
  windows.
- **FAB.** One per screen, for the screen's primary constructive action.
  `.rc-fab--small` and `.rc-fab--large` change size; an icon plus label makes
  an extended FAB. Anchor with `position` and keep it clear of the navigation
  bar. `scroll-reveal` suits a back-to-top button, not the primary action. Use
  `rc-fab-menu` when the action needs two to six choices.
- **Floating layer.** The FAB and other floating controls clear whatever is
  docked at the bottom: the navigation bar, and a persistent sheet's peek by
  16px plus the safe-area inset.

### Actions and emphasis

| Emphasis    | Hook                                                                               | Use                                                          |
| ----------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| High        | `rc-button` (filled, default)                                                      | The one primary action in a view or dialog                   |
| Medium-high | `.rc-button--tonal`                                                                | Important but not primary; a secondary action next to filled |
| Medium      | `.rc-button--outlined`                                                             | Alternatives that need a boundary                            |
| Low         | `.rc-button--text`                                                                 | Dialog dismiss, inline and tertiary actions                  |
| Icon only   | `rc-button[icon-only]` with `.rc-icon-button--standard`, `--tonal` or `--outlined` | Toolbars, app bars, list trailing actions                    |

```html
<rc-button class="rc-button--text"><button type="button">Cancel</button></rc-button>
<rc-button><button type="submit">Save</button></rc-button>

<rc-button icon-only class="rc-icon-button--standard">
  <button type="button" aria-label="Edit">
    <span data-rc-button-icon aria-hidden="true">edit</span>
  </button>
</rc-button>

<rc-button class="rc-button--outlined" data-tone="danger">
  <button type="button">Delete account</button>
</rc-button>
```

- **One filled button per view.** If two compete, demote one.
- Icon buttons default to the small size (40px container). Use
  `.rc-button--extra-small` to `.rc-button--extra-large`, plus `.rc-button--narrow`
  or `.rc-button--wide`, for expressive sizes. Every size keeps a 48px
  activation area.
- Toggle buttons use `rc-button toggle` with `data-rc-button-icon` and
  `data-rc-button-selected-icon`; selection shows by shape and color, and is
  announced through `aria-pressed`.
- Menus open from `rc-menu-button`; give an icon-only trigger an accessible
  name. `.rc-menu-button--narrow` is for tight app-bar trailing groups.
  A submenu row's trailing glyph goes in the nested `rc-menu-button`'s
  `indicator` slot; `rc-menu` never generates one.
- Put an icon before the label, never after it.

### Dialogs

Material has two dialog presentations. Choose by window size class, in both
dimensions, and write the choice from app state:

|         | Basic dialog                                                      | Full-screen dialog                                                        |
| ------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| When    | Medium and wider; short tasks and confirmations on any size       | Compact width or compact height; multi-field tasks or long content        |
| Surface | `surface-container-high`, extra-large corners, 280–560px wide     | `surface`, no corners, fills the visual viewport                          |
| Header  | Headline (optional icon above it)                                 | Small top app bar: close (×) leading, title, confirm text button trailing |
| Actions | Footer, end-aligned: dismiss as text, confirm as filled (or text) | Confirm in the app bar; no footer                                         |

```html
<!-- Basic: confirmation -->
<rc-dialog id="discard">
  <dialog aria-labelledby="discard-title">
    <h2 id="discard-title">Discard draft?</h2>
    <p>Your changes will be lost.</p>
    <form method="dialog" class="dialog-actions">
      <rc-button class="rc-button--text">
        <button value="cancel">Keep editing</button>
      </rc-button>
      <rc-button class="rc-button--text" data-tone="danger">
        <button value="discard">Discard</button>
      </rc-button>
    </form>
  </dialog>
</rc-dialog>
```

```html
<!-- Full-screen on compact: an app bar carries both actions -->
<rc-dialog id="edit" variant="fullscreen">
  <dialog aria-labelledby="edit-title">
    <rc-app-bar scroll-target="#edit-body">
      <button slot="leading" type="button" aria-label="Cancel">
        <span data-rc-icon aria-hidden="true">close</span>
      </button>
      <h2 id="edit-title">Edit item</h2>
      <rc-button slot="trailing" class="rc-button--text">
        <button type="submit" form="edit-form">Save</button>
      </rc-button>
    </rc-app-bar>
    <div id="edit-body" class="dialog-body">
      <form id="edit-form" method="dialog">…</form>
      <!-- Close button: call close() or requestClose() on the rc-dialog. -->
    </div>
  </dialog>
</rc-dialog>
```

- **Adapt one dialog, don't fork it.** At the 600px width or 480px height
  boundary, switch `variant` between `fullscreen` and `standard` and move the two actions between the app
  bar and the footer. If a button had focus, return focus to the same action
  in its new position after the components finish rendering (await the app
  bar's `updateComplete` before focusing a slotted button).
- **Reset heading styles** on an `<h2>` used as an app bar or dialog title
  (`margin: 0; font: inherit`, then the title or headline type role); the
  theme styles the slot, not your heading's UA defaults.
- **Scroll a body region**, never the dialog surface; the app bar's
  `scroll-target` points at it.
- **Size task dialogs to their maximum.** A basic dialog fits its content, so
  a dialog whose content is fluid (a search field, a list) shrinks to its
  280px minimum. Set `--rc-dialog-inline-size: 100%` on it to use the full
  560px.
- **Dialog actions are content-sized** and aligned to the inline end, dismiss
  before confirm, each with a 48px target. They wrap only when text scaling or
  width requires it and never stretch into full-width rows (Android's
  `dismissButton`/`confirmButton` model).
- **Dismiss is never destructive.** Back, Escape and the scrim all cancel.
  Set `light-dismiss` only for dialogs whose dismissal loses nothing.
- **Single-choice dialogs** for enumerated settings use native radios in an
  `rc-list selection="single"` and commit on confirm, or immediately on
  selection when there is no confirm button.
- **Confirmations** state the consequence in the headline, put the
  destructive action last with `data-tone="danger"`, and label buttons with
  verbs rather than OK.
- Use `default-open` for an initially open uncontrolled dialog; `open` makes
  the dialog controlled (see [Framework notes](#framework-notes)).

### Bottom sheets

`rc-bottom-sheet` wraps a `<dialog>`. Use `showModal()` for a modal sheet
(scrim, focus trapped) and `show()` for a standard, non-modal sheet that
coexists with the page.

```html
<rc-bottom-sheet id="filters" snap-points="50dvh 90dvh" swipe-dismiss>
  <dialog aria-label="Filters">
    <button
      type="button"
      data-rc-bottom-sheet-handle
      data-rc-dialog-resize-axis="y"
      data-rc-dialog-resize-origin="top"
      aria-label="Resize sheet"
    ></button>
    …
  </dialog>
</rc-bottom-sheet>
```

- Use a modal sheet on compact width for filters, sharing and short option
  sets that would be a menu or side pane on wider windows. Expanded windows
  should show a docked supporting pane or a dialog instead.
- Always include the drag handle as a real button so keyboard and switch
  users can resize. Keep a visible close or Done action as well; swipe is
  never the only way out.
- Cap the top snap point below the status bar (`90dvh`); a sheet that fills
  the screen should be a full-screen dialog.
- Do not stack sheets or open a dialog from a sheet's own content.
- Keep the drag handle in its own band above the sheet content, as M3 places
  it. Draw keyboard focus inside the sheet's clipped corners, since an outline
  outside them is cut off.
- A standard, non-modal sheet that stays open over the page uses its own
  container tone so it reads as a separate surface.
- Don't add swipe paging between tabs inside a sheet. Horizontal swipes
  compete with vertical resizing, scrolling and the browser's edge-back
  gesture; switch tabs explicitly.

### Sheets and the FAB

A floating action button and a sheet compete for the same edges: the FAB
floats at the bottom inline end, a side sheet covers the inline end, and a
bottom sheet covers the bottom. Moving the FAB out of a sheet's way is a sign
the screen wants a different surface.

- Don't open a side sheet on a screen that has a FAB. Dock the same content as
  a pane in the layout (Material's standard side sheet, which stays visible
  while the content is used), or use a full-screen dialog for a short task.
- At compact height, don't open a bottom sheet on a screen that has a FAB,
  modal or standard: what is left above it cannot hold both the content and
  the FAB. From medium width, dock a start pane or add a scrolling column;
  otherwise use a full-screen dialog or let the content follow in the page.
- On taller windows a bottom sheet may share a screen with a FAB; the FAB
  clears the sheet's peek (see the floating layer under App shell) and a modal
  sheet's scrim covers it while open.
- When the navigation rail is shown, the FAB moves into the rail's `header`
  slot (Compose Material 3 `NavigationRail` and `WideNavigationRail` take the
  FAB in their header), so docked panes beside the rail never meet it.

### Side sheets

`rc-dialog variant="side"` is the modal side sheet: docked to the inline end at
full height, at most 400px wide, rounded on its leading edge, with the shared
scrim. It fades rather than sliding, like every other surface here.

```html
<rc-dialog id="filters" variant="side" light-dismiss>
  <dialog aria-labelledby="filters-title">
    <h2 id="filters-title">Filters</h2>
    <div class="dialog-body">…</div>
    <form method="dialog" class="dialog-actions">
      <rc-button class="rc-button--text"><button value="cancel">Cancel</button></rc-button>
      <rc-button><button value="apply">Apply</button></rc-button>
    </form>
  </dialog>
</rc-dialog>
```

- Use a side sheet for the same content a modal bottom sheet carries when the
  window is compact in height, such as a landscape phone, where a bottom
  sheet would leave only a strip of content, and only on a screen without a
  FAB; see [Sheets and the FAB](#sheets-and-the-fab). Write `variant` from app
  state; the sheet's content and actions stay the same.
- Scroll a body region and keep the actions outside it, so they never leave
  the screen.
- A side sheet that stays open beside content is a docked supporting pane,
  not a dialog. Lay it out in the page instead.

### Lists and settings

`rc-list` and `rc-list-item` are Material lists. Slots map to the M3 list
anatomy: `leading` (icon, avatar or native control, with `data-rc-list-leading`
for icon geometry), the default headline and supporting text, `trailing`
(metadata or an action), and `details` for expandable content.

```html
<h2 class="section-heading" id="display">Display</h2>
<rc-list variant="segmented" aria-labelledby="display">
  <rc-list-item>
    <span slot="leading" data-rc-list-leading aria-hidden="true">dark_mode</span>
    <label for="dark">Dark theme</label>
    <rc-switch slot="trailing"><input id="dark" type="checkbox" /></rc-switch>
  </rc-list-item>
  <rc-list-item interactive action-target="text-size">
    <span slot="leading" data-rc-list-leading aria-hidden="true">text_fields</span>
    <a id="text-size" href="/settings/text-size">Text size</a>
    <small data-rc-list-supporting>Medium</small>
  </rc-list-item>
</rc-list>
```

- **Settings screens** are groups of `variant="segmented"` lists under
  title-small section headings. A boolean is a switch in the trailing slot,
  labeled by the row headline. An enum with two to five short values
  is `rc-segmented-button`; longer enums open a single-choice dialog from a
  row showing the current value as supporting text. Navigation and
  dialog-opening rows use `interactive` with `action-target`, so the whole row
  forwards to one real link or button.
- The theme does not restyle the action target itself, so reset a link used
  as a row headline:

  ```css
  rc-list-item[interactive] > a[id] {
    color: inherit;
    text-decoration: none;
  }
  ```

- Segmented button rows span the row on compact and cap at about 30rem on
  wider panes. Drop the selected checkmark when the row is too narrow for
  three worded segments. `rc-list` sizes one shared trailing column for all
  its rows, so put segmented-button rows in a list without trailing content.
- Settings on expanded windows become list-detail: the category list on the
  start side, the selected category on the end side.
- Use the standard (non-segmented) list for content collections and dense
  results; use dividers sparingly.
- `selection="single"` or `"multiple"` with native radios or checkboxes makes
  a selectable list. `reorderable` adds drag handles with keyboard support.
- **Drag is never the only path.** Wherever items reorder by drag, also offer
  visible move-earlier and move-later actions, and announce the new position
  in a live region that exists before the move.
- **Contextual selection.** For per-item actions in a grid or list, select
  first and then show the actions for the selected item, rather than a
  permanent action row on every item or a hidden long-press menu.
- Keep one primary target per row. A trailing icon button is a second target
  only when the row itself does something else.

### Disclosures and accordions

`rc-disclosure` around `<details>` is Material's expandable list item: a
headline row with a trailing chevron that rotates when open. `rc-accordion`
groups them as a segmented list, single-open by default (`multiple` allows
several).

```html
<rc-accordion>
  <rc-disclosure default-open>
    <details>
      <summary>On your phone</summary>
      <p>…</p>
    </details>
  </rc-disclosure>
  <rc-disclosure>
    <details>
      <summary>On your computer</summary>
      <p>…</p>
    </details>
  </rc-disclosure>
</rc-accordion>
```

- Seed the initial state with `default-open`. `open` is the **controlled**
  state: the disclosure then ignores its own summary, and the accordion's
  close arrives as an `rc-disclosure-toggle` request your code must honor.
- Keep summaries to one line of title text; an optional leading icon remains
  before the trailing chevron. Put explanation in the panel.
- Use disclosures for optional help and secondary detail, not for primary
  form fields or navigation.

### Cards and feeds

`rc-card` defaults to the M3 **elevated** card (`surface-container-low`,
level-1 shadow, medium corners).

```html
<rc-card interactive action-target="item-42">
  <img slot="media" src="/photo.jpg" alt="" />
  <a id="item-42" slot="title" href="/items/42">Item title</a>
  <span slot="subtitle">Supporting line</span>
  <p>Short summary.</p>
</rc-card>
```

```css
/* M3 filled and outlined cards are token sets on the same element. */
rc-card.card-filled {
  --rc-card-bg: var(--md-sys-color-surface-container-highest);
  --rc-card-shadow: none;
}

rc-card.card-outlined {
  --rc-card-bg: var(--md-sys-color-surface);
  --rc-card-border: 1px solid var(--md-sys-color-outline-variant);
  --rc-card-shadow: none;
}
```

- Use `interactive` and `action-target` for whole-card navigation: the card
  forwards clicks to one real link or button, which keeps a single tab stop
  and accessible name. Put additional actions in the `actions` slot.
- `orientation="horizontal"` places media beside text; region tokens
  (`--rc-card-grid-template-columns` and friends) rearrange it inside a
  container query.
- `selected` shows a selection outline for multi-select collections.
- Use `rc-carousel` for a scrollable row of media, not for primary content
  the user must see.
- Media needs a failure state. A missing or broken image renders a
  placeholder surface, never the browser's broken-image icon or the alt text
  as the visual. Card media is decorative (`alt=""`) when the title names the
  item.

### Search

- Compact: a full-screen search view (`rc-search-bar variant="view"`) opened
  from an app bar action or a docked bar at the top of the screen.
- Medium and wider: a docked bar (the default `variant`) in the app bar's
  `center` slot or at the top of the content pane.
- The native `<input type="search">` is required and labeled. Debounce with
  `debounce`; commit the query to the URL so it survives reload and back.

```html
<search>
  <label for="q" class="visually-hidden">Search items</label>
  <rc-search-bar placeholder="Search items">
    <span slot="leading" aria-hidden="true" data-rc-icon>search</span>
    <input type="search" id="q" name="q" />
  </rc-search-bar>
</search>
```

### Forms and inputs

- `rc-field` is the M3 filled text field; add `.rc-field--outlined` for the
  outlined variant. Use one variant per form. Label, hint and error are slots
  around your native control; `counter` shows length against `maxlength`.
- `rc-select` wraps a native `<select>`; `rc-combobox` adds filtering and free
  entry. `.rc-select--dense` and `.rc-combobox--dense` are for dense desktop
  panes, not touch layouts.
- `rc-switch` for immediate on/off settings; a checkbox for choices committed
  with a form. `rc-slider` and `rc-range-slider` wrap `<input type="range">`.
- Validate on submit and on blur, not per keystroke. Errors replace the hint
  and say how to fix the problem.
- **Show saved data as content, not as read-only fields.** Detail views use
  lists, paragraphs and chips. A read-only field is a form state: use it only
  inside a form, for a value that can't change.
- Full-width fields on compact; on wider windows, bound field width to the
  content (about 280–560px) instead of stretching across the pane.

```html
<rc-field>
  <label slot="label" for="title">Title</label>
  <input id="title" name="title" required />
  <small slot="hint">Shown at the top of the page.</small>
  <small slot="error">Enter a title.</small>
</rc-field>
```

### Chips

| Chip       | Composition                                                    | Use                                 |
| ---------- | -------------------------------------------------------------- | ----------------------------------- |
| Assist     | `rc-chip` with a `<button>`                                    | Contextual action (add to calendar) |
| Filter     | `rc-chip-group kind="filter"` with native radios or checkboxes | Narrow a collection                 |
| Input      | `rc-chip variant="input"`                                      | Entered values (recipients, tags)   |
| Suggestion | `rc-chip variant="suggestion"`                                 | Dynamic suggestions                 |

- Wrap filter chips in a `<fieldset>` with a legend; `selection` mirrors the
  native control type.
- On compact, use `layout="scroll"` for a single horizontal row, or
  `layout="auto"` with `max-rows` to collapse behind a disclosure.
- Chips are not navigation and not primary actions.

### Feedback and progress

- **Snackbars.** `rc-snackbar.show({ message, actionLabel })` for brief,
  low-priority messages at the bottom; keep them clear of the navigation bar
  and FAB. At
  most one action, typically Undo for a reversible change; never use one
  for errors that need a decision (use a dialog) or for messages
  that must persist (use inline text). Choose a `queue-policy` deliberately.
  Undo restores the exact previous state. An action that changed nothing
  says so and offers no Undo.
- **Progress.** `rc-progress` wraps `<progress>` as an M3 linear indicator.
  Determinate when you know the amount; `indeterminate` otherwise. Label it,
  and use `value-text` for a readable status. The theme has no circular
  indicator yet.
- **Live regions.** Announce outcomes, such as Saved or 3 items imported, not
  every tick of progress.
- **Empty states** use body text and one action, not an illustration alone.

### Toolbars

- `rc-toolbar` groups related controls with roving focus. The theme draws
  it on `surface-container` with icon-button geometry and
  `secondary-container` for pressed toggles.
- A bottom toolbar on compact holds contextual actions for the current
  screen (editing, selection mode). It is not navigation; never pair it with a
  navigation bar on the same screen.
- In compact-height layouts, set `orientation="vertical"` and place the
  toolbar at the inline end.

### Split panes

`rc-splitter` gives a resizable list-detail or supporting pane on expanded
windows. Set `orientation` from app state when the region changes shape, and
bound the primary pane with `min` and `max`. Do not use a splitter on compact
widths; route between panes instead.

## Accessibility and interaction states

- **State layers.** Interactive surfaces show hover (8%), focus (12%) and
  pressed (12%) layers of their foreground color. Components draw their
  own; add `.rc-state-layer` to custom interactive elements that already set a
  border radius.
- **Focus.** Keep the visible focus ring. When a surface closes or a control
  moves, put focus somewhere sensible: the trigger, or the same action in its
  new position.
- **Targets.** 48px minimum activation area for everything a finger can hit;
  the components reserve it even when the visual container is smaller.
- **Keyboard.** The components implement the WAI-ARIA patterns (roving focus
  in toolbars and menus, arrow keys in accordions and lists, Escape in
  dialogs). Do not add competing key handlers.
- **Names.** Every icon-only control has an `aria-label`; every landmark
  (`nav`, `search`, lists) has a label when there is more than one.
- **Writing modes.** Use logical properties and `dir`-aware icons (back
  arrows mirror in RTL).

## Framework notes

- **Attributes versus properties.** Many components distinguish controlled
  and uncontrolled state: `open` versus `default-open`, `value` versus
  `default-value`. Frameworks that set properties on custom elements (Solid,
  Lit, Vue) must use the default variant to seed state, such as Solid's
  `prop:defaultOpen={true}`. Binding `open` hands control to your code, and
  user interaction then only emits a request event.
- **Keep native children mounted.** Do not conditionally render the inner
  `<dialog>`, `<details>` or `<input>`; toggle state instead.
- **Render timing.** Slotted controls in a Lit-based component can't take
  focus until the component has rendered. Await `updateComplete` on the
  component before calling `focus()` on something you just slotted.
- **Typings.** `@rcarls/rc-webcomponents/solid` provides JSX typings for
  attributes and Solid's `prop:` bindings. The `/react` typings cover
  attributes and events, but do not use `prop:` syntax.

## Do's and Don'ts

### Do

- Choose navigation, dialog presentation and search mode from window size
  class state.
- Keep one filled button and at most one FAB per screen.
- Use the surface-container ladder for depth and nest content one step down.
- Put overflow actions in `rc-adaptive-menu` and utilities (Settings, Help)
  in overflow.
- Use segmented lists with section headings for settings.
- Seed initial open state with `default-open`.
- Read motion tokens in your own transitions.
- Use logical properties and safe-area insets.

### Don't

- Don't use a full-screen dialog on medium or wider windows, or a basic dialog
  for long forms on compact.
- Don't show a navigation bar and a rail together, or put utilities in
  navigation.
- Don't hide controls with CSS media queries to adapt toolbars.
- Don't style shadow internals or `--_rc-*` tokens, or use `!important`
  against the theme.
- Don't use color alone for status, or `primary` for decoration.
- Don't remove focus rings or shrink targets below 48px.
- Don't put a card on a surface of the same container role.
- Don't stack modal surfaces (a dialog over a sheet over a dialog).

## References

- [Material 3](https://m3.material.io/): [layout and canonical layouts](https://m3.material.io/foundations/layout/canonical-layouts/overview),
  [color roles](https://m3.material.io/styles/color/roles),
  [type scale](https://m3.material.io/styles/typography/type-scale-tokens),
  [shape](https://m3.material.io/styles/shape/corner-radius-scale),
  [motion](https://m3.material.io/styles/motion/overview),
  [dialogs](https://m3.material.io/components/dialogs/guidelines),
  [bottom sheets](https://m3.material.io/components/bottom-sheets/guidelines),
  [lists](https://m3.material.io/components/lists/guidelines),
  [navigation bar](https://m3.material.io/components/navigation-bar/guidelines),
  [navigation rail](https://m3.material.io/components/navigation-rail/guidelines),
  [top app bar](https://m3.material.io/components/top-app-bar/guidelines).
- Android: [window size classes](https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes),
  [canonical layouts](https://developer.android.com/develop/adaptive-apps/guides/canonical-layouts),
  [adaptive navigation](https://developer.android.com/develop/adaptive-apps/guides/build-adaptive-navigation),
  [edge-to-edge](https://developer.android.com/design/ui/mobile/guides/layout-and-content/edge-to-edge).
- rc-webcomponents: [styling guide](https://richardcarls.github.io/rc-webcomponents/guide/styling),
  [motion](https://richardcarls.github.io/rc-webcomponents/guide/motion),
  [component reference](https://richardcarls.github.io/rc-webcomponents/).
- Token values: [material-foundation/material-tokens](https://github.com/material-foundation/material-tokens),
  vendored in `defaults.css`.
