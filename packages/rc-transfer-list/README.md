# @rcarls/rc-transfer-list

Side-by-side transfer list web component built from rc-listbox.

## Styling Hooks

Panels expose `data-empty` when their backing list has no options and
`data-has-selection` when that panel currently has highlighted rows. The root
exposes `data-can-move-up` and `data-can-move-down` when the selected panel has
highlighted rows that can be reordered in that direction.

| CSS custom property | Default | Description |
|---|---|---|
| `--rc-transfer-list-gap` | `var(--rc-control-gap, 0.75rem)` | Gap between panels and the action toolbar. |
| `--rc-transfer-list-panel-gap` | `var(--rc-control-gap, 0.35rem)` | Gap between a panel label and its listbox. |
| `--rc-transfer-list-listbox-min-block-size` | `10rem` | Minimum block size for each listbox. |
| `--rc-transfer-list-listbox-border` | `var(--rc-border, 1px solid ButtonBorder)` | Border around each listbox. |
| `--rc-transfer-list-option-gap` | `var(--rc-item-gap, 0.4em)` | Gap between option adornments and labels. |
| `--rc-transfer-list-option-padding-block` | `var(--rc-item-padding-block, 0.3em)` | Block padding for option rows. |
| `--rc-transfer-list-option-padding-inline` | `var(--rc-item-padding-inline, 0.75em)` | Inline padding for option rows. |
| `--rc-transfer-list-option-selected-bg` | `var(--rc-highlight, Highlight)` | Selected option background. |
| `--rc-transfer-list-option-selected-color` | `var(--rc-highlight-text, HighlightText)` | Selected option foreground. |

| Part | Description |
|---|---|
| `root` | Root layout wrapper. |
| `panel` | Shared list panel surface. |
| `available-panel` | Available/left panel. |
| `selected-panel` | Selected/right panel. |
| `actions` | Transfer action toolbar. |
| `button` | Shared action button surface. |
