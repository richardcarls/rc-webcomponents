---
'@rcarls/rc-textarea': patch
---

Normalize CRLF and CR line endings to LF in `value`, `defaultValue`, and inserted text, as a native textarea does. Text with CRLF line breaks no longer keeps a `\r` on each line, which collapsed empty lines in Chromium and could misalign the gutter.
