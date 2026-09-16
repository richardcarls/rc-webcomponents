# @rcarls/rc-theme-win31

Windows 3.1 era CSS theme and token bridge for
[rc-webcomponents](https://github.com/richardcarls/rc-webcomponents).

Beveled, square, motionless chrome, as Windows 3.1 looked to applications that
linked `CTL3D`. Styling only: no component behavior changes.

```sh
npm install @rcarls/rc-theme-win31
```

```css
@import '@rcarls/rc-theme-win31/theme.css';
```

```html
<div class="rc-theme-win31">
  <rc-select>...</rc-select>
  <rc-dialog>...</rc-dialog>
</div>
```

## Token layers

`theme.css` composes three files, in this order:

| File             | Owns                                                        |
| ---------------- | ----------------------------------------------------------- |
| `defaults.css`   | The `--win31-*` reference tokens: palette, metrics, glyphs  |
| `bridge.css`     | The mapping from `--win31-*` onto the public `--rc-*` layer |
| `components.css` | Per-component chrome, one stylesheet per component          |

Component stylesheets read the `--win31-*` tokens with no literal fallbacks, so
a value lives in exactly one place and cannot drift between the token layer and
thirty-nine component sheets. Import `defaults.css` before any selective import,
or supply the `--win31-*` set yourself.

```css
@import '@rcarls/rc-theme-win31/defaults.css';
@import '@rcarls/rc-theme-win31/bridge.css';
@import '@rcarls/rc-theme-win31/components/button.css';
```

## Scaling

Every metric is a multiple of one token, so the whole theme scales without any
proportion changing. This is the bitmap-interface answer to responsive sizing.

```css
.rc-theme-win31 {
  --win31-unit: 2px;
}
```

## What is deliberate

- **Light only.** Windows 3.1 had no dark mode. It had around twenty
  user-selectable whole-system color schemes instead, which is arguably the
  stronger idea and predates `prefers-color-scheme` by three decades. Every
  component stylesheet reads only the `--win31-color-*` tokens, so a scheme is a
  class that overrides those and nothing else. The named period schemes are not
  shipped yet: their values live in the original `CONTROL.INI` and are not
  worth guessing.
- **No hover states**, except on menus. That is period-correct and it does
  surprise people. Push buttons and list rows are identical at rest and under
  the pointer. The upside is that every affordance is legible without a pointer,
  which is what touch and keyboard users need anyway.
- **Disabled is a color, not an opacity.** 3.1 had no alpha channel, so it
  embossed disabled text: gray with a one-pixel highlight beneath. WCAG exempts
  inactive controls from the contrast minimum, so the period treatment stands.
- **Focus and selection are separate marks.** A list can hold a selected row
  that is not the focused row, so the dotted focus rectangle is drawn in
  addition to the inverse-video selection, and turns white inside it.
- **It disappears under forced colors.** Every bevel is an inset shadow, a
  four-value `border-color`, or a dither image, and High Contrast removes all
  three. The theme yields completely. The result is closer to stock, pre-`CTL3D`
  Windows 3.1 than the beveled default is.
- **Scrollbar chrome is Chromium and WebKit only.** Firefox exposes only
  `scrollbar-width` and `scrollbar-color`, so it gets a two-color fallback.
- **`rc-fab` and `rc-fab-menu` are knowing anachronisms.** Windows 3.1 had no
  floating action button and nothing that would have produced one. They are
  drawn as floating tool-palette buttons so a themed page has no unstyled
  holes.

## Window chrome

`rc-dialog` keeps the native `<dialog>` in consumer light DOM, so the caption
bar is your markup. The theme styles the shape the component already contracts
on through `move-handle`:

```html
<rc-dialog movable move-handle="header">
  <dialog aria-labelledby="save-title">
    <header>
      <button aria-label="System menu"></button>
      <h2 id="save-title">Save Changes</h2>
    </header>
    <p>Save changes before closing?</p>
    <footer>
      <button data-rc-win31-default>OK</button>
      <button>Cancel</button>
    </footer>
  </dialog>
</rc-dialog>
```

## Theme markers

Three authored markers are public API for this theme:

| Marker                   | Applies to   | Effect                                         |
| ------------------------ | ------------ | ---------------------------------------------- |
| `data-rc-win31-default`  | `rc-button`  | The heavier frame of a dialog's default button |
| `data-rc-win31-toggle`   | `rc-switch`  | The sliding variant instead of the checkbox    |
| `data-rc-win31-inactive` | `rc-app-bar` | The muted inactive caption pair                |

## Fonts

MS Sans Serif is a Microsoft bitmap face and is not redistributed here. The
stack falls back through `Tahoma` and the system sans, so type is
metric-adjacent rather than pixel-exact.

## Notice

Not affiliated with or endorsed by Microsoft. Windows is a trademark of
Microsoft Corporation. No Microsoft fonts, bitmaps, or icons are redistributed;
every glyph in this package is redrawn as SVG or CSS.

## Documentation

- [Theme previews](https://richardcarls.github.io/rc-webcomponents/guide/theme-previews)
- [Styling guide](https://richardcarls.github.io/rc-webcomponents/guide/styling)

## License

MIT
