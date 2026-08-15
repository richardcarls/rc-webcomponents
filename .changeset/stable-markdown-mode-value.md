---
'@rcarls/rc-markdown-editor': patch
---

Preserve controlled Markdown values across initial rich/source mode setup,
ignore change events emitted by the inactive source editor, and sanitize rich
Markdown output while retaining the editor's supported underline markup. Keep
source-mode focus and read-only behavior aligned with the active editor surface.
