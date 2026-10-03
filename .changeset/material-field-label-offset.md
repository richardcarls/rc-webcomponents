---
'@rcarls/rc-theme-material': patch
'@rcarls/rc-webcomponents': patch
---

Pin floated Material field labels to the container instead of centering them
with the control. Filled fields reserve 8px of block padding, so every floated
label sits at the same offset and a taller control grows the field downward;
outlined labels now ride the top border for select and combobox controls too. Full-size
chips in a filled field keep a 0.25rem gap below the floated label.
Select and combobox controls drop their own block padding inside fields, and
`rc-textarea` text starts on the input line like a native textarea.

Add `rc-combobox--dense` and `rc-select--dense`, which render 1.5rem chips so a
populated chip field keeps the standard 56px height.
