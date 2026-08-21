# @rcarls/rc-virtual-canvas

## 0.4.2

## 0.4.1

## 0.4.0

### Patch Changes

- 037b1b3: Add try/catch for ResizeObserver.observe() for WebKit TypeError
- d49cde9: Fix `contentWidth`/`contentHeight` so their HTML attributes are `content-width`/`content-height`,
  matching every other multi-word attribute in the library. They previously had no kebab-case
  mapping, so `<rc-virtual-canvas content-width="...">` was silently ignored.

## 0.3.2

## 0.3.1

## 0.3.0

### Added

- Add read-only `canvasScaleX` and `canvasScaleY` getters.

### Changed

- Update package metadata, README intro, and docs links.

## 0.2.0
