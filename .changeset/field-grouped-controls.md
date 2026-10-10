---
'@rcarls/rc-field': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-win31': minor
'@rcarls/rc-webcomponents': minor
---

Group several native controls into one `rc-field` with a direct `<fieldset>`. Its `<legend>` names
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
