import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { afterEach, expect, test, vi } from 'vitest';

import {
  MessagesController,
  messagesLocale,
  registerMessages,
  resolveMessages,
  syncDefaultAttribute,
} from './messages.js';
import { DEFAULT_REORDER_MESSAGES } from './ReorderController.js';
import { DEFAULT_RESIZE_MESSAGES } from './ResizeController.js';

// The registry is module state with no reset, so every test registers under
// its own private-use language subtag (qaa to qtz).

declare module './messages.js' {
  interface RcMessageCatalog {
    'test-base': { label: string; extra: string };
    'test-derived': { label: string; search: string };
  }
}

const DERIVED = Object.freeze({ label: 'Label', search: 'Search' });

const cleanups: Array<() => void> = [];

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
});

function fixture(html: string): HTMLElement {
  const wrapper = document.createElement('div');

  wrapper.innerHTML = html;
  document.body.append(wrapper);
  cleanups.push(() => wrapper.remove());

  return wrapper.querySelector<HTMLElement>('[data-host]') ?? wrapper;
}

function mountHost(el: HTMLElement) {
  const controllers: ReactiveController[] = [];
  const requestUpdate = vi.fn();
  const host = Object.assign(el, {
    addController: (controller: ReactiveController) => controllers.push(controller),
    removeController() {},
    requestUpdate,
    updateComplete: Promise.resolve(true),
  }) as unknown as ReactiveControllerHost & HTMLElement;
  const messages = new MessagesController(host, 'resize', DEFAULT_RESIZE_MESSAGES);

  controllers.forEach((c) => c.hostConnected?.());
  cleanups.push(() => controllers.forEach((c) => c.hostDisconnected?.()));

  return { messages, requestUpdate };
}

test('falls back to the English defaults for an unregistered locale', () => {
  const el = fixture('<span data-host lang="qaa"></span>');

  expect(resolveMessages(el, 'resize', DEFAULT_RESIZE_MESSAGES).grip).toBe('Resize');
});

test('resolves registered text for the exact tag, then its base language', () => {
  registerMessages('qab', { resize: { grip: 'Base' } });
  registerMessages('qab-CH', { resize: { grip: 'Region' } });

  const region = fixture('<span data-host lang="qab-ch"></span>');
  const other = fixture('<span data-host lang="qab-AT"></span>');

  expect(resolveMessages(region, 'resize', DEFAULT_RESIZE_MESSAGES).grip).toBe('Region');
  expect(resolveMessages(other, 'resize', DEFAULT_RESIZE_MESSAGES).grip).toBe('Base');
});

test('an inherited scope fills keys below the own scope, locale by locale', () => {
  registerMessages('qai', {
    'test-base': { label: 'Base label', extra: 'Base only' },
    'test-derived': { label: 'Derived label' },
  });

  registerMessages('qai-CH', { 'test-base': { label: 'Base region label' } });

  const resolve = (lang: string) =>
    resolveMessages(fixture(`<span data-host lang="${lang}"></span>`), 'test-derived', DERIVED, undefined, {
      inherit: 'test-base',
    });

  // Within one locale the own scope wins; keys it has no default for stay out.
  expect(resolve('qai')).toEqual({ label: 'Derived label', search: 'Search' });
  // A more specific locale wins, even from the inherited scope.
  expect(resolve('qai-CH').label).toBe('Base region label');
});

test('MessagesController passes its inherited scope through', () => {
  registerMessages('qaj', { 'test-base': { label: 'Base label' } });

  const host = Object.assign(fixture('<span data-host lang="qaj"></span>'), {
    addController: () => {},
    requestUpdate: () => {},
  }) as unknown as ReactiveControllerHost & HTMLElement;
  const messages = new MessagesController(host, 'test-derived', DERIVED, { inherit: 'test-base' });

  expect(messages.value.label).toBe('Base label');
});

test('an override wins over registered text, and an undefined one does not', () => {
  registerMessages('qac', { resize: { grip: 'Registered' } });

  const el = fixture('<span data-host lang="qac"></span>');

  const own = resolveMessages(el, 'resize', DEFAULT_RESIZE_MESSAGES, { grip: 'Own' });
  const unset = resolveMessages(el, 'resize', DEFAULT_RESIZE_MESSAGES, { grip: undefined });

  expect(own.grip).toBe('Own');
  expect(unset.grip).toBe('Registered');
});

test("reads the element's own lang, then <html lang>, never an ancestor's", () => {
  const html = document.documentElement;
  const previous = html.getAttribute('lang');

  cleanups.push(() =>
    previous === null ? html.removeAttribute('lang') : html.setAttribute('lang', previous),
  );

  html.lang = 'qad';
  registerMessages('qad', { resize: { grip: 'Page' } });
  registerMessages('qae', { resize: { grip: 'Content' } });

  const el = fixture('<article lang="qae"><span data-host></span></article>');

  expect(messagesLocale(el)).toBe('qad');
  expect(resolveMessages(el, 'resize', DEFAULT_RESIZE_MESSAGES).grip).toBe('Page');

  el.lang = 'qae';
  expect(resolveMessages(el, 'resize', DEFAULT_RESIZE_MESSAGES).grip).toBe('Content');
});

test('later registrations merge key by key', () => {
  registerMessages('qaf', { resize: { grip: 'First' }, reorder: { instructions: 'Kept' } });
  registerMessages('qaf', { resize: { grip: 'Second' } });

  const el = fixture('<span data-host lang="qaf"></span>');

  expect(resolveMessages(el, 'resize', DEFAULT_RESIZE_MESSAGES).grip).toBe('Second');
  expect(resolveMessages(el, 'reorder', DEFAULT_REORDER_MESSAGES).instructions).toBe('Kept');
});

test('MessagesController requests an update when its lang changes', async () => {
  registerMessages('qag', { resize: { grip: 'Changed' } });

  const el = fixture('<span data-host lang="qah"></span>');
  const { messages, requestUpdate } = mountHost(el);

  expect(messages.value.grip).toBe('Resize');

  el.lang = 'qag';
  await vi.waitFor(() => expect(requestUpdate).toHaveBeenCalledTimes(1));
  expect(messages.value.grip).toBe('Changed');
  expect(messages.locale).toBe('qag');
});

test('MessagesController requests an update when text is registered', async () => {
  const el = fixture('<span data-host lang="qai"></span>');
  const { messages, requestUpdate } = mountHost(el);

  expect(messages.value.grip).toBe('Resize');

  registerMessages('qai', { resize: { grip: 'Late' } });
  expect(requestUpdate).toHaveBeenCalledTimes(1);
  expect(messages.value.grip).toBe('Late');
});

test('MessagesController ignores a lang change elsewhere in the document', async () => {
  const el = fixture('<span data-host lang="qaj"></span>');
  const other = fixture('<span data-host></span>');
  const { messages, requestUpdate } = mountHost(el);

  void messages.value;
  other.lang = 'qak';
  el.dir = 'rtl';

  // The dir change flushes the same mutation batch without changing the locale.
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(requestUpdate).not.toHaveBeenCalled();
});

test('syncDefaultAttribute rewrites its own value and leaves an authored one', () => {
  const owned = fixture('<span data-host></span>');
  const authored = fixture('<span data-host aria-roledescription="authored"></span>');

  const written = syncDefaultAttribute(owned, 'aria-roledescription', 'one', null);

  expect(syncDefaultAttribute(owned, 'aria-roledescription', 'two', written)).toBe('two');
  expect(owned.getAttribute('aria-roledescription')).toBe('two');

  expect(syncDefaultAttribute(authored, 'aria-roledescription', 'two', null)).toBeNull();
  expect(authored.getAttribute('aria-roledescription')).toBe('authored');
});
