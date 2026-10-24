import { afterEach, expect, test, vi } from 'vitest';

import { observeLocale } from './observeLocale.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
});

function fixture(): HTMLElement {
  const el = document.createElement('div');

  document.body.append(el);
  cleanups.push(() => el.remove());

  return el;
}

test('notifies every subscriber when a dir attribute changes anywhere', async () => {
  const el = fixture();
  const first = vi.fn();
  const second = vi.fn();

  cleanups.push(observeLocale(first), observeLocale(second));
  el.dir = 'rtl';

  await vi.waitFor(() => {
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});

test('notifies when a lang attribute changes', async () => {
  const el = fixture();
  const listener = vi.fn();

  cleanups.push(observeLocale(listener));
  el.lang = 'ar';

  await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
});

test('ignores other attribute changes', async () => {
  const el = fixture();
  const listener = vi.fn();

  cleanups.push(observeLocale(listener));
  el.setAttribute('title', 'Title');
  el.style.color = 'red';
  el.dir = 'rtl';

  // The dir change is the flush point: any earlier record would have been
  // delivered in the same batch.
  await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
});

test('stops notifying after unsubscribing', async () => {
  const el = fixture();
  const kept = vi.fn();
  const dropped = vi.fn();

  cleanups.push(observeLocale(kept));
  observeLocale(dropped)();
  el.dir = 'rtl';

  await vi.waitFor(() => expect(kept).toHaveBeenCalledTimes(1));
  expect(dropped).not.toHaveBeenCalled();
});

test('observes again after every subscriber has left', async () => {
  const el = fixture();
  const listener = vi.fn();

  observeLocale(vi.fn())();
  cleanups.push(observeLocale(listener));
  el.dir = 'rtl';

  await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
});

test('observes host ancestors inside nested shadow roots', async () => {
  const outer = fixture();
  const outerRoot = outer.attachShadow({ mode: 'open' });
  const inner = document.createElement('div');
  const innerRoot = inner.attachShadow({ mode: 'open' });
  const host = document.createElement('span');
  const listener = vi.fn();

  outerRoot.append(inner);
  innerRoot.append(host);
  cleanups.push(observeLocale(listener, host));

  inner.lang = 'ar';
  await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));

  host.dir = 'rtl';
  await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(2));

  outer.dir = 'rtl';
  await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(3));
});

test('observes the host document rather than the global document', async () => {
  const other = document.implementation.createHTMLDocument('other');
  const host = other.createElement('div');
  const listener = vi.fn();

  other.body.append(host);
  cleanups.push(observeLocale(listener, host));

  other.documentElement.lang = 'ar';
  await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
});
