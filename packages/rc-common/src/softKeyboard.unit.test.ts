import { afterEach, describe, expect, test, vi } from 'vitest';

import { SoftKeyboardViewport, type ViewportSize } from './softKeyboard.js';

const size = (height: number, width = 366): ViewportSize => ({ width, height });

/** Feeds measurements in order and collects each applied height. */
const heights = (
  viewport: SoftKeyboardViewport,
  steps: ReadonlyArray<readonly [height: number, focused: boolean]>,
) => steps.map(([height, focused]) => viewport.next(size(height), focused).height);

afterEach(() => {
  vi.useRealTimers();
});

describe('SoftKeyboardViewport following the keyboard', () => {
  test('follows the keyboard opening', () => {
    const viewport = new SoftKeyboardViewport();

    expect(heights(viewport, [[685, false], [442, true]])).toEqual([685, 442]);
    expect(viewport.keyboardOpen).toBe(true);
  });

  test('ignores the shorter size Firefox for Android reports while the keyboard closes', () => {
    const viewport = new SoftKeyboardViewport();

    // Measured on Firefox 158: 685 open, 442 with the keyboard, 413 for ~220ms after blur.
    expect(heights(viewport, [[685, false], [442, true], [413, false], [685, false]])).toEqual([
      685, 442, 442, 685,
    ]);

    expect(viewport.keyboardOpen).toBe(false);
  });

  test('takes the stepped growth Chrome for Android reports while the keyboard closes', () => {
    const viewport = new SoftKeyboardViewport();

    expect(
      heights(viewport, [[819, false], [531, true], [467, true], [531, false], [819, false]]),
    ).toEqual([819, 531, 467, 531, 819]);
  });

  test('follows the keyboard again when a text field takes focus mid-close', () => {
    const viewport = new SoftKeyboardViewport();

    expect(heights(viewport, [[685, false], [442, true], [413, false], [400, true]])).toEqual([
      685, 442, 442, 400,
    ]);
  });

  test('applies a shorter viewport while no keyboard is up', () => {
    const viewport = new SoftKeyboardViewport();

    expect(heights(viewport, [[685, false], [600, false]])).toEqual([685, 600]);
  });

  test('starts over when the width changes', () => {
    const viewport = new SoftKeyboardViewport();

    heights(viewport, [[685, false], [442, true]]);

    expect(viewport.next(size(300, 800), false)).toEqual(size(300, 800));
    expect(viewport.keyboardOpen).toBe(false);
  });

  test('accepts the shorter size once the close timeout passes', () => {
    vi.useFakeTimers();

    const onCloseTimeout = vi.fn();
    const viewport = new SoftKeyboardViewport({ closeTimeout: 500, onCloseTimeout });

    heights(viewport, [[685, false], [442, true], [413, false]]);
    vi.advanceTimersByTime(499);

    expect(onCloseTimeout).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(onCloseTimeout).toHaveBeenCalledOnce();
    expect(viewport.keyboardOpen).toBe(false);
    expect(viewport.next(size(413), false).height).toBe(413);
  });

  test('cancels the close timeout when the full height returns', () => {
    vi.useFakeTimers();

    const onCloseTimeout = vi.fn();
    const viewport = new SoftKeyboardViewport({ onCloseTimeout });

    heights(viewport, [[685, false], [442, true], [413, false], [685, false]]);
    vi.runAllTimers();

    expect(onCloseTimeout).not.toHaveBeenCalled();
  });

  test('reset cancels a pending close timeout and forgets the full height', () => {
    vi.useFakeTimers();

    const onCloseTimeout = vi.fn();
    const viewport = new SoftKeyboardViewport({ onCloseTimeout });

    heights(viewport, [[685, false], [442, true], [413, false]]);
    viewport.reset();
    vi.runAllTimers();

    expect(onCloseTimeout).not.toHaveBeenCalled();
    expect(viewport.next(size(413), false).height).toBe(413);
  });
});

describe('SoftKeyboardViewport keeping the full height', () => {
  test('keeps the full height while the keyboard opens and closes', () => {
    const viewport = new SoftKeyboardViewport({ heightWhileOpen: 'full' });

    expect(heights(viewport, [[685, false], [442, true], [413, false], [685, false]])).toEqual([
      685, 685, 685, 685,
    ]);
  });

  test('keeps the full height through stepped growth', () => {
    const viewport = new SoftKeyboardViewport({ heightWhileOpen: 'full' });

    expect(
      heights(viewport, [[819, false], [467, true], [531, false], [819, false]]),
    ).toEqual([819, 819, 819, 819]);
  });

  test('applies a taller window right away', () => {
    const viewport = new SoftKeyboardViewport({ heightWhileOpen: 'full' });

    expect(heights(viewport, [[685, false], [442, true], [700, true]])).toEqual([685, 685, 700]);
  });
});
