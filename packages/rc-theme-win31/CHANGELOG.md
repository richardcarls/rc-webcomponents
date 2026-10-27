# @rcarls/rc-theme-win31

## 0.7.0

### Minor Changes

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

- 0deda8a: Theme `rc-popover` and `rc-tooltip`. Tooltips, which Windows 3.1 did not have,
  borrow its WinHelp definition popup: a white box with a hard one-pixel frame and
  drop shadow. Popovers keep the theme's menu panel with panel spacing. Both sets
  of tokens sit on the theme root, so surfaces inside other shadow roots inherit
  them.
- 322d875: Add a Windows 3.1 era theme package with full component coverage.

  `@rcarls/rc-theme-win31` maps a period `--win31-*` token layer onto the public
  `--rc-*` contract and ships one stylesheet per component, matching the coverage
  of the existing themes. Metrics derive from the MS Sans Serif 8pt cell and scale
  from a single `--win31-unit` token, so the theme can be doubled without any
  proportion changing.

  The theme is light only, has no hover states outside menus, treats disabled as a
  color rather than an opacity, draws focus and selection as separate marks, and
  yields entirely under forced colors.

### Patch Changes

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

- edfd374: Icon slots keep their square while empty. An SVG icon element such as
  `<iconify-icon>` draws a frame after it mounts, so swapping one in, such as a
  filter chip's check, no longer collapses the slot and shifts the row for a
  frame. Icon-font glyphs already fill 1em and render the same.
- 50687d3: Publish a Windows 3.1 design guide with checked theme values and composition
  guidance. Align the push-button minimum with the documented dialog-unit size,
  let dithered surfaces follow palette overrides, and correct the default-button
  example.
