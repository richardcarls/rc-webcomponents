import { logicalRect, type Flow, type LogicalAxis } from '@rcarls/rc-common';
import { resolvedTracks, trackSpan, type Geometry } from './range.js';

export type LayoutSample =
  | { kind: 'ready' | 'incomplete'; geometry: Geometry }
  | { kind: 'unsupported'; reason: string };

/** Sample regular line geometry without changing the consumer's layout. */
export function sampleLayout(
  $container: Element,
  axis: LogicalAxis,
  flow: Flow,
  override: number,
  previous: Geometry,
): LayoutSample {
  const styles = getComputedStyle($container);
  const $items = $container.children;
  const $first = $items.item(0);
  const gap = Number.parseFloat(axis === 'inline' ? styles.columnGap : styles.rowGap) || 0;
  const unsupported = (reason: string): LayoutSample => ({ kind: 'unsupported', reason });
  const grid = styles.display === 'grid' || styles.display === 'inline-grid';

  if (grid) {
    if (styles.gridAutoFlow.includes('dense')) {
      return unsupported('Dense grid placement is not a sequential collection.');
    }

    if (styles.gridAutoFlow !== (axis === 'inline' ? 'column' : 'row')) {
      return unsupported('Grid auto-flow must advance along the windowed axis.');
    }

    const cross = resolvedTracks(
      axis === 'inline' ? styles.gridTemplateRows : styles.gridTemplateColumns,
    );
    const along = resolvedTracks(
      axis === 'inline' ? styles.gridTemplateColumns : styles.gridTemplateRows,
    );

    if (!$first) {
      return {
        kind: 'incomplete',
        geometry: { ...previous, itemsPerLine: override || previous.itemsPerLine },
      };
    }

    const firstStyle = getComputedStyle($first);
    const span = cross
      ? trackSpan(
          axis === 'inline' ? firstStyle.gridRowStart : firstStyle.gridColumnStart,
          axis === 'inline' ? firstStyle.gridRowEnd : firstStyle.gridColumnEnd,
          cross.length,
        )
      : null;
    const capacity = override || (cross && span ? Math.floor(cross.length / span) : 0);

    if (!capacity) {
      return unsupported(
        'Cannot infer grid capacity; set items-per-line for a uniform sequential layout.',
      );
    }

    // Inspect a bounded sample even when focus pins thousands of rendered items.
    for (let i = 0; i < Math.min($items.length, capacity * 3); i++) {
      const $item = $items.item(i);

      if (!$item) {
        continue;
      }

      const itemStyle = getComputedStyle($item);
      const alongStart = axis === 'inline' ? itemStyle.gridColumnStart : itemStyle.gridRowStart;
      const alongEnd = axis === 'inline' ? itemStyle.gridColumnEnd : itemStyle.gridRowEnd;
      const itemSpan = cross
        ? trackSpan(
            axis === 'inline' ? itemStyle.gridRowStart : itemStyle.gridColumnStart,
            axis === 'inline' ? itemStyle.gridRowEnd : itemStyle.gridColumnEnd,
            cross.length,
          )
        : null;

      if (
        itemStyle.order !== '0' ||
        (!override && itemSpan !== span) ||
        trackSpan(alongStart, alongEnd, along?.length ?? 1) !== 1
      ) {
        return unsupported('Items must use uniform spans and sequential DOM-order placement.');
      }
    }

    const trackSize = along?.[0];

    if (trackSize === undefined || trackSize === 0) {
      return { kind: 'incomplete', geometry: { ...previous, itemsPerLine: capacity } };
    }

    if (along?.some((size) => Math.abs(size - trackSize) > 0.5)) {
      return unsupported('Grid lines must have a uniform pitch.');
    }

    return {
      kind: 'ready',
      geometry: { itemsPerLine: capacity, lineSize: trackSize + gap, measured: true },
    };
  }

  if (
    override > 1 ||
    (styles.display.includes('flex') &&
      (styles.flexWrap !== 'nowrap' ||
        styles.flexDirection !== (axis === 'inline' ? 'row' : 'column')))
  ) {
    return unsupported('Non-grid collections must form one sequential, nonwrapping line of items.');
  }

  if (!$first) {
    return { kind: 'incomplete', geometry: { ...previous, itemsPerLine: 1 } };
  }

  const firstRect = $first.getBoundingClientRect();
  const own = logicalRect(firstRect, firstRect, flow);
  const extent = axis === 'inline' ? own.inlineSize : own.blockSize;
  let pitch = extent + gap;

  for (let i = 1; i < Math.min($items.length, 3); i++) {
    const $item = $items.item(i);

    if (!$item) {
      continue;
    }

    const rect = logicalRect($item.getBoundingClientRect(), firstRect, flow);
    const start = axis === 'inline' ? rect.inlineStart : rect.blockStart;
    const size = axis === 'inline' ? rect.inlineSize : rect.blockSize;

    if (i === 1) {
      pitch = start;
    }

    if (Math.abs(size - extent) > 0.5 || Math.abs(start - i * pitch) > 0.5 || pitch <= 0) {
      return unsupported('Items must have a uniform pitch and follow DOM order.');
    }
  }

  return pitch > 0
    ? { kind: 'ready', geometry: { itemsPerLine: 1, lineSize: pitch, measured: true } }
    : { kind: 'incomplete', geometry: previous };
}
