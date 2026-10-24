---
'@rcarls/rc-textarea': minor
'@rcarls/rc-webcomponents': minor
---

Give `rc-textarea` a content language and direction separate from its
interface. The slotted `<textarea>` describes the text: its `lang` and
`spellcheck` are mirrored onto the editor, so the browser picks the right
glyphs and spelling dictionary, and its `dir` sets the editor's base
direction. `dir="auto"` resolves from the value's first strong character,
uses LTR when there is none (matching native HTML), and updates as the value changes.
Without `dir`, the editor inherits as before. The host's own `lang` stays
the interface language.

A new `line-direction` attribute (`lineDirection` property) chooses how
each line's direction is set. `base`, the default, keeps every line in the
editor's direction. `auto` orders and aligns each line with a letter by its
own first strong character, for prose that mixes scripts, and holds lines
without one (empty lines, quantities) to the base direction. Widgets and
line messages are now bidi-isolated, so they never reorder neighboring
text.

Changes to the native textarea's `lang` or `dir` rerun plugin rendering.
The plugin API adds `contentDirection`, `contentLang` and
`lineDirection(line)`. The React and Solid typings add `lineDirection` and
`line-direction`.

**Breaking:**

- Line numbers are formatted with `Intl.NumberFormat` for the interface
  locale (the host's `lang`, else `<html lang>`), so an `ar-EG` interface
  shows Arabic-Indic digits. Set `lang="ar-EG-u-nu-latn"`, or another
  `-u-nu-latn` tag, on the host to keep Latin digits.
- `getWordAtCursor()` segments words with `Intl.Segmenter` for the
  textarea's `lang` instead of matching ASCII `\w`. Accented and non-Latin
  words are now found whole, and `don't` and `3.14` are one word each;
  `snake_case` still is. Without `Intl.Segmenter` it scans letters, digits
  and `_`.
