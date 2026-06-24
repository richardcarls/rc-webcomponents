---
"@rcarls/rc-webcomponents": minor
---

**rc-webcomponents:** Add `./react` export — ship `react.d.ts` JSX type augmentation for React users.

Import from `@rcarls/rc-webcomponents/react` to get attribute completions and typed refs for all components without writing a local `.d.ts`. Add a triple-slash reference to your project's env declaration file:

```ts title="vite-env.d.ts"
/// <reference types="vite/client" />
/// <reference types="@rcarls/rc-webcomponents/react" />
```

This also exports ref types (`RCSelectRef`, `RCComboboxRef`, `RCDialogRef`, …) and event detail types (`RCSelectChangeDetail`, `RCComboboxCreateDetail`, …) so refs and custom event casts are fully typed:

```ts
import type { RCComboboxRef, RCComboboxCreateDetail } from '@rcarls/rc-webcomponents/react';

const ref = useRef<RCComboboxRef>(null);
comboEl.addEventListener('rc-combobox-create', (e: Event) => {
  const { text } = (e as CustomEvent<RCComboboxCreateDetail>).detail;
});
```

Also fixes a bug in `solid.d.ts` where `rc-fab` was typed with non-existent `variant`/`label`/`disabled` props — correct props are `position` and `scroll-reveal`.
