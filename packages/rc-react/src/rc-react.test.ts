import { createElement, createRef } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vitest';

import type { RCDisclosure as RCDisclosureElement } from '@rcarls/rc-webcomponents/rc-disclosure';
import { RCDisclosure } from './components/rc-disclosure.js';
import { RCRegister } from './register.js';

let root: Root | undefined;
let $container: HTMLElement | undefined;

function mount(node: Parameters<Root['render']>[0]): HTMLElement {
  $container = document.createElement('div');
  document.body.append($container);
  root = createRoot($container);
  flushSync(() => root!.render(node));

  return $container;
}

afterEach(() => {
  flushSync(() => root?.unmount());
  $container?.remove();
  root = undefined;
  $container = undefined;
});

const details = () =>
  createElement(
    'details',
    { id: 'panel' },
    createElement('summary', null, 'More'),
    createElement('p', null, 'Body'),
  );

test('a wrapper registers its element and exposes the instance through its ref', () => {
  const ref = createRef<RCDisclosureElement>();

  mount(createElement(RCDisclosure, { ref }, details()));

  expect(customElements.get('rc-disclosure')).toBeDefined();
  expect(ref.current?.localName).toBe('rc-disclosure');
  expect(ref.current?.querySelector(':scope > details')?.id).toBe('panel');
});

test('a wrapper sets element properties from props', async () => {
  const ref = createRef<RCDisclosureElement>();

  mount(createElement(RCDisclosure, { ref, open: true }, details()));

  expect(ref.current?.open).toBe(true);
  await vi.waitFor(() => expect(ref.current?.querySelector('details')?.open).toBe(true));
});

test('a wrapper maps custom events to camelCased handler props', async () => {
  const ref = createRef<RCDisclosureElement>();
  const onToggle = vi.fn();

  mount(createElement(RCDisclosure, { ref, onRcDisclosureToggle: onToggle }, details()));

  ref.current!.querySelector('summary')!.click();

  await vi.waitFor(() => expect(onToggle).toHaveBeenCalledOnce());
  expect(onToggle.mock.calls[0]?.[0].detail).toEqual({ open: true });
});

test('RCRegister loads the definitions for the tags it is given', async () => {
  expect(customElements.get('rc-progress')).toBeUndefined();

  mount(createElement(RCRegister, { tags: ['rc-progress'] }));

  await vi.waitFor(() => expect(customElements.get('rc-progress')).toBeDefined());
});
