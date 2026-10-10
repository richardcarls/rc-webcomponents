import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import { FLOW_FIXTURES, inFlow } from '../../../test-helpers/flow.js';
import { FoldingActionController } from './folding-action-controller.js';
import { getText } from './document.js';
import { getEditor, getGutterCells, getSlottedTextarea } from './test-helpers.js';
import type { RCTextarea } from './rc-textarea.js';
import type { RCTextareaPluginAPI } from './types.js';
import './define.js';

test('folds source lines without changing the editor value or native form control', async () => {
  const screen = render(html`
    <rc-textarea data-testid="host" gutter line-numbers>
      <textarea name="source" aria-label="Source"></textarea>
    </rc-textarea>
  `);
  const host = screen.getByTestId('host').element() as RCTextarea;
  let folding: FoldingActionController;

  host.value = '## Heading\nHidden one\nHidden two\nVisible';

  host.usePlugin({
    mount(api) { folding = new FoldingActionController(api); },
    update(_value, api) {
      api.setDecorations(folding.getDecorations([{
        key: 'heading', gutterLine: 1, label: 'Heading section',
        target: { fromLine: 2, toLine: 3 },
      }]));
    },
    destroy() { folding.clear(); },
  });

  await vi.waitFor(() => expect(getGutterCells(host).querySelector('button')).not.toBeNull());

  const $button = getGutterCells(host).querySelector<HTMLButtonElement>('button')!;

  expect($button.getAttribute('aria-expanded')).toBe('true');
  $button.click();

  await vi.waitFor(() => expect(getEditor(host).querySelectorAll('.line[hidden]')).toHaveLength(2));

  expect(getGutterCells(host).querySelectorAll('.gutter-cell[hidden]')).toHaveLength(2);
  expect($button.getAttribute('aria-expanded')).toBe('false');
  expect($button.getAttribute('aria-label')).toBe('Heading section');
  expect(getText(getEditor(host))).toBe(host.value);
  expect(getSlottedTextarea(host).value).toBe(host.value);

  $button.focus();
  await userEvent.keyboard('{Enter}');

  await vi.waitFor(() => expect(getEditor(host).querySelector('.line[hidden]')).toBeNull());
  await expectNoA11yViolations(host);
});

test('keeps an app-owned panel, its controls, and fold state in sync', async () => {
  const screen = render(html`
    <rc-textarea data-testid="host" gutter>
      <textarea aria-label="Notes" readonly></textarea>
    </rc-textarea>
  `);
  const host = screen.getByTestId('host').element() as RCTextarea;
  const $panel = document.createElement('div');
  const $inside = document.createElement('button');
  let folding: FoldingActionController;
  let api: RCTextareaPluginAPI;

  $inside.textContent = 'Resolve';
  $panel.append($inside);
  host.value = 'Ingredient';

  host.usePlugin({
    mount(pluginApi) {
      api = pluginApi;
      folding = new FoldingActionController(api);
    },
    update() {
      api.setDecorations([
        ...folding.getDecorations([{
          key: 'details', gutterLine: 1, label: 'Ingredient details',
          target: $panel, initiallyExpanded: false,
        }]),
        { type: 'widget', offset: api.value.length, layout: 'block',
          key: 'details-panel', accessible: true, create: () => $panel },
      ]);
    },
    destroy() { folding.clear(); },
  });

  await vi.waitFor(() => expect(getGutterCells(host).querySelector('button')).not.toBeNull());

  const $button = getGutterCells(host).querySelector<HTMLButtonElement>('button')!;

  expect($panel.hidden).toBe(true);
  expect($button.getAttribute('aria-controls')).toBe($panel.id);
  $button.click();

  await vi.waitFor(() => expect($panel.hidden).toBe(false));
  $inside.focus();
  $button.click();

  expect($panel.hidden).toBe(true);
  expect(host.shadowRoot?.activeElement).toBe($button);
  await expectNoA11yViolations(host);
});

test('reveals a collapsed range before deleting into its hidden source', async () => {
  const screen = render(html`
    <rc-textarea data-testid="host" gutter>
      <textarea aria-label="Source"></textarea>
    </rc-textarea>
  `);
  const host = screen.getByTestId('host').element() as RCTextarea;
  let folding: FoldingActionController;

  host.value = 'Heading\nHidden\nFollowing';

  host.usePlugin({
    mount(api) { folding = new FoldingActionController(api); },
    update(_value, api) {
      api.setDecorations(folding.getDecorations([{
        key: 'heading', gutterLine: 1, label: 'Heading section',
        target: { fromLine: 2, toLine: 2 },
      }]));
    },
    destroy() { folding.clear(); },
  });

  await vi.waitFor(() => expect(getGutterCells(host).querySelector('button')).not.toBeNull());

  getGutterCells(host).querySelector<HTMLButtonElement>('button')!.click();

  await vi.waitFor(() => expect(getEditor(host).querySelector('.line[hidden]')).not.toBeNull());

  const $editor = getEditor(host);
  const $first = $editor.querySelector<HTMLElement>('.line')!;

  $editor.focus();
  window.getSelection()!.collapse($first.firstChild, $first.textContent!.length);
  await userEvent.keyboard('{Delete}');

  await vi.waitFor(() => expect($editor.querySelector('.line[hidden]')).toBeNull());
  expect(host.value).toBe('Heading\nHidden\nFollowing');

  getGutterCells(host).querySelector<HTMLButtonElement>('button')!.click();

  await vi.waitFor(() => expect($editor.querySelector('.line[hidden]')).not.toBeNull());
  $editor.focus();
  window.getSelection()!.collapse($first.firstChild, $first.textContent!.length);
  await userEvent.keyboard('{Enter}');

  await vi.waitFor(() => expect($editor.querySelector('.line[hidden]')).toBeNull());
  expect(host.value).toBe('Heading\nHidden\nFollowing');
});

test('retains a nested fold when its parent closes and opens', async () => {
  const screen = render(html`
    <rc-textarea data-testid="host" gutter>
      <textarea aria-label="Source"></textarea>
    </rc-textarea>
  `);
  const host = screen.getByTestId('host').element() as RCTextarea;
  let folding: FoldingActionController;

  host.value = 'Parent\nChild\nDetail\nAfter';

  host.usePlugin({
    mount(api) { folding = new FoldingActionController(api); },
    update(_value, api) {
      api.setDecorations(folding.getDecorations([
        { key: 'parent', gutterLine: 1, label: 'Parent', target: { fromLine: 2, toLine: 3 } },
        { key: 'child', gutterLine: 2, label: 'Child', target: { fromLine: 3, toLine: 3 } },
      ]));
    },
    destroy() { folding.clear(); },
  });

  await vi.waitFor(() => expect(getGutterCells(host).querySelectorAll('button')).toHaveLength(2));

  const [$parent, $child] = getGutterCells(host).querySelectorAll<HTMLButtonElement>('button');

  $child!.click();
  await vi.waitFor(() => expect(getEditor(host).querySelectorAll('.line[hidden]')).toHaveLength(1));
  $parent!.click();
  await vi.waitFor(() => expect(getEditor(host).querySelectorAll('.line[hidden]')).toHaveLength(2));
  $parent!.click();

  await vi.waitFor(() => expect(getEditor(host).querySelectorAll('.line[hidden]')).toHaveLength(1));
  expect($child!.getAttribute('aria-expanded')).toBe('false');
});

test('gives two actions on one gutter line separate keyboard targets', async () => {
  const screen = render(html`
    <rc-textarea data-testid="host" gutter>
      <textarea aria-label="Source"></textarea>
    </rc-textarea>
  `);
  const host = screen.getByTestId('host').element() as RCTextarea;
  let folding: FoldingActionController;

  host.value = 'Anchor\nOne\nTwo';

  host.usePlugin({
    mount(api) { folding = new FoldingActionController(api); },
    update(_value, api) {
      api.setDecorations(folding.getDecorations([
        { key: 'first', gutterLine: 1, label: 'First fold', target: { fromLine: 2, toLine: 2 } },
        { key: 'second', gutterLine: 1, label: 'Second fold', target: { fromLine: 3, toLine: 3 } },
      ]));
    },
    destroy() { folding.clear(); },
  });

  await vi.waitFor(() => expect(getGutterCells(host).querySelectorAll('button')).toHaveLength(2));

  const $group = getGutterCells(host).querySelector<HTMLElement>('.fold-action-group')!;
  const [$first, $second] = $group.querySelectorAll<HTMLButtonElement>('button');

  expect($first!.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
  expect($second!.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
  $first!.focus();
  await userEvent.keyboard('{Enter}');

  expect($first!.getAttribute('aria-expanded')).toBe('false');
  expect($second!.getAttribute('aria-expanded')).toBe('true');
});

test.each(FLOW_FIXTURES)('keeps gutter folding operable through a live flow change: %o', async (flow) => {
  const screen = render(inFlow(html`
    <rc-textarea data-testid="host" gutter>
      <textarea aria-label="Source"></textarea>
    </rc-textarea>
  `, flow));
  const host = screen.getByTestId('host').element() as RCTextarea;
  let folding: FoldingActionController;

  host.value = 'Heading\nHidden';

  host.usePlugin({
    mount(api) { folding = new FoldingActionController(api); },
    update(_value, api) {
      api.setDecorations(folding.getDecorations([{
        key: 'section', gutterLine: 1, label: 'Section', target: { fromLine: 2, toLine: 2 },
      }]));
    },
    destroy() { folding.clear(); },
  });

  await vi.waitFor(() => expect(getGutterCells(host).querySelector('button')).not.toBeNull());

  const $button = getGutterCells(host).querySelector<HTMLButtonElement>('button')!;
  const $flow = screen.getByTestId('flow').element() as HTMLElement;

  expect(getGutterCells(host).querySelector('.gutter-cell')!.getBoundingClientRect().width)
    .toBeGreaterThanOrEqual(24);

  $flow.dir = flow.dir === 'ltr' ? 'rtl' : 'ltr';
  await new Promise((resolve) => requestAnimationFrame(resolve));
  $button.click();

  await vi.waitFor(() => expect(getEditor(host).querySelectorAll('.line[hidden]')).toHaveLength(1));
  expect(getGutterCells(host).querySelectorAll('.gutter-cell[hidden]')).toHaveLength(1);
  $button.click();

  await vi.waitFor(() => expect(getEditor(host).querySelector('.line[hidden]')).toBeNull());
});
