# @rcarls/rc-chip

Chip wrapper for native button-based actions, filters, and inputs.

```html
<rc-chip variant="filter">
  <button type="button">Vegetarian</button>
</rc-chip>
```

The native button remains connected for keyboard behavior and progressive enhancement.
Native tap highlighting is suppressed because the component's clipped state layer
provides hover, focus, and pressed feedback within the chip shape.

Use `rc-toolbar` when a group of interactive chips should form one tab stop
with arrow-key navigation. Import `@rcarls/rc-toolbar/define` separately when
you are not using the aggregate package:

```html
<rc-toolbar label="Recipe filters">
  <rc-chip variant="filter">
    <button type="button">Quick</button>
  </rc-chip>
  <rc-chip variant="filter">
    <button type="button">Vegetarian</button>
  </rc-chip>
</rc-toolbar>
```

For a removable chip, the direct native button is the only interactive
control. Activating it fires `rc-chip-remove`; the trailing remove icon is
presentational. Give the button an action-oriented accessible name:

```html
<rc-chip variant="input" removable>
  <button type="button" aria-label="Remove basil">Basil</button>
</rc-chip>
```
