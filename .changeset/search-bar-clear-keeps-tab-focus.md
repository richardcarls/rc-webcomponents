---
'@rcarls/rc-search-bar': patch
---

With `show-clear-on-focus`, Tab from the input now lands on the clear button and keeps focus there. The search bar stays focused while focus moves between its input and its own controls, so the button no longer turns inert while receiving focus and drops it to the page.
