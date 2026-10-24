import { afterEach, expect, test } from 'vitest';

import './defaults.css';
import './bridge.css';
import './native.css';
import './css-components.css';

afterEach(() => {
  document.body.replaceChildren();
});

test('opt-in native layer styles controls without taking over RC-owned children', () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-substrate';

  scope.style.cssText =
    '--rc-button-bg: rgb(1 2 3); --rc-button-color: rgb(4 5 6); --rc-font-family: monospace; --rc-font-size: 19px; --rc-font-weight: 600; --rc-line-height: 1.4;';

  scope.innerHTML = `
    <button type="button">Native action</button>
    <input type="text" aria-label="Native text">
    <select aria-label="Native select"><option>One</option></select>
    <textarea aria-label="Native textarea"></textarea>
    <input type="checkbox" aria-label="Native checkbox">
    <input type="range" aria-label="Native range">
    <progress value="2" max="5"></progress>
    <input aria-label="Omitted type">
    <rc-button><button type="button">Owned action</button></rc-button>
    <rc-button><div><button type="button">Nested owned action</button></div></rc-button>
    <rc-card><button slot="actions" type="button">Card action</button></rc-card>
  `;

  document.body.append(scope);

  const nativeButton = scope.querySelector('button:not(rc-button > button)')!;
  const nativeInput = scope.querySelector('input[type="text"]')!;
  const nativeSelect = scope.querySelector('select')!;
  const nativeTextarea = scope.querySelector('textarea')!;
  const omittedInput = scope.querySelector('input:not([type])')!;
  const ownedButton = scope.querySelector('rc-button > button')!;
  const nestedOwnedButton = scope.querySelector('rc-button > div > button')!;
  const cardAction = scope.querySelector('rc-card > button')!;

  expect(getComputedStyle(nativeButton).minBlockSize).not.toBe('0px');
  expect(getComputedStyle(nativeButton).backgroundColor).toBe('rgb(1, 2, 3)');
  expect(getComputedStyle(nativeButton).color).toBe('rgb(4, 5, 6)');
  expect(getComputedStyle(nativeButton).fontFamily).toContain('monospace');
  expect(getComputedStyle(nativeInput).fontSize).toBe('19px');
  expect(getComputedStyle(nativeInput).minBlockSize).not.toBe('0px');
  expect(getComputedStyle(nativeSelect).minBlockSize).not.toBe('0px');
  expect(getComputedStyle(nativeTextarea).minBlockSize).not.toBe('0px');
  expect(getComputedStyle(omittedInput).minBlockSize).not.toBe('0px');
  expect(getComputedStyle(cardAction).minBlockSize).not.toBe('0px');
  expect(getComputedStyle(scope.querySelector('input[type="range"]')!).accentColor).not.toBe('');
  expect(getComputedStyle(scope.querySelector('progress')!).accentColor).not.toBe('');
  expect(getComputedStyle(ownedButton).minBlockSize).toBe('0px');
  expect(getComputedStyle(nestedOwnedButton).minBlockSize).not.toBe('0px');
});

test('CSS component recipes use native states and logical layout', () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-substrate';

  scope.innerHTML = `
    <button class="rc-button" type="button" aria-pressed="true">Save</button>
    <label class="rc-chip"><input type="checkbox" checked>Filter</label>
    <div class="rc-chip-group"><button class="rc-chip">A</button><button class="rc-chip">B</button></div>
    <select class="rc-select"><option>One</option></select>
    <textarea class="rc-textarea"></textarea>
    <a class="rc-button">Dead link</a>
    <a href="#" class="rc-button">Live link</a>
    <article class="rc-card">Card</article>
    <ul class="rc-list"><li aria-selected="true">Selected</li></ul>
    <details class="rc-disclosure"><summary>More</summary><p>Details</p></details>
  `;

  document.body.append(scope);

  expect(getComputedStyle(scope.querySelector('button.rc-button')!).display).toBe('inline-flex');
  expect(getComputedStyle(scope.querySelector('a.rc-button:not([href])')!).display).toBe('inline');
  expect(getComputedStyle(scope.querySelector('a.rc-button[href]')!).display).toBe('inline-flex');
  expect(getComputedStyle(scope.querySelector('.rc-chip-group')!).flexWrap).toBe('wrap');
  expect(getComputedStyle(scope.querySelector('select.rc-select')!).minBlockSize).not.toBe('0px');

  expect(
    getComputedStyle(scope.querySelector('textarea.rc-textarea')!).paddingInlineStart,
  ).not.toBe('0px');

  expect(getComputedStyle(scope.querySelector('.rc-card')!).display).toBe('grid');
  expect(getComputedStyle(scope.querySelector('.rc-list')!).listStyleType).toBe('none');
  expect(getComputedStyle(scope.querySelector('details')!).paddingInlineStart).not.toBe('0px');

  const chipInput = scope.querySelector('label.rc-chip input') as HTMLInputElement;
  const chipLabel = chipInput.closest('label')!;

  expect(getComputedStyle(chipInput).position).toBe('absolute');
  chipInput.focus();
  expect(getComputedStyle(chipLabel).outlineStyle).not.toBe('none');

  chipInput.disabled = true;
  expect(getComputedStyle(chipLabel).cursor).toBe('not-allowed');

  const css = Object.values(
    import.meta.glob('./css-components/*.css', { query: '?raw', import: 'default', eager: true }),
  ).join('\n');

  expect(css).toContain('@media (forced-colors: active)');
  expect(css).toContain('border-color: Highlight');
});
