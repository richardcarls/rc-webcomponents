---
'@rcarls/rc-page-turner': patch
---

Wait for page children to be defined without repeatedly queuing microtasks, and upgrade children
whose definition already exists before assigning their accessible names.
