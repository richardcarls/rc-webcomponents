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

### 2. Simplify Lifecycle with firstUpdated (Rule 5-2)

**Issue:** Current code uses `await this.updateComplete` in `connectedCallback`, which is less idiomatic. The `_onResize()` method requires shadow DOM to be ready.

**Fix:** Split responsibilities:
- `connectedCallback`: Register observer (no DOM needed, handles reconnection)
- `firstUpdated`: Initial resize measurement (DOM ready)

```typescript
connectedCallback() {
  super.connectedCallback();
  this._resizeObserver.observe(this);  // No await needed - just registers observer
}

firstUpdated(changedProperties: PropertyValues) {
  super.firstUpdated(changedProperties);
  this._onResize();  // Shadow DOM now available
}
```

**Note:** We keep `connectedCallback` (not remove it) because when the element is disconnected and reconnected, `firstUpdated` won't fire again but we need to re-observe.

### 3. Fix _defaultValue Initialization with Lit Attribute Handling

**Issue:** `_defaultValue` is initialized in a class field using `this.getAttribute('value')`, but attributes may not be available at class instantiation time.

**Fix:** Use a separate `initialValue` property that Lit handles automatically:

```typescript
/** Initial value from attribute, used before first resize */
@property({ type: Number, attribute: 'value' })
initialValue: number | null = null;

// Change _value to @state (remove the @property decorator from value)
@state()
private _value: number = 0;

// Keep the getter/setter for value, but it's now state-only
get value() { return this._value; }
set value(val: number) {
  this._lastValue = this._value;
  this._value = Math.min(
    Math.max(Math.round(val / this.step) * this.step, this._minValue),
    this._maxValue
  );
}

// Remove _defaultValue field entirely

// In _onResize, update the initialization:
if (!this._initialMax) {
  this._initialMax = this._maxValue;
  this.value = this.initialValue ?? this._maxValue / 2;
}
```

**Benefits:**
- Lit handles attribute parsing automatically
- No manual `getAttribute()` calls
- Clear separation: `initialValue` (from HTML attribute) vs `value` (live state)

---

## Medium Priority

### 4. Reflect orientation Property (Rule 1-3)

**Issue:** `orientation` is used in CSS (`:host([orientation='vertical'])`) but isn't reflected to attribute.

**Fix:** Add `reflect: true`:

```typescript
@property({ type: String, reflect: true })
orientation: SplitterOrientation = 'horizontal';
```

### 5. Add :host([hidden]) Style (Rule 3-2)

**Issue:** Missing hidden state handling in styles.

**File:** [rc-splitter.styles.ts](packages/rc-splitter/src/rc-splitter.styles.ts)

```css
:host([hidden]) {
  display: none;
}
```

### 6. Remove Invalid `useDefault` Property Option

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
   - Listen for `rc-splitter-change` event in browser console
