type LocaleListener = () => void;

const listeners = new Set<LocaleListener>();

let observer: MutationObserver | null = null;

function notify(): void {
  for (const listener of Array.from(listeners)) {
    listener();
  }
}

/**
 * Calls `listener` whenever a `dir` or `lang` attribute changes anywhere in
 * the document, such as a language switcher setting both on `<html>`, and
 * whenever `registerMessages()` adds strings.
 *
 * Nothing in the platform signals a direction or language change: no event
 * fires, and a flip that keeps every box the same size fires no
 * ResizeObserver either. So anything measured or rendered from the resolved
 * direction, and any text resolved for a locale, goes stale until something
 * else happens to re-run it. Every subscriber shares one observer, filtered
 * to `dir` and `lang` so ordinary attribute churn never reaches it.
 *
 * It sees the light DOM only. A `dir` or `lang` set inside a shadow root, or
 * a `direction` or `writing-mode` changed through a stylesheet, is not
 * observed; those owners must refresh their descendants themselves.
 *
 * Returns a function that unsubscribes.
 */
export function observeLocale(listener: LocaleListener): () => void {
  listeners.add(listener);

  if (!observer && typeof MutationObserver === 'function' && typeof document !== 'undefined') {
    observer = new MutationObserver(notify);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir', 'lang'],
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

/** Notifies every {@link observeLocale} subscriber, as a `lang` change would. */
export function notifyLocaleChange(): void {
  notify();
}
