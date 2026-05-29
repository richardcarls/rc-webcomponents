import { html } from 'lit';
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define';
import type { RCSearchBar } from './rc-search-bar';

// Native-input discovery defers reads to a microtask after slotchange; a
// macrotask boundary guarantees discovery has completed.
function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

function typeValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function clearButton(host: RCSearchBar): HTMLButtonElement {
  const el = host.shadowRoot?.querySelector<HTMLButtonElement>('#clear');
  if (!el) throw new Error('missing clear button');

  return el;
}

test('progressive enhancement: the native input keeps its author attributes', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="host">
      <input type="search" name="q" id="site-search" placeholder="Author placeholder" />
    </rc-search-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();

  const input = host.querySelector<HTMLInputElement>('input[type="search"]');
  expect(input?.isConnected).toBe(true);
  expect(input?.getAttribute('name')).toBe('q');
  expect(input?.getAttribute('id')).toBe('site-search');
  expect(input?.getAttribute('placeholder')).toBe('Author placeholder');
});

test('label association resolves through the native label registry', async () => {
  const screen = render(html`
    <div data-testid="wrap">
      <label for="labeled-search">Search recipes</label>
      <rc-search-bar>
        <input type="search" id="labeled-search" />
      </rc-search-bar>
    </div>
  `);

  const wrap = (await screen.getByTestId('wrap').element()) as HTMLElement;
  await tick();

  const label = wrap.querySelector<HTMLLabelElement>('label[for="labeled-search"]');
  const input = wrap.querySelector<HTMLInputElement>('#labeled-search');
  expect(label?.control).toBe(input);
});

test('typing dispatches one debounced rc-search-bar-input with the final value', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="host" debounce="50">
      <input type="search" aria-label="Search" />
    </rc-search-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();

  const input = host.querySelector<HTMLInputElement>('input')!;
  const onInput = vi.fn();
  host.addEventListener('rc-search-bar-input', onInput);

  typeValue(input, 't');
  typeValue(input, 'to');
  typeValue(input, 'tom');

  expect(onInput).not.toHaveBeenCalled();

  await vi.waitFor(() => expect(onInput).toHaveBeenCalledTimes(1));
  expect((onInput.mock.calls[0][0] as CustomEvent).detail).toEqual({ value: 'tom' });
});

test('debounce="0" dispatches synchronously per input', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="host" debounce="0">
      <input type="search" aria-label="Search" />
    </rc-search-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();

  const input = host.querySelector<HTMLInputElement>('input')!;
  const onInput = vi.fn();
  host.addEventListener('rc-search-bar-input', onInput);

  typeValue(input, 'a');
  typeValue(input, 'ab');

  expect(onInput).toHaveBeenCalledTimes(2);
  expect((onInput.mock.calls[1][0] as CustomEvent).detail).toEqual({ value: 'ab' });
});

test('clear empties the input, fires both events in order, and restores focus', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="host" debounce="50">
      <input type="search" aria-label="Search" />
    </rc-search-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();

  const input = host.querySelector<HTMLInputElement>('input')!;
  const events: string[] = [];
  host.addEventListener('rc-search-bar-clear', () => events.push('clear'));
  host.addEventListener('rc-search-bar-input', (e) =>
    events.push(`input:${(e as CustomEvent).detail.value}`),
  );

  typeValue(input, 'tomato');
  await host.updateComplete;

  const clear = clearButton(host);
  expect(clear.hidden).toBe(false);

  clear.click();
  await host.updateComplete;

  // The pending debounced 'tomato' dispatch was cancelled by the clear.
  expect(input.value).toBe('');
  expect(events).toEqual(['clear', 'input:']);
  expect(host.value).toBe('');
  expect(clear.hidden).toBe(true);
  await vi.waitFor(() => expect(document.activeElement).toBe(input));

  // No late debounced dispatch arrives afterwards.
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(events).toEqual(['clear', 'input:']);
});

test('controlled value writes are silent; user typing still dispatches', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="host" debounce="0">
      <input type="search" aria-label="Search" />
    </rc-search-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();

  const input = host.querySelector<HTMLInputElement>('input')!;
  const onInput = vi.fn();
  host.addEventListener('rc-search-bar-input', onInput);

  host.value = 'pasta';
  await host.updateComplete;

  expect(input.value).toBe('pasta');
  expect(host.value).toBe('pasta');
  expect(onInput).not.toHaveBeenCalled();
  expect(clearButton(host).hidden).toBe(false);

  typeValue(input, 'pasta sauce');
  expect(onInput).toHaveBeenCalledTimes(1);
});

test('defaultValue applies once and loses to author and host values', async () => {
  // No author value: defaultValue applies.
  const screen = render(html`
    <rc-search-bar data-testid="plain" default-value="hint">
      <input type="search" aria-label="Search" />
    </rc-search-bar>
    <rc-search-bar data-testid="authored" default-value="hint">
      <input type="search" aria-label="Search" value="author" />
    </rc-search-bar>
  `);

  const plain = (await screen.getByTestId('plain').element()) as RCSearchBar;
  const authored = (await screen.getByTestId('authored').element()) as RCSearchBar;
  await tick();

  expect(plain.querySelector('input')!.value).toBe('hint');
  expect(plain.value).toBe('hint');

  // Author value wins over defaultValue.
  expect(authored.querySelector('input')!.value).toBe('author');
  expect(authored.value).toBe('author');

  // A host write wins over later defaultValue updates.
  plain.value = 'host';
  plain.defaultValue = 'other';
  await plain.updateComplete;
  expect(plain.querySelector('input')!.value).toBe('host');
});

test('pre-filled author value shows the clear button', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="host">
      <input type="search" aria-label="Search" value="prefilled" />
    </rc-search-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();
  await host.updateComplete;

  expect(host.value).toBe('prefilled');
  expect(clearButton(host).hidden).toBe(false);
});

test('placeholder property mirrors only when the author set none', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="plain" placeholder="Search 51 recipes">
      <input type="search" aria-label="Search" />
    </rc-search-bar>
    <rc-search-bar data-testid="authored" placeholder="Mirrored">
      <input type="search" aria-label="Search" placeholder="Author" />
    </rc-search-bar>
  `);

  const plain = (await screen.getByTestId('plain').element()) as RCSearchBar;
  const authored = (await screen.getByTestId('authored').element()) as RCSearchBar;
  await tick();

  expect(plain.querySelector('input')!.placeholder).toBe('Search 51 recipes');
  expect(authored.querySelector('input')!.placeholder).toBe('Author');

  // Property updates keep mirroring (still respecting the author attribute).
  plain.placeholder = 'Search 52 recipes';
  await plain.updateComplete;
  expect(plain.querySelector('input')!.placeholder).toBe('Search 52 recipes');

  authored.placeholder = 'Still mirrored?';
  await authored.updateComplete;
  expect(authored.querySelector('input')!.placeholder).toBe('Author');
});

test('the clear button tracks the disabled state of the input', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="host">
      <input type="search" aria-label="Search" value="abc" disabled />
    </rc-search-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();
  await host.updateComplete;

  const input = host.querySelector<HTMLInputElement>('input')!;
  expect(clearButton(host).disabled).toBe(true);

  input.disabled = false;
  await vi.waitFor(() => expect(clearButton(host).disabled).toBe(false));
});

test('no slotted search input degrades silently with no chrome', async () => {
  const screen = render(html`<rc-search-bar data-testid="host"></rc-search-bar>`);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();
  await host.updateComplete;

  expect(host.value).toBe('');
  expect(clearButton(host).hidden).toBe(true);
  expect(getComputedStyle(host.shadowRoot!.querySelector('#leading')!).display).toBe('none');

  await expectNoA11yViolations(host);
});

test('has no automated accessibility violations with a live clear button', async () => {
  const screen = render(html`
    <div data-testid="wrap">
      <search>
        <label for="a11y-search">Search recipes</label>
        <rc-search-bar>
          <span slot="leading" aria-hidden="true">&#128269;</span>
          <input type="search" id="a11y-search" value="tomato" />
        </rc-search-bar>
      </search>
    </div>
  `);

  const wrap = (await screen.getByTestId('wrap').element()) as HTMLElement;
  await tick();

  const host = wrap.querySelector<RCSearchBar>('rc-search-bar')!;
  await host.updateComplete;
  expect(clearButton(host).hidden).toBe(false);

  await expectNoA11yViolations(wrap);
});

test('show-clear-on-focus: clear button shows on focus with no value, hides on blur', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="host" show-clear-on-focus>
      <input type="search" aria-label="Search" />
    </rc-search-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();
  await host.updateComplete;

  const input = host.querySelector<HTMLInputElement>('input')!;
  expect(clearButton(host).hidden).toBe(true);

  input.dispatchEvent(new FocusEvent('focus'));
  await host.updateComplete;
  expect(clearButton(host).hidden).toBe(false);

  input.dispatchEvent(new FocusEvent('blur'));
  await host.updateComplete;
  expect(clearButton(host).hidden).toBe(true);
});

test('show-clear-on-focus: clear while empty dispatches both events and stays focused', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="host" debounce="0" show-clear-on-focus>
      <input type="search" aria-label="Search" />
    </rc-search-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();

  const input = host.querySelector<HTMLInputElement>('input')!;
  const events: string[] = [];
  host.addEventListener('rc-search-bar-clear', () => events.push('clear'));
  host.addEventListener('rc-search-bar-input', (e) =>
    events.push(`input:${(e as CustomEvent).detail.value}`),
  );

  input.dispatchEvent(new FocusEvent('focus'));
  await host.updateComplete;

  const clear = clearButton(host);
  expect(clear.hidden).toBe(false);

  clear.click();
  await host.updateComplete;

  expect(events).toEqual(['clear', 'input:']);
  expect(host.value).toBe('');
  await vi.waitFor(() => expect(document.activeElement).toBe(input));
});

test('allow-native-clear reflects as a boolean attribute', async () => {
  const screen = render(html`
    <rc-search-bar data-testid="host" allow-native-clear>
      <input type="search" aria-label="Search" />
    </rc-search-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCSearchBar;
  await tick();

  expect(host.hasAttribute('allow-native-clear')).toBe(true);
  expect(host.allowNativeClear).toBe(true);

  host.allowNativeClear = false;
  await host.updateComplete;
  expect(host.hasAttribute('allow-native-clear')).toBe(false);
});
