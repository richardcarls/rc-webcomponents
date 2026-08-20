# @rcarls/rc-snackbar

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- 4171a9d: Give `open` proper controlled/uncontrolled backing (host writes are silent,
  new `default-open` attribute seeds initial visible state), matching every
  other stateful `open`/`value` property in the library. `show()`, `close()`,
  and `clear()` are unaffected.
- 985068e: Add the rc-snackbar package for queued live-region status messages.

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
