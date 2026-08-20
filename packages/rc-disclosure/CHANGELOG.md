# @rcarls/rc-disclosure

## 0.4.2

### Patch Changes

- b12bf1b: Fix `rc-disclosure` silently discarding an initial `<details open>` on connect.
  `_setupDetails()` always synced the wrapped `<details>`'s open state from the host's own
  `open` attribute, defaulting to closed whenever the host had no explicit `open` of its
  own, even if the `<details>` markup said otherwise. Plain `<details open>` inside
  `<rc-disclosure>` (no `open` on the host) now opens as expected, and the host adopts that
  state instead of defaulting to closed. The host's own `open` attribute still wins whenever
  it's set explicitly.

## 0.4.1

## 0.4.0

### Patch Changes

- 1161caa: Document the `open` and deprecated `fragment` attributes, and give the
  deprecated `fragment` accessor a real summary line instead of only
  `@deprecated` text, so the generated API reference shows a description
  instead of a blank one.

## 0.3.2

## 0.3.1

## 0.3.0

### Changed

- Open and scroll automatically when the URL hash targets content inside the disclosure.
- Deprecate the `fragment` attribute; fragment targeting is now always enabled.
- Update package metadata, README intro, and docs links.

### Migration

- Remove `fragment`; it no longer changes behavior.

## 0.2.0
