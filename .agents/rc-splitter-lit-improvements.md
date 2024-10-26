# rc-splitter Lit Best Practices Improvements

## Summary

Analysis of `rc-splitter` component against Lit best practices rules identified several improvement opportunities across critical, high, and medium priority levels.

---

## Critical Priority

### 1. Add Custom Events for Value Changes (Rule 4-1)

**Issue:** When the splitter value changes via keyboard or mouse, no events are dispatched. Parent components cannot react to value changes.

**Fix:** Dispatch a composed `rc-splitter-change` event when value changes.

**File:** [rc-splitter.ts](packages/rc-splitter/src/rc-splitter.ts)

```typescript
// In value setter, after updating _value:
this.dispatchEvent(new CustomEvent('rc-splitter-change', {
  bubbles: true,
  composed: true,
  detail: { value: this._value, valueText: this.valueText }
}));
```

---

## High Priority

### 2. Add delegatesFocus for Focus Management (Rule 6-1)

**Issue:** Component has an internal focusable separator handle but doesn't delegate focus. Clicking the host won't focus the handle.

**Fix:** Add `shadowRootOptions` with `delegatesFocus: true`.

```typescript
static shadowRootOptions: ShadowRootInit = {
  ...LitElement.shadowRootOptions,
  delegatesFocus: true
};
```

### 3. Move ResizeObserver Setup to firstUpdated (Rule 5-2)

**Issue:** Current code uses `await this.updateComplete` in `connectedCallback`, which is less idiomatic than using `firstUpdated`.

**Fix:** Move resize observer setup to `firstUpdated()`.

```typescript
firstUpdated(changedProperties: PropertyValues) {
  super.firstUpdated(changedProperties);
  this._resizeObserver.observe(this);
  this._onResize();
}

connectedCallback() {
  super.connectedCallback();
  // Remove the async/await pattern
}
```

### 4. Fix _defaultValue Initialization Timing

**Issue:** `_defaultValue` is initialized in a class field using `this.getAttribute('value')`, but attributes may not be available at class instantiation time.

**Fix:** Move default value handling to `connectedCallback` or use Lit's attribute converter.

```typescript
connectedCallback() {
  super.connectedCallback();
  if (!this._initialMax) {
    this._defaultValue = parseFloat(this.getAttribute('value') ?? '0.0');
  }
}
```

---

## Medium Priority

### 5. Reflect orientation Property (Rule 1-3)

**Issue:** `orientation` is used in CSS (`:host([orientation='vertical'])`) but isn't reflected to attribute.

**Fix:** Add `reflect: true`:

```typescript
@property({ type: String, reflect: true })
orientation: SplitterOrientation = 'horizontal';
```

### 6. Add :host([hidden]) Style (Rule 3-2)

**Issue:** Missing hidden state handling in styles.

**File:** [rc-splitter.styles.ts](packages/rc-splitter/src/rc-splitter.styles.ts)

```css
:host([hidden]) {
  display: none;
}
```

### 7. Remove Invalid `useDefault` Property Option

**Issue:** `useDefault` is not a standard Lit decorator option. It appears on multiple properties.

**Fix:** Remove `useDefault: true` from all `@property` decorators - Lit handles defaults via the initial value assignment.

---

## Files to Modify

1. **[rc-splitter.ts](packages/rc-splitter/src/rc-splitter.ts)** - Main component logic
2. **[rc-splitter.styles.ts](packages/rc-splitter/src/rc-splitter.styles.ts)** - Component styles

---

## Verification

1. Run `yarn workspace @rcarls/rc-splitter build` to verify TypeScript compilation
2. Run `yarn workspace @rcarls/rc-splitter test:browser` to run existing tests
3. Manual testing:
   - Open dev server: `yarn workspace @rcarls/rc-splitter dev`
   - Verify keyboard resize (arrow keys) still works
   - Verify mouse drag resize still works
   - Verify focus delegation (click host → separator gets focus)
   - Listen for `rc-splitter-change` event in browser console
