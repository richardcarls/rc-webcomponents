# @rcarls/rc-segmented-button

Segmented button group backed by native radio inputs.

```html
<rc-segmented-button>
  <fieldset>
    <legend>Text size</legend>
    <label><input type="radio" name="size" value="small" /> Small</label>
    <label><input type="radio" name="size" value="medium" checked /> Medium</label>
    <label><input type="radio" name="size" value="large" /> Large</label>
  </fieldset>
</rc-segmented-button>
```

The fieldset, legend, labels, and radios remain in light DOM for forms and no-JavaScript fallback.

## Segmented appearance

Unstyled, the fieldset, legend, and radios keep their browser appearance. Set
`--rc-segmented-button-appearance: segmented` to turn on the component's own
recipe: a flat fieldset, a visually hidden legend, and radios that stay
focusable and in the accessibility tree while being invisible. The packaged
themes set it for you.

```css
.my-theme rc-segmented-button {
  --rc-segmented-button-appearance: segmented;
}
```

### Browser support

That switch is read with a CSS style container query, which has narrower support
than the rest of this package: Chrome 111, Safari 18, and Firefox 128. Everything
else here, including the component's behavior, keyboard handling, and form
participation, works wherever custom elements do.

Where style queries are unsupported the recipe simply does not apply and the
control falls back to the native fieldset and radio appearance, which stays
fully usable and accessible. Nothing breaks; it looks like plain radio buttons.
If that fallback is not acceptable for your audience, write the segment layout
in your own CSS instead of using the switch.
