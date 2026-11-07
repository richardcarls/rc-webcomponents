import { expect, vi } from 'vitest';

/**
 * Wait until a CSS transition on `property` reaches `value`.
 *
 * Headless WebKit can report a transition `finished` while
 * `getComputedStyle()` keeps an in-between sample, so a finished
 * `CSSTransition` whose last keyframe is `value` also counts as settled.
 */
export async function waitForTransitionTo(
  target: Element,
  property: string,
  value: string,
): Promise<void> {
  await vi.waitFor(() => {
    if (getComputedStyle(target).getPropertyValue(property) === value) {
      return;
    }

    // `CSSTransition` isn't in every DOM lib this repo compiles against.
    const transition = target
      .getAnimations()
      .find(
        (animation) =>
          (animation as Animation & { transitionProperty?: string }).transitionProperty ===
          property,
      );
    const keyframes = (transition?.effect as KeyframeEffect | null)?.getKeyframes() ?? [];

    expect(transition?.playState, `${property} transition`).toBe('finished');
    expect(keyframes[keyframes.length - 1]?.[property]).toBe(value);
  });
}
