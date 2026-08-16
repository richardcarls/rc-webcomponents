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
