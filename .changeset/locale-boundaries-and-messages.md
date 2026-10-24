---
'@rcarls/rc-common': minor
'@rcarls/rc-carousel': patch
'@rcarls/rc-combobox': patch
'@rcarls/rc-listbox': patch
'@rcarls/rc-markdown-editor': patch
'@rcarls/rc-range-slider': patch
'@rcarls/rc-select': patch
'@rcarls/rc-splitter': patch
'@rcarls/rc-textarea': patch
'@rcarls/rc-webcomponents': patch
---

Observe interface locale changes through containing shadow roots and the host's own document.
An explicit empty `lang` now means an unknown locale rather than falling back to `<html lang>`.
Typeahead compares complete grapheme prefixes, including decomposed accents and collation
expansions. Default interpolating messages format numeric positions in the interface locale
while translation callbacks continue to receive numbers and can accept an optional locale.
Default messages isolate consumer text whose direction is unknown. Textarea content direction
uses the native LTR fallback for neutral `dir="auto"` content, recognizes Arabic Letter Mark and
isolate controls, and reruns plugins when the native textarea's `lang` or `dir` changes.
