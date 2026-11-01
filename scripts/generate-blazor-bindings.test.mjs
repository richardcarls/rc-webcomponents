import assert from 'node:assert/strict';
import { test } from 'node:test';

import { eventArgsName } from './generate-blazor-bindings.mjs';
import {
  RC_EVENTS,
  registerRcEvents,
  toEventArgs,
} from '../packages/rc-webcomponents/blazor/rc-webcomponents.lib.module.js';

test('names each event arguments class after its event', () => {
  assert.equal(eventArgsName('rc-select-change'), 'RcSelectChangeEventArgs');
  assert.equal(eventArgsName('rc-change'), 'RcChangeEventArgs');
});

test('copies a detail without elements, DOM events, functions, or cycles', () => {
  class FakeNode {}

  const previous = globalThis.Node;

  globalThis.Node = FakeNode;

  try {
    const option = { value: 'a', label: 'A' };
    const detail = {
      option,
      selectedOptions: [option],
      item: new FakeNode(),
      sourceEvent: new Event('pointerdown'),
      callback: () => {},
      value: ['a'],
      nothing: null,
    };

    detail.self = detail;

    assert.deepEqual(toEventArgs(detail), {
      option: { value: 'a', label: 'A' },
      selectedOptions: [{ value: 'a', label: 'A' }],
      value: ['a'],
      nothing: null,
    });
  } finally {
    globalThis.Node = previous;
  }
});

test('registers every event with its detail as the arguments', () => {
  const registered = new Map();

  const blazor = {
    registerCustomEventType(name, options) {
      assert.ok(!registered.has(name), `${name} registered twice`);
      registered.set(name, options);
    },
  };

  registerRcEvents(blazor);
  // Both initializer hooks may run in one app.
  registerRcEvents(blazor);

  assert.deepEqual([...registered.keys()], RC_EVENTS);
  assert.ok(RC_EVENTS.includes('rc-select-change'));

  const { createEventArgs } = registered.get('rc-pagination-change');

  assert.deepEqual(createEventArgs({ detail: { page: 2, previousPage: 1 } }), {
    page: 2,
    previousPage: 1,
  });

  assert.deepEqual(createEventArgs({ detail: null }), {});
});
