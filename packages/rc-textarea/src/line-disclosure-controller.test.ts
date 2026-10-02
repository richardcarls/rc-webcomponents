import { html } from 'lit';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import { LineDisclosureController } from './line-disclosure-controller.js';
import type { RCTextarea } from './rc-textarea.js';
import type { RCTextareaPluginAPI } from './types.js';
import { getEditor, getGutterCells, getSlottedTextarea } from './test-helpers.js';
import { getText } from './document.js';
import { saveSelection } from './selection.js';
import './define.js';

describe('line disclosures', () => {
  test.each([0, 4])('renders a trailing disclosure at line-start offset %i', async (offset) => {
    const screen = render(html`
      <rc-textarea data-testid="host" auto-grow read-only>
        <textarea aria-label="Source"></textarea>
      </rc-textarea>
    `);
    const $host = screen.getByTestId('host').element() as RCTextarea;
    let controller: LineDisclosureController;
    let api: RCTextareaPluginAPI;

    $host.value = 'One\nTwo';

    $host.usePlugin({
      mount(pluginApi) {
        api = pluginApi;
        controller = new LineDisclosureController(api);
      },
      update() {
        api.setDecorations(
          controller.getDecorations([
            {
              key: 'start',
              offset,
              label: 'Line details',
              revision: '1',
              createContent: () => document.createElement('p'),
            },
          ]),
        );
      },
      destroy() {
        controller.clear();
      },
    });

    await $host.updateComplete;

    const $editor = getEditor($host);

    await vi.waitFor(() => {
      expect(
        $editor
          .querySelectorAll('.line')
          [offset === 0 ? 0 : 1]?.querySelector('.line-disclosure-trigger'),
      ).toBeTruthy();
    });

    const $line = $editor.querySelectorAll('.line')[offset === 0 ? 0 : 1]!;
    const $button = $line.querySelector<HTMLButtonElement>('.line-disclosure-trigger')!;
    const $panel = $line.querySelector<HTMLElement>('.line-disclosure-panel')!;

    expect($panel).toBeTruthy();

    $button.click();

    expect($button.getAttribute('aria-expanded')).toBe('true');
    expect($panel.hidden).toBe(false);
    expect(getText($editor)).toBe('One\nTwo');
    await expectNoA11yViolations($host);
  });

  test('opens a gutter disclosure only from its button', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host" gutter auto-grow read-only>
        <textarea aria-label="Source"></textarea>
      </rc-textarea>
    `);
    const $host = screen.getByTestId('host').element() as RCTextarea;
    let controller: LineDisclosureController;
    let api: RCTextareaPluginAPI;

    $host.value = 'First ingredient\nSecond ingredient';

    $host.usePlugin({
      mount(pluginApi) {
        api = pluginApi;
        controller = new LineDisclosureController(api);
      },
      update() {
        api.setDecorations(controller.getDecorations([{
          key: 'first', gutterLine: 1, offset: 16,
          label: 'First ingredient details', revision: '1',
          createContent: () => document.createElement('p'),
        }]));
      },
      destroy() { controller.clear(); },
    });

    await $host.updateComplete;

    const $editor = getEditor($host);

    await vi.waitFor(() => expect($host.shadowRoot!.querySelector('.line-disclosure-trigger')).not.toBeNull());

    const $button = $host.shadowRoot!.querySelector<HTMLButtonElement>('.line-disclosure-trigger')!;
    const $line = $editor.querySelector<HTMLElement>('.line')!;
    const $panel = $line.querySelector<HTMLElement>('.line-disclosure-panel')!;

    expect($button.closest('#gutter')).not.toBeNull();
    expect($button.closest('[aria-hidden="true"]')).toBeNull();
    $line.click();
    expect($button.getAttribute('aria-expanded')).toBe('false');

    $button.click();

    await vi.waitFor(() => expect($button.getAttribute('aria-expanded')).toBe('true'));

    $button.focus();
    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => expect($panel.hidden).toBe(true));
    expect($host.value).toBe('First ingredient\nSecond ingredient');
    await expectNoA11yViolations($host);
  });

  test('keeps a line number beside a folding control and status marker', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host" line-numbers auto-grow read-only>
        <textarea aria-label="Source"></textarea>
      </rc-textarea>
    `);
    const $host = screen.getByTestId('host').element() as RCTextarea;
    let controller: LineDisclosureController;
    let api: RCTextareaPluginAPI;

    $host.value = 'First ingredient\nSecond ingredient';

    $host.usePlugin({
      mount(pluginApi) {
        api = pluginApi;
        controller = new LineDisclosureController(api);
      },
      update() {
        api.setDecorations(controller.getDecorations([{
          key: 'first', gutterLine: 1, offset: 16,
          label: 'First ingredient details', revision: '1',
          createGutterContent: ($button) => {
            const $wrapper = document.createElement('span');
            const $marker = document.createElement('span');

            $marker.textContent = '!';
            $marker.setAttribute('aria-hidden', 'true');
            $wrapper.append($button, $marker);

            return $wrapper;
          },
          createContent: () => document.createElement('p'),
        }]));
      },
      destroy() { controller.clear(); },
    });

    await vi.waitFor(() => expect($host.shadowRoot!.querySelector('.gutter-cell-composite')).not.toBeNull());

    const $cell = getGutterCells($host).children[0]!;
    const $button = $cell.querySelector<HTMLButtonElement>('.line-disclosure-trigger')!;

    expect($cell.querySelector('.gutter-cell-number')?.textContent).toBe('1');
    expect($cell.querySelector('.gutter-cell-content')?.textContent).toContain('!');
    expect(getGutterCells($host).children[1]?.textContent).toBe('2');

    $host.value = 'First ingredient!\nSecond ingredient';

    await vi.waitFor(() => expect($cell.querySelector('.line-disclosure-trigger')).toBe($button));

    $button.click();

    await vi.waitFor(() => expect($button.getAttribute('aria-expanded')).toBe('true'));
    expect($cell.querySelector('.gutter-cell-number')?.textContent).toBe('1');
    expect($host.value).toBe('First ingredient!\nSecond ingredient');
  });

  test.each([false, true])('preserves text, focus and gutter geometry (word wrap: %s)', async (wordWrap) => {
    const screen = render(html`
      <rc-textarea data-testid="host" gutter auto-grow ?word-wrap=${wordWrap}>
        <textarea aria-label="Source"></textarea>
      </rc-textarea>
    `);
    const $host = screen.getByTestId('host').element() as RCTextarea;
    let controller: LineDisclosureController;
    let api: RCTextareaPluginAPI;
    const source = 'First line\nSecond line\nThird line';
    const createContent = vi.fn(() => {
      const $content = document.createElement('button');

      $content.textContent = 'An available action';

      return $content;
    });

    $host.value = source;

    $host.usePlugin({
      mount(pluginApi) {
        api = pluginApi;
        controller = new LineDisclosureController(api);
      },
      update() {
        api.setDecorations(controller.getDecorations([
          { key: 'first', offset: 10, label: 'First line details', revision: '1', createContent },
          { key: 'second', offset: 22, label: 'Second line details', revision: '1', createContent },
        ]));
      },
      destroy() { controller.clear(); },
    });

    await $host.updateComplete;

    const $editor = getEditor($host);

    await vi.waitFor(() => expect($editor.querySelectorAll('.line-disclosure-trigger')).toHaveLength(2));

    const $buttons = [...$editor.querySelectorAll<HTMLButtonElement>('.line-disclosure-trigger')];
    const $panels = [...$editor.querySelectorAll<HTMLElement>('.line-disclosure-panel')];
    const $secondLine = $editor.querySelectorAll<HTMLElement>('.line')[1]!;
    const initialTop = $secondLine.getBoundingClientRect().top;

    expect($panels.every(($panel) => $panel.hidden)).toBe(true);
    expect($buttons[0]!.closest('[aria-hidden="true"]')).toBeNull();
    $buttons[0]!.focus();
    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => {
      expect($buttons[0]!.getAttribute('aria-expanded')).toBe('true');
      expect($secondLine.getBoundingClientRect().top).toBeGreaterThan(initialTop);
      expect($host.shadowRoot!.activeElement).toBe($buttons[0]);
    });

    $buttons[1]!.click();
    api!.scheduleUpdate();

    await vi.waitFor(() => {
      expect($panels.every(($panel) => !$panel.hidden)).toBe(true);
      expect($editor.querySelector('.line-disclosure-trigger')).toBe($buttons[0]);

      const $cells = getGutterCells($host).children;

      expect(Math.abs($cells[1]!.getBoundingClientRect().top - $secondLine.getBoundingClientRect().top)).toBeLessThan(1);
    });

    expect(createContent).toHaveBeenCalledTimes(2);
    expect(getText($editor)).toBe(source);
    expect($host.value).toBe(source);
    expect(getSlottedTextarea($host).value).toBe(source);

    $host.dir = 'rtl';
    await $host.updateComplete;
    $editor.focus();
    await userEvent.keyboard('{Control>}a{/Control}');

    expect(saveSelection($editor)).toEqual({ anchorOffset: 0, focusOffset: source.length });

    const setData = vi.fn();
    const copy = Object.assign(new Event('copy', { bubbles: true, cancelable: true }), {
      clipboardData: { setData },
    });

    $editor.dispatchEvent(copy);
    expect(setData).toHaveBeenCalledWith('text/plain', source);
    await expectNoA11yViolations($host);

    $buttons[0]!.focus();
    await userEvent.keyboard(' ');
    await vi.waitFor(() => expect($panels[0]!.hidden).toBe(true));
    expect($host.value).toBe(source);
    $buttons[0]!.click();

    $buttons[0]!.click();
    expect($panels[0]!.hidden).toBe(true);
    expect($panels[1]!.hidden).toBe(false);

    $editor.focus();
    await userEvent.keyboard('{Control>}a{/Control}');

    $editor.dispatchEvent(Object.assign(new Event('cut', { bubbles: true, cancelable: true }), {
      clipboardData: { setData },
    }));

    await vi.waitFor(() => expect($host.value).toBe(''));
    await userEvent.keyboard('{Control>}z{/Control}');
    await vi.waitFor(() => expect($host.value).toBe(source));
  });
});
