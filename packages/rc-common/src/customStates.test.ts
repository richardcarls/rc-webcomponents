import { afterEach, expect, test, vi } from 'vitest';

import { setCustomState, supportsCustomStates } from './customStates.js';

class StateTestElement extends HTMLElement {
  readonly internals = this.attachInternals();
}

customElements.define('rc-custom-state-test', StateTestElement);

function stubStateSelector(supported: boolean): void {
  const supports = CSS.supports.bind(CSS);

  vi.spyOn(CSS, 'supports').mockImplementation((...args: [string, string?]) =>
    args[0].includes(':state(') ? supported : supports(...(args as [string])),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('sets and clears a state where :state() matches', () => {
  const element = document.createElement('rc-custom-state-test') as StateTestElement;

  expect(supportsCustomStates()).toBe(true);
  expect(setCustomState(element.internals, 'open', true)).toBe(true);
  expect(element.matches(':state(open)')).toBe(true);

  setCustomState(element.internals, 'open', false);

  expect(element.matches(':state(open)')).toBe(false);
});

test('does not touch CustomStateSet without :state() support', () => {
  // Chromium 90–124 throws from states.add() for a name without "--".
  const element = document.createElement('rc-custom-state-test') as StateTestElement;
  const add = vi.spyOn(element.internals.states, 'add').mockImplementation(() => {
    throw new DOMException('The specified value must start with "--"', 'SyntaxError');
  });

  stubStateSelector(false);

  expect(supportsCustomStates()).toBe(false);
  expect(setCustomState(element.internals, 'open', true)).toBe(false);
  expect(add).not.toHaveBeenCalled();
});

test('reports a missing ElementInternals as not applied', () => {
  expect(setCustomState(undefined, 'open', true)).toBe(false);
});
