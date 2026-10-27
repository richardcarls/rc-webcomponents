# @rcarls/rc-theme-substrate

## 0.7.0

### Minor Changes

- f31cca3: Add `--rc-bottom-sheet-handle-offset` to position the handle indicator within its target. It
  defaults to `50%`, which keeps the indicator centered. Set a length to keep the indicator in its
  own row at the top of a handle that also holds the sheet's title.
- 079e025: Standardize component styling contracts for the breaking 0.7 release.

  BREAKING CHANGE: Rename the Markdown editor's `--rme-*` properties to
  `--rc-markdown-editor-*`, `--rc-app-bar-background` to `--rc-app-bar-bg`,
  `--rc-textarea-radius` to `--rc-textarea-border-radius`, the transfer-list
  `--rc-transfer-list-panel-*` properties to `--rc-transfer-list-listbox-*`,
  `--rc-chip-group-webkit-scrollbar-display` to
  `--rc-chip-group-scrollbar-display`, and `--rc-text` to `--rc-field-text`.
  Compatibility aliases are intentionally not provided.

  BREAKING CHANGE: Replace `--rc-select-chip-padding-inline` and
  `--rc-combobox-chip-padding-inline` with explicit `*-padding-inline-start` and
  `*-padding-inline-end` tokens. Generated removable chips now reserve the full
  remove target and its edge offset, so their indicator cannot overlap label text.

  Add canonical app-bar elevation, transfer-list listbox radius, and textarea
  line-action tokens. Add logical `rc-chip` inline-padding properties so themes
  can implement Material's icon-aware spacing without overriding authored child
  styles. Make `rc-field` consume the shared semantic token layer,
  and place the `rc-chip` and `rc-search-bar` light-DOM structural styles in the
  `rc-base` cascade layer so normal consumer rules override them.

  Prevent decorative, `aria-hidden` trailing list content from intercepting a
  whole-row action target, and keep segmented-list item geometry from leaking
  into nested standard lists.

  Remove unused Material navigation-rail toggle tokens and obsolete list-item
  theme tokens. Register the segmented-button private theme seam and enforce
  token ownership, documentation, removed-name, selector-budget, and cascade
  layer contracts through the component architecture audit.

- 4341311: Add reusable fullscreen dialogs and declarative dialog popup mode to `rc-select` and
  `rc-combobox`. Dialog selection and creation are staged until Done, while close and Escape
  discard the draft. Fullscreen surfaces follow the visual viewport under browser zoom and
  software keyboards, and anchored popups now clamp to the visual viewport.
- 2c7c80a: Give `rc-dialog` a surface styling contract.

  It exposed only `--rc-dialog-scrim`, so both themes drew the surface by selecting the native
  `<dialog>` directly. It now installs a light-DOM base stylesheet, the same pattern as `rc-button`
  and `rc-disclosure`, and exposes minimum and maximum inline and block bounds, padding, border, radius, background,
  foreground, and shadow, plus fullscreen-specific padding and background for the two values that
  variant genuinely needs of its own.

  Fullscreen geometry, meaning position, size, margin, radius, and shadow, stays structural rather
  than something a theme sets: filling the visual viewport is what keeps the surface correct under browser zoom
  and a software keyboard.

  Material's explicit block bound with `overflow: hidden` moved into the base layer rather than
  staying a theme value. It exists because Chromium does not reliably clip a scrolling element's
  own border radius at the scroll boundary, which is a correctness fix every theme needs.

  `--rc-dialog-visual-viewport-left`, `-top`, `-width`, and `-height` are no longer documented as
  theme properties. They are geometry the component writes while a fullscreen dialog is open:
  readable if something inside the dialog needs the same measurements, but setting them does not
  move the dialog. They are candidates for private `--_rc-dialog-*` names in a future revision.

- 4b9bfe6: Give `rc-disclosure` and `rc-accordion` a public styling contract.

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

- 19278d4: Group several native controls into one `rc-field` with a direct `<fieldset>`. Its `<legend>` names
  the group and shows as the field label, each control keeps its own accessible name, and supporting
  text describes the fieldset. The first text-like input or textarea is the primary control behind
  `control`, `focus()`, and `data-populated`; focus moving between grouped controls keeps the field
  focused; and `data-disabled`, `data-required`, and `data-invalid` reflect the whole group. New
  read-only `group` and `controls` properties and a `data-group` host attribute support the mode.

  The primary control grows and other controls attach before or after it. In Material, the legend uses
  the floating label mechanics: it rests on the input line while the group is idle and its primary
  input empty, and floats on focus or once that input has a value; a group with a control before its
  primary input keeps it floated. Grouped placeholders wait for focus. Substrate colors an invalid
  group's legend, and Win31 spaces it like a single field's label.

- 873592e: Add four directional motion tokens to the shared base contract:
  `--rc-motion-effects-easing-enter`/`-exit` and
  `--rc-motion-spatial-easing-enter`/`-exit`. An opening element decelerates
  into place; a closing one accelerates out. There are no matching enter/exit
  duration tokens; pair `-easing-exit` with an existing `-duration-fast` token
  instead.

  All three themes map the new tokens: Material pairs them with its
  standard/emphasized decelerate and accelerate curves, Substrate keeps its one
  curve as the enter curve and adds a generic accelerate shape for exit
  (refined further once Substrate gets its own full spatial/effects scale), and
  `rc-theme-win31` declares all four as `step-end`, matching its zero-motion
  contract, so an application that loads the shared base tokens alongside
  `rc-theme-win31` does not inherit the base defaults' real easing curves for
  these two directions.

- 7c952e2: `rc-theme-material` and `rc-theme-substrate` refine `prefers-reduced-motion:
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

- c62d107: Let opt-in native theme styles reach consumer controls inside RC containers while
  component recipes retain their themed presentation. Apply the same presentation
  boundary and `data-rc-native="off"` subtree opt-out in Material, Substrate, and
  Windows 3.1.

  Native controls inside an RC host may now gain theme styling when that host does
  not provide their appearance. Add `data-rc-native="off"` to content that should
  keep its own styles, such as a third-party widget.

- 622c5c9: Add independent opt-in `native.css` and CSS-only `css-components.css` entrypoints to the
  Material, Substrate, and Windows 3.1 themes. Native controls can use the theme presentation
  without registration, while documented class recipes style common HTML controls and static
  card, list, chip-group, and disclosure markup without changing behavior.

  Native styles stop at RC controls that own their native children. Add
  `data-rc-native="off"` to an element to keep native styles off it and its subtree.

- 622a4f8: Theme popovers and tooltips through the shared token layers. `rc-popover` now
  reads the shared `--rc-popup-*` surface tokens before its own fallbacks, like
  menus and listboxes, and `rc-tooltip` takes its default corner from
  `--rc-radius-sm`. The Material theme sets its popover and tooltip tokens on the
  theme root, so surfaces inside other shadow roots inherit them, and the
  Substrate theme adds popover and tooltip styles.
- 687a9be: Add shared popup surface tokens: `--rc-popup-background`, `--rc-popup-color`,
  `--rc-popup-border`, `--rc-popup-radius`, `--rc-popup-shadow`, and
  `--rc-popup-padding-block`. Menus, adaptive-menu popups, and select and
  combobox listboxes read them before their own fallbacks. Themes set them at the
  theme root, so popups rendered inside other shadow roots keep the theme's
  surface. Select and combobox add `--rc-*-listbox-background` and
  `--rc-*-listbox-color`.

  Breaking: popup surfaces no longer fall back to `--rc-control-radius`. Set
  `--rc-popup-radius` (or the per-component radius token) to change popup
  corners. The Material, Substrate, and Win31 themes no longer set per-component
  popup surface tokens such as `--rc-menu-radius` or
  `--rc-adaptive-menu-popup-background`; override the `--rc-popup-*` tokens
  instead. Material select and combobox listboxes now use the menu container
  color, Material forced-colors popups gain a border, and Substrate listboxes use
  the menu shadow and padding. Material retains its two-layer adaptive-menu popup
  shadow through a component token while other popups continue using the shared
  shadow.

- 6d126fd: Add shared item type tokens: `--rc-item-font-family`, `--rc-item-font-size`,
  `--rc-item-font-weight`, `--rc-item-line-height`, `--rc-item-letter-spacing`,
  and `--rc-item-icon-size`. Menu, listbox, and adaptive-menu items read them.
  Adaptive menu adds `--rc-adaptive-menu-trigger-hover-background`,
  `--rc-adaptive-menu-trigger-shadow`, and
  `--rc-adaptive-menu-trigger-active-shadow`, and styles overflowed `rc-button`
  and `rc-menu-button` rows from its item tokens. Themes declare their menu,
  adaptive-menu, and item tokens on the theme root, so menus inside other shadow
  roots match menus in the document. Substrate's adaptive-menu trigger now shows
  its hover background.

  Breaking: theme menu and adaptive-menu tokens are inherited from the theme root
  instead of set on each element, so a value set on an ancestor now reaches
  nested menus. Material sets menu, listbox, and adaptive-menu item type through
  `--rc-item-*` instead of per-component rules; override those tokens to change
  item type. Themes no longer style the adaptive-menu trigger through
  `::part(overflow-trigger)` hover and pressed rules; use the new trigger tokens.

- 7549dde: Theme the nine components Substrate left without a token contract.

  `rc-adaptive-menu`, `rc-carousel`, `rc-chip-group`, and `rc-scroller` had no component CSS at
  all. `rc-toolbar` and `rc-virtual-canvas` had a file that styled the element directly without
  declaring a single `--rc-*` property. `rc-splitter` declared two colors that mixed against the
  bare `Canvas` and `ButtonBorder` system colors, and the dialog scrim mixed against `CanvasText`,
  so none of the three had a value that could leave CSS.

  All are themed now, and the mixes point at the theme's own surface, border, and inverse surface
  instead of at system colors. Every new color clears WCAG AA against the surface it is drawn on,
  most of them AAA.

  The splitter keeps its existing division of labor: this theme paints it and leaves its geometry
  to the component's own defaults.

  `rc-accordion` and `rc-disclosure` are unchanged. They read no `--rc-*` property anywhere in
  their own styles, so there is nothing for a theme to set; giving them a contract is a change to
  those components.

- 77f9c63: Fix three theme gaps where a token fell through to a system color.

  **Substrate had no error color.** `--rc-field-error-color` fell through to `rc-field`'s own
  default of `Mark`, the system color for the background of highlighted text, which renders as
  pure yellow and measured 1.07:1 against the field. Validation worked, the message was in the
  accessibility tree, and it could not be read. Substrate now ships `--substrate-error`, held
  at hue 25 so it reads as red rather than as a darker shade of the orange primary at hue 48,
  and the bridge maps it. Both modes clear 7:1.

  Every remaining error fallback of `Mark`, in `rc-field` and in the Material field styles, now
  falls back to the validation red a user agent uses for an invalid control. The `Mark` usages
  inside `forced-colors` blocks are unchanged, where a system color is correct.

  **Material never set `--rc-button-text`.** `rc-select`, `rc-combobox`, and `rc-menu-button`
  read it directly for text drawn over `--rc-button-bg`, which Material sets to the primary
  fill, so the `ButtonText` fallback gave 3.26:1 in light and 1.70:1 in dark. It now follows
  `--md-sys-color-on-primary` alongside `--rc-button-color`, giving 6.44:1 and 7.71:1.

  **Substrate referenced three tokens it never declared.** `--substrate-inverse-surface`,
  `--substrate-inverse-on-surface`, and `--substrate-radius-pill` were used by the bridge and
  component styles but missing from `defaults.css`, leaving `rc-snackbar` on system colors and
  the bottom sheet handle on a literal. All three are declared, and a `defaults` test now
  asserts that every referenced token exists.

- 1207f3c: Theme `rc-field`, the last component Substrate left without coverage.

  The field takes Substrate's palette and the hover, focus, and invalid treatment
  its other form controls already share, so it reads as one of them. `rc-field`
  keeps owning its layout, invalid border, disabled opacity, focus outline, and
  forced-colors fallbacks; the theme only supplies values.

  An `rc-select`, `rc-combobox`, or `rc-textarea` acting as the field's control
  provider now stops drawing its own border, background, and focus ring, which
  otherwise nested visibly inside the field's. A standalone control outside a
  field is unaffected.

  The field also fills its container up to a readable measure instead of
  shrink-wrapping, so a provider-backed field with no value no longer collapses
  to its toggle.

- 3325191: **Breaking:** take `rc-textarea`'s read-only state from the slotted `<textarea readonly>` and
  remove the `read-only` attribute and its display styling without border or padding. A read-only
  editor keeps the enabled field appearance, stays focusable and selectable, announces `aria-
readonly` with the native control's label, and rejects edits. The host reflects `data-readonly`,
  and `readOnly` is now a getter. The plugin `transform()` hook runs while the textarea is
  `readonly`.

  `rc-markdown-editor` passes its `read-only` state to a native textarea in its source editor.
  Material and Substrate fields skip the hover affordance for a read-only control and keep its
  focus indicator.

  Migration: replace `<rc-textarea read-only>` with `readonly` on the slotted textarea, for
  example `<rc-textarea><textarea aria-label="Notes" readonly></textarea></rc-textarea>`. Replace
  `editor.readOnly = value` with `textarea.readOnly = value`. Read-only content that is not a form
  value belongs in ordinary text or list markup instead.

- 0e2d878: **Breaking:** replace `--rc-textarea-padding` with `--rc-textarea-padding-block` and
  `--rc-textarea-padding-inline`. The active line highlight bleeds through the inline padding by
  negating it, which a multi-value shorthand made invalid: inside a Material filled `rc-field`
  (`0 1rem 0.5rem`) the highlight stopped short of the field's edges in the editor and gutter.
  `--rc-textarea-padding-inline` is one length applied to both inline sides, so the bleed stays
  valid and follows RTL and vertical writing modes through logical insets.
  `--rc-textarea-padding-block` accepts any `padding-block` value.

  Migration: split each `--rc-textarea-padding` declaration. A single length `L` becomes
  `--rc-textarea-padding-block: L; --rc-textarea-padding-inline: L`. A shorthand
  `T X B` becomes `--rc-textarea-padding-block: T B; --rc-textarea-padding-inline: X`.

- fb747f6: Declare `rc-base` before each theme's own layers. Components inject their structural
  light-DOM CSS into `rc-base` at runtime, after the theme has loaded, which made it the last
  and strongest layer on pages that don't declare their own order, so it could override theme
  rules. Theme rules now win either way. Apps that declare their own layer order should list
  `rc-base` before the theme layers.

  Add a fourth theme layer, `rc-theme-*.overrides`, after `.components`. Each theme uses it to
  keep `rc-adaptive-menu` overflow rows on the menu's item tokens. Theme button and menu-button
  variants, such as Material's icon-only sizing and filled colors or Win31's bevelled native
  buttons, no longer restyle an overflowed action as a standalone control. A demoted
  icon-only `rc-menu-button` keeps its row padding and indicator inset.

- 58f4e71: `rc-theme-substrate` and `rc-theme-win31` now map the full shared
  spatial/effects motion scale that `rc-theme-material` already implements,
  closing a gap where each declared only its own single compatibility duration.

  Substrate adds a small, quicker scale of its own: 100/160/240&nbsp;ms for
  effects and 160/240/320&nbsp;ms for spatial, with its existing single easing
  curve as the spatial curve (it is already decelerate-shaped) and `ease-out`
  for effects. The compatibility token now follows the effects default rather
  than its own literal, matching the shared base contract's own convention.
  The one remaining hardcoded duration, `rc-list-item`'s 100&nbsp;ms row
  transition, now reads from the effects-fast token. Substrate's
  `prefers-reduced-motion` override moves from the bridge layer into
  `components/modes.css`, in the components layer, matching where the other
  two themes keep their mode overrides; a cascade layer test now proves the
  later layer's override wins rather than assuming it.

  win31 declares all thirteen shared tokens, plus the four directional ones
  added last release, at zero duration with `step-end` easing. Previously only
  the single compatibility token was set, so an application loading the shared
  base tokens alongside this theme inherited base's real 180/300/450&nbsp;ms
  spatial motion for every other token in the scale, silently contradicting the
  theme's own zero-motion contract. `rc-chip`'s existing zero-duration override
  gets its matching `step-end` easing token.

  Verifying that claim surfaced a limit worth knowing about even after this
  fix: it holds only when the theme class is applied to a container, the
  documented pattern, not to `<html>`. The shared `base.css` declares no cascade
  layer, so its `:root` values outrank any theme layer whenever both target the
  same element, which happens only when the theme class sits on `<html>` itself.
  No theme package can fix this by declaring more tokens; see the styling guide
  for details.

### Patch Changes

- 0de2332: Size fullscreen dialogs correctly under ancestor CSS zoom in browsers without
  `currentCSSZoom`. The Substrate dialog entrance now fades without scaling the
  surface, so resizing during the transition reads stable geometry.
- 3f8d110: Clear a page-level focus outline from a native input, select, or textarea inside `rc-field`. The
  field already shows focus, but rc-field's `::slotted()` reset loses to page rules such as a CSS
  reset's Firefox `:-moz-focusring` outline, which drew a dotted box inside the focused field.
- 114e38a: `rc-progress`'s determinate fill transition is now themeable through two new
  CSS custom properties, `--rc-progress-fill-transition-duration` (default
  `150ms`) and `--rc-progress-fill-transition-easing` (default `ease-out`),
  replacing a hardcoded `0.15s ease-out` no theme could reach.

  The indeterminate loop's easing changes from `ease-in-out` to `linear`. A
  loop has no beginning or end to decelerate into or accelerate out of, so an
  eased loop visibly pulses at each cycle boundary; Material 3 specifies linear
  easing for indeterminate loops for the same reason.

  `rc-theme-material` and `rc-theme-substrate` map the new duration/easing
  properties to their effects-fast motion tokens; `rc-theme-win31` already sets
  `transition: none` on the fill part directly and needs no change.

- fef89dc: Move the segmented appearance into the component behind one switch.

  Turning the native fieldset into a segmented control took 27 `--_rc-*`
  declarations that every theme had to restate, 23 of them byte-identical. Two of
  those blocks were accessibility recipes rather than taste: the visually hidden
  legend that keeps the group's accessible name, and the hidden but focusable
  radio. A theme that got either wrong removed the accessible name or made the
  control unreachable by keyboard.

  The component now owns the recipe and a theme sets
  `--rc-segmented-button-appearance: segmented`. Four genuine theme choices become
  public properties: `--rc-segmented-button-cursor`,
  `--rc-segmented-button-disabled-cursor`,
  `--rc-segmented-button-vertical-divider`, and
  `--rc-segmented-button-selected-icon-display`.

  Unset, the fieldset, legend, and radios keep their browser appearance, as
  before. The switch is read with a style container query (Chrome 111, Safari 18,
  Firefox 128); where that is unsupported the recipe does not apply and the
  control falls back to the same native appearance.

  To migrate a theme, replace its `--_rc-segmented-button-*` block with the single
  `--rc-segmented-button-appearance: segmented` declaration, plus any of the four
  public properties whose value differs from the default.

- 40f132d: `rc-theme-material` now declares the Material 3 motion system's seven named
  easing curves (`--md-sys-motion-easing-standard`, `-emphasized`, and their
  decelerate/accelerate variants, plus `-linear`) and sixteen named duration
  bands (`--md-sys-motion-duration-short1` through `-extra-long4`), composed
  from the control points and millisecond primitives already vendored. Several
  component recipes were already reaching for these names with an inline
  fallback (`var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1))`)
  that silently won every time because nothing declared the token; those
  references now resolve for real, and the fallback silently carrying a
  Material 2 curve (`cubic-bezier(0.4, 0, 0.2, 1)`, in `rc-state-layer`'s
  transition) is fixed to the correct Material 3 curve. Two more vendored-token
  gaps of the same shape are fixed alongside: Material's disabled state-layer
  and container opacity tokens, referenced across a dozen component recipes
  with no local declaration, and two Substrate token names
  (`--substrate-border`, `--substrate-radius-medium`) that never matched their
  real declarations (`--substrate-border-color`, `--substrate-radius-md`) and
  so always fell back to a hardcoded literal instead of the theme's actual
  values; `rc-fab-menu`'s Substrate shadow tokens are corrected the same way.

## 0.6.0

### Minor Changes

- a108336: Add shared-column `rc-list` and `rc-list-item` elements with standard and
  segmented appearances, default content truncation, and native-backed single or
  multiple selection coordination. Restore author-owned item state when native
  selection coordination ends.
- 509ee64: Add `rc-progress`, a native `<progress>` enhancer with a formatted value
  display, a track and fill you can restyle with CSS custom properties, and a
  built-in fix for the indeterminate/undefined-binding footgun.

  Keep the native element as the uncontrolled source of truth, support releasing
  a controlled value, and react to live native `value`/`max` changes. Preserve a
  native determinate value while `indeterminate` temporarily removes its
  attribute.

  The bar renders at its intended height with no `display` attribute set,
  matching its own documented default: previously the track/fill/native
  `<progress>` are all absolutely positioned, contributing nothing to the
  control's normal-flow height, so with no value-display text sharing its grid
  row to give it one, the whole bar collapsed to 0px.

## 0.5.0

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- e57277f: Add Material 3 search-view, fixed-pane splitter, dialog scrim, and resize enhancements.

  `rc-search-bar` now supports `variant="view"`, controlled/default open state, search-view methods, a rich `suggestions` slot, and datalist-derived text suggestions. `rc-splitter` adds `mode="fixed"` for clampable pixel primary panes. `rc-common` now honors CSS max-size constraints during resize gestures, and `rc-dialog` exposes a scrim token plus resize handle/origin hooks used by themed surfaces.

### Patch Changes

- 9c7476d: Add theme-specific rc-button progress treatments, including compact Material spinners and
  Substrate percentage indicators.
- ebec800: Dock bottom sheets without a theme to the viewport block-end by default and
  support absolute positioning for non-modal sheets contained by a positioned ancestor.
  Center authored drag handles with a splitter-aligned pill treatment. Align the
  Material theme with its surface, elevation, scrim, drag-handle, and contextual
  button treatment.
- e88eff8: Refine semantic card-title typography and icon-button alignment across both
  themes. Simplify Substrate navigation selection, match its bottom-sheet handle
  to the splitter grip, improve inverse notification action contrast, and theme the
  Markdown editor's composed controls.
- 6f91e7a: Fix collapsed `rc-navigation-rail` items so the whole item's box wraps icon and
  label, not just the icon. The shared component pulled the label out of flow
  (`position: absolute`), so a theme's whole-item background or focus ring only
  covered the icon; Material's detached-pill layout now lives in its own theme
  stylesheet instead of the shared base. Substrate's collapsed rail also grows
  from `5rem` to `6rem` so single-word labels like "Settings" stop wrapping.
- dce5749: Replace the navigation rail's shadow-DOM fallback toggle with a consumer-authored light-DOM
  button, and align collapsed and expanded item layouts across the default and reference themes.
- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- 4d118ff: Share icon-font size and line-height tokens across themed component icon markers.
- 3e89095: Replace rc-menu's generated submenu glyph with an author-supplied `indicator`
  slot on rc-menu-button. Keep the decorative indicator inside the trigger bounds,
  reserve label space for it, and expose theme-neutral size, color, and inset
  tokens for Material, Substrate, and application themes.
- c96f40c: Use a native system font stack by default.
- 979b989: Use a zero default gap for tighter chip content layout and a smaller default
  font size for slotted remove icons. Derive removable content padding from the
  remove target width and chip gap so the label and trailing icon stay aligned.

## 0.3.2

## 0.3.1

## 0.3.0

### Added

- Add Substrate as a lightweight CSS reference theme for branded app foundations.
- Add scoped defaults, token bridges, component polish, and docs preview integration.

### Changed

- Update package metadata, README intro, and docs links.
