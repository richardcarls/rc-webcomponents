import { ReactiveElement } from 'lit';
import { afterEach, expect, test, vi } from 'vitest';

import { MorphRecoveryController, type MorphRecoveryOptions } from './MorphRecoveryController.js';

let counter = 0;
let $host: HTMLElement | undefined;

afterEach(() => {
  $host?.remove();
  $host = undefined;
});

/** Defines and connects an element whose controller uses `options`. */
async function connect(options: MorphRecoveryOptions, markup = '<button>Go</button>') {
  const tag = `test-morph-recovery-${++counter}`;

  class TestElement extends ReactiveElement {
    readonly recovery = new MorphRecoveryController(this, options);

    protected override createRenderRoot() {
      return this;
    }
  }

  customElements.define(tag, TestElement);

  const $element = document.createElement(tag) as TestElement;

  $element.innerHTML = markup;
  document.body.append($element);
  $host = $element;
  await $element.updateComplete;

  return $element;
}

/** Lets the observer callback and the recovery it queues run. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

test('writes the default role on connect unless the author set one', async () => {
  const $element = await connect({ role: 'group' });

  expect($element.getAttribute('role')).toBe('group');

  $element.remove();
  $element.setAttribute('role', 'region');
  document.body.append($element);

  expect($element.getAttribute('role')).toBe('region');
});

test('restores the default role after a removal', async () => {
  const $element = await connect({ role: 'group' });

  $element.removeAttribute('role');
  await flush();

  expect($element.getAttribute('role')).toBe('group');
});

test('runs resync once for a batch of removals in the light DOM', async () => {
  const resync = vi.fn(function (this: void) {
    $host?.querySelector('button')?.setAttribute('aria-pressed', 'false');
  });
  const $element = await connect({ resync });
  const $button = $element.querySelector('button')!;

  $button.setAttribute('aria-pressed', 'false');
  $button.setAttribute('tabindex', '0');
  await flush();
  resync.mockClear();

  $button.removeAttribute('aria-pressed');
  $button.removeAttribute('tabindex');
  await flush();

  expect(resync).toHaveBeenCalledTimes(1);
  expect($button.getAttribute('aria-pressed')).toBe('false');
});

test('ignores a changed default attribute that was not removed', async () => {
  const resync = vi.fn();
  const $element = await connect({ resync }, '<button tabindex="0">Go</button>');

  $element.querySelector('button')!.setAttribute('tabindex', '-1');
  await flush();

  expect(resync).not.toHaveBeenCalled();
});

test('reacts to any change of a listed attribute', async () => {
  const resync = vi.fn();
  const $element = await connect(
    { attributes: ['popover'], resync },
    '<div popover="manual">Tip</div>',
  );

  $element.querySelector('div')!.setAttribute('popover', '');
  await flush();

  expect(resync).toHaveBeenCalledTimes(1);
});

test('does not recover from the attribute writes of its own resync', async () => {
  const resync = vi.fn(() => {
    // A resync that removes an attribute must not trigger itself again.
    $host?.querySelector('button')?.removeAttribute('aria-busy');
  });
  const $element = await connect({ resync }, '<button aria-busy="true">Go</button>');
  const $button = $element.querySelector('button')!;

  $button.removeAttribute('aria-label');
  $button.setAttribute('aria-label', 'Go');
  $button.removeAttribute('aria-label');
  await flush();
  await flush();

  expect(resync).toHaveBeenCalledTimes(1);
});

test('stops watching while disconnected', async () => {
  const resync = vi.fn();
  const $element = await connect({ resync }, '<button aria-pressed="true">Go</button>');

  $element.remove();
  $element.querySelector('button')!.removeAttribute('aria-pressed');
  await flush();

  expect(resync).not.toHaveBeenCalled();
});
