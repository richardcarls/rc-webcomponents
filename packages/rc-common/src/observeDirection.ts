type DirectionListener = () => void;

const listeners = new Set<DirectionListener>();

let observer: MutationObserver | null = null;

function notify(): void {
  for (const listener of Array.from(listeners)) {
    listener();
  }
}

/**
 * Calls `listener` whenever a `dir` attribute changes anywhere in the
 * document, such as a language switcher setting `dir` on `<html>`.
 *
 * Nothing in the platform signals a direction change: no event fires, and a
 * flip that keeps every box the same size fires no ResizeObserver either. So
 * anything measured or rendered from the resolved direction goes stale until
 * something else happens to re-run it. Every subscriber shares one observer,
 * filtered to `dir` so ordinary attribute churn never reaches it.
 *
 * It sees the light DOM only. A `dir` set inside a shadow root, or a
 * `direction` or `writing-mode` changed through a stylesheet, is not
 * observed; those owners must refresh their descendants themselves.
 *
 * Returns a function that unsubscribes.
 */
export function observeDirection(listener: DirectionListener): () => void {
  listeners.add(listener);

  if (!observer && typeof MutationObserver === 'function' && typeof document !== 'undefined') {
    observer = new MutationObserver(notify);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
      subtree: true,
    });
  }

  return () => {
    listeners.delete(listener);

    if (!listeners.size) {
      observer?.disconnect();
      observer = null;
    }
  };
}

export default observeDirection;
