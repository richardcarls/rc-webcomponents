---
"@rcarls/rc-markdown-editor": minor
"@rcarls/rc-webcomponents": patch
---

Improve rich-mode editing UX and fix a pre-existing accessibility violation.

**New behavior**

- **Link popover**: clicking the Link toolbar button (or `Ctrl+K`) now opens an inline shadow-DOM popover instead of `window.prompt`. The popover provides URL input, an apply button (Enter), an open-in-new-tab button, and a remove-link button. Clicking outside dismisses it.
- **Word expansion**: activating a character-scope format (bold, italic, underline, strikethrough, inline code, link) with a collapsed cursor automatically expands the selection to the surrounding word boundary before applying. Works in both rich and source modes.
- **Ctrl+Click to open links**: holding Ctrl (or Meta on Mac) and clicking an anchor in rich view opens the link in a new tab.
- **Link pointer cursor**: anchors in rich view now render with `cursor: pointer` and an underline so they are visually distinct from plain text.
- **Link active state**: the Link toolbar button reflects `aria-pressed="true"` when the cursor is inside an anchor in rich view.

**Bug fix**

- The heading-level `<rc-select>` in the formatting toolbar lacked an accessible name on its internal combobox trigger, causing an axe `aria-input-field-name` violation. Fixed by setting `placeholder="Heading level"` so the accessible name is declared in the component template rather than applied imperatively after a microtask delay.
