# @rcarls/rc-button

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- 5312d29: Disable native buttons while pending or progressing, add determinate progress percentages, and
  support controlled and uncontrolled APG toggle buttons with selected icon switching.
- e11c4b7: Add the rc-button package for native button enhancement.

### Patch Changes

- 51b2c8f: Prevent pending and progress states from repeatedly writing the native button's disabled state.
- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- f1b38b5: Document all `rc-button` CSS custom properties and the `has-icon`,
  `has-selected-icon`, and `has-label` reflected attributes.
