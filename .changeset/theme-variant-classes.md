---
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-win31': minor
---

**Breaking:** theme variants are classes, and the Material error tone uses the
Material role name.

| Removed | Use |
| --- | --- |
| `data-rc-material-rich-tooltip` | `class="rc-popover--rich"` |
| `data-rc-win31-default` | `class="rc-button--default"` |
| `data-rc-win31-toggle` | `class="rc-switch--toggle"` |
| `data-tone="danger"` | `data-rc-tone="error"` |

Migration: replace the attributes as the table shows.
