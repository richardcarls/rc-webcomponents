---
version: windows-3.1-ctl3d-inspired
name: rc-theme-win31
description: >
  Composition guide for Windows 3.1-era applications built with
  rc-webcomponents and the rc-theme-win31 CSS theme. Values describe the
  package's shipped baseline; historical measurements are identified below.
colors:
  surface: '#c0c0c0'
  highlight: '#ffffff'
  shadow: '#808080'
  shadow-dark: '#404040'
  frame: '#000000'
  field: '#ffffff'
  field-text: '#000000'
  menu: '#c0c0c0'
  menu-text: '#000000'
  selection: '#000080'
  selection-text: '#ffffff'
  title-active: '#000080'
  title-active-text: '#ffffff'
  title-inactive: '#808080'
  title-inactive-text: '#c0c0c0'
  desktop: '#008080'
typography:
  family: 'Microsoft Sans Serif, MS Sans Serif, Tahoma, Segoe UI, sans-serif'
  body-size: 13px
  menu-size: 16px
  title-size: 16px
geometry:
  unit: 1px
  control-height: 23px
  title-height: 24px
  menu-height: 27px
  toolbar-height: 31px
  toolbar-button-size: 27px
  listbox-row-height: 17px
  scrollbar-size: 16px
  check-size: 13px
  gap: 4px
components:
  button:
    surface: '{colors.surface}'
    text: '{colors.frame}'
    minHeight: '{geometry.control-height}'
  dialog:
    surface: '{colors.surface}'
    title: '{colors.title-active}'
    captionHeight: '{geometry.title-height}'
  listbox:
    surface: '{colors.field}'
    selection: '{colors.selection}'
    rowHeight: '{geometry.listbox-row-height}'
  scrollbar:
    size: '{geometry.scrollbar-size}'
---

# rc-theme-win31 design guide

This guide helps people and coding agents compose an application with
`@rcarls/rc-theme-win31`. It describes the shipped Windows 3.1-era appearance,
its component contracts, and the points where web rendering is an approximation.
The [component documentation](https://richardcarls.github.io/rc-webcomponents/)
remains the reference for individual attributes and events.

## Historical target and evidence

The theme uses square geometry, bitmap-like marks, hard shadows, and an optional
beveled control treatment associated with applications using CTL3D. The 1992
[_Windows Interface: An Application Design Guide_](https://books.google.com/books/about/The_Windows_Interface.html?id=ONBQAAAAYAAJ)
is the period design reference. Microsoft's
[dialog-unit conversion](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-mapdialogrect)
explains why pixel dimensions depend on the dialog font. The measurements in
this package are a 96 DPI, 8 pt MS Sans Serif approximation, not a claim that
every Windows 3.1 application rendered at one pixel size.

[Shell.css](https://zachhall.org/shell-css/) and
[Web31](https://github.com/Futur3Sn0w/web31) are useful independent web
recreations for visual comparison. Their assets, palette choices, and window
manager behavior are not specifications for this component theme. The
originator `stars` application uses its own sampled game palette, including a
light-blue title; those values belong to an application override, not this
package's baseline.

## Compose an application

Import the complete theme and place its scope on the application root. Put the
scope on `<html>` when native dialogs or popovers may enter the top layer.

```css
@import '@rcarls/rc-theme-win31/theme.css';
```

```html
<html class="rc-theme-win31" lang="en">
  <!-- Application content -->
</html>
```

For selective loading, import `defaults.css`, then `bridge.css`, then the
needed `components/*.css` files. `defaults.css` owns the `--win31-*` tokens;
the bridge maps them to shared `--rc-*` semantics. App styles outside a cascade
layer override the theme's layered styles. Use public tokens and documented
parts or markers; `--_rc-*` tokens and controller markers are internal.

Use consumer-authored native controls where a component requires them. An
`rc-button` contains a `<button>`; an `rc-dialog` contains a `<dialog>`; a
`rc-disclosure` contains `<details>`. Keep native IDs, names, labels, and form
behavior on those children. The theme changes presentation, not keyboard or
ARIA behavior.

## Apply color and typography

The baseline palette in the front matter is the package's current reference
scheme. Pair `--win31-color-selection` with
`--win31-color-selection-text`, and each title background with its title-text
partner. Keep the field and field-text pair legible. The desktop color is an
application canvas choice, not an instruction to paint every page teal.

Windows 3.1 exposed system color schemes rather than an automatic dark mode.
Override the `--win31-color-*` roles together on `.rc-theme-win31`. The dither
and arrow/check SVG tokens are separate image assets: an alternate palette may
also need `--win31-dither-track` and `--win31-glyph-*` overrides for contrast.
Test the result with actual controls, selected rows, a dialog, and scrollbars.
The baseline glyphs are black. The dither follows `--win31-color-surface`,
while color tokens alone do not recolor the glyph image assets.

```css
.rc-theme-win31.stars-like {
  --win31-color-surface: #c3c3c3;
  --win31-color-shadow: #828282;
  --win31-color-title-active: #a6cbf3;
  --win31-color-title-active-text: #000000;
}
```

This example illustrates the originator application's palette difference; it
is not a named Windows system scheme. The font stack prefers MS Sans Serif but
does not ship Microsoft's bitmap font. Later system sans faces preserve
usability while changing glyph widths and rendering.

## Build period-style chrome

- Use one active caption bar per window, with centered caption text and an
  authored system-menu button when the action is real. `rc-dialog` styles a
  direct native `<dialog>` child with an authored `<header>` and `<footer>`.
- Put the default-button marker on `rc-button`, while keeping the actual
  `<button>` as its direct child. The marker supplies a second frame; the native
  button still owns its action and focus.
- Compose menus, toolbars, listboxes, fields, and scrollbars as dense rectangular
  regions. Use the `--win31-unit` scale for a uniformly larger interface, and
  choose layout breakpoints in the application rather than the theme.
- Show focus and selection independently. The dotted focus outline can coexist
  with an inverse selected row. Do not substitute hover styling for either.
- Preserve the disabled embossed treatment and pressed bevel reversal. The
  theme has no general button or list-row hover treatment and no motion.

```html
<rc-dialog movable move-handle="header">
  <dialog aria-labelledby="save-title">
    <header>
      <h2 id="save-title">Save Changes</h2>
    </header>
    <p>Save changes before closing?</p>
    <footer>
      <rc-button data-rc-win31-default><button type="button">OK</button></rc-button>
      <rc-button><button type="button">Cancel</button></rc-button>
    </footer>
  </dialog>
</rc-dialog>
```

The authored system-menu control needs a real menu action if shown. For a
simple confirmation dialog, omit it. Use `data-rc-win31-inactive` on
`rc-app-bar` only for an inactive caption, and `data-rc-win31-toggle` on
`rc-switch` only when its optional sliding treatment suits the application.
The default switch treatment resembles a checkbox.

## Respect platform limits

Browser-rendered text and native form internals will not match a 1992 bitmap
display pixel for pixel. Detailed scrollbar chrome works in Chromium and
WebKit; Firefox receives a two-color standard scrollbar. In forced colors the
theme yields to system colors and removes decorative bevels. Do not restore
custom palette colors inside that mode.

`rc-fab`, `rc-fab-menu`, and several navigation or carousel patterns have no
Windows 3.1 equivalent. Their styles keep a themed app visually coherent but
do not make them period patterns. Prefer menu commands and toolbars when the
application is meant to resemble a contemporary Windows 3.1 program.
