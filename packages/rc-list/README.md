# @rcarls/rc-list

Shared-column list rows with optional native-backed single or multiple
selection.

```html
<rc-list selection="single" aria-label="Delivery speed">
  <rc-list-item>
    <input slot="leading" type="radio" name="speed" value="standard" checked />
    <span>Standard</span>
    <span slot="trailing">Free</span>
  </rc-list-item>
  <rc-list-item>
    <input slot="leading" type="radio" name="speed" value="express" />
    <span>Express</span>
    <span slot="trailing">$12</span>
  </rc-list-item>
</rc-list>
```

`rc-list` owns the shared leading, content, and trailing columns. Each direct
`rc-list-item` participates through CSS subgrid, so optional content aligns
across rows and unused columns collapse for the whole list.

The default `standard` variant is suited to continuous lists. Use
`variant="segmented"` for discrete settings-style rows. Theme packages own
their appearance.

`selection` accepts `none` (the default), `single`, or `multiple`. Selecting
lists require one direct native radio or checkbox in each row. The native input
remains the source of truth for checked and disabled state; the list mirrors
that state to its item and makes a non-interactive row surface activate the
input. Links, buttons, inputs, and other interactive descendants retain their
own behavior. Radios in a single-selection list should share a `name`, just as
they would in an unenhanced native radio group.

## Action targets

For a row whose primary action is not its selection input, set `interactive`
and point `action-target` at a same-root native anchor or button. Plain primary
clicks on the row surface activate that target; clicks on nested interactive
content and modifier-qualified or non-primary clicks keep their native
behavior.

```html
<rc-list aria-label="Theme settings">
  <rc-list-item interactive action-target="open-theme">
    Theme
    <button id="open-theme" type="button" slot="trailing">Choose</button>
  </rc-list-item>
</rc-list>
```

The target remains its own keyboard tab stop. `action-target` extends pointer
reach only and does not turn the row itself into a second button or link.

Content truncates with an ellipsis by default. Set
`--rc-list-item-content-white-space: normal` where multi-line content is
intended.

Import `@rcarls/rc-list` to use the classes without registering them, or import
`@rcarls/rc-list/define` to register `<rc-list>` and `<rc-list-item>`.
