import { test, expect, describe } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import { registerMessages } from '@rcarls/rc-common';
import './define.js';
import type { RcEditorToolbar } from './rc-editor-toolbar.js';
import type { EditorToolbarActionDetail } from './types.js';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';

describe('RcEditorToolbar', () => {
  test('renders 11 default buttons plus heading select', async () => {
    const screen = render(html` <rc-editor-toolbar data-testid="host"></rc-editor-toolbar> `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;

    await host.updateComplete;

    const buttons = host.querySelectorAll('button[data-action]');

    expect(buttons).toHaveLength(11);
    expect(host.querySelectorAll('rc-button')).toHaveLength(11);
    expect(host.querySelector('rc-toolbar')).toBeTruthy();
    expect(host.querySelector('select[aria-label="Heading level"]')).toBeTruthy();
  });

  test('all default buttons have a non-empty aria-label', async () => {
    const screen = render(html` <rc-editor-toolbar data-testid="host"></rc-editor-toolbar> `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;

    await host.updateComplete;

    const buttons = host.querySelectorAll<HTMLButtonElement>('button[data-action]');

    for (const btn of buttons) {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    }
  });

  test('clicking Bold dispatches rc-toolbar-action with action "bold"', async () => {
    const screen = render(html` <rc-editor-toolbar data-testid="host"></rc-editor-toolbar> `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;

    await host.updateComplete;

    const received: EditorToolbarActionDetail[] = [];

    host.addEventListener('rc-toolbar-action', (e) => {
      received.push((e as CustomEvent<EditorToolbarActionDetail>).detail);
    });

    const boldBtn = host.querySelector<HTMLButtonElement>('button[data-action="bold"]');

    expect(boldBtn).toBeTruthy();
    boldBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(received).toHaveLength(1);
    expect(received[0]?.action).toBe('bold');
  });

  test('dispatches correct action for each default button', async () => {
    const screen = render(html` <rc-editor-toolbar data-testid="host"></rc-editor-toolbar> `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;

    await host.updateComplete;

    const actions: string[] = [];

    host.addEventListener('rc-toolbar-action', (e) => {
      actions.push((e as CustomEvent<EditorToolbarActionDetail>).detail.action);
    });

    for (const action of [
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'code',
      'link',
      'blockquote',
      'bullet-list',
      'ordered-list',
      'code-block',
      'source',
    ]) {
      const btn = host.querySelector<HTMLButtonElement>(`button[data-action="${action}"]`);

      expect(btn).toBeTruthy();
      btn?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }

    expect(actions).toEqual([
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'code',
      'link',
      'blockquote',
      'bullet-list',
      'ordered-list',
      'code-block',
      'source',
    ]);
  });

  test('the heading select shows the active level and dispatches a heading change', async () => {
    const screen = render(html` <rc-editor-toolbar data-testid="host"></rc-editor-toolbar> `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;
    const details: EditorToolbarActionDetail[] = [];

    host.addEventListener('rc-toolbar-action', (event) => {
      details.push((event as CustomEvent<EditorToolbarActionDetail>).detail);
    });

    await host.updateComplete;

    const $select = host.querySelector<HTMLSelectElement>('select[aria-label="Heading level"]')!;

    expect($select.value).toBe('p');
    expect($select.classList.contains('toolbar-active')).toBe(false);

    host.activeHeading = 'h2';
    await host.updateComplete;

    expect($select.value).toBe('h2');
    expect($select.classList.contains('toolbar-active')).toBe(true);

    $select.value = 'h3';
    $select.dispatchEvent(new Event('change', { bubbles: true }));
    $select.value = 'p';
    $select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(details).toEqual([
      { action: 'heading', headingLevel: 'h3' },
      { action: 'heading', headingLevel: null },
    ]);
  });

  test('has no automated accessibility violations', async () => {
    const screen = render(html` <rc-editor-toolbar data-testid="host"></rc-editor-toolbar> `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;

    await host.updateComplete;

    await expectNoA11yViolations(host);
  });
});

describe('localization', () => {
  registerMessages('ar', {
    'rc-editor-toolbar': {
      toolbar: 'التنسيق',
      bold: 'غامق',
      heading: (level: number) => `عنوان ${level}`,
    },
  });

  test('renders registered text for its own lang, with overrides on top', async () => {
    const screen = render(html`<rc-editor-toolbar lang="ar" dir="rtl"></rc-editor-toolbar>`);
    const host = (await screen.container.querySelector('rc-editor-toolbar')) as RcEditorToolbar;

    await host.updateComplete;

    expect(host.querySelector('rc-toolbar')?.getAttribute('label')).toBe('التنسيق');
    expect(host.querySelector('[data-action="bold"]')?.getAttribute('aria-label')).toBe('غامق');
    expect(host.querySelector('[data-action="bold"]')?.getAttribute('title')).toBe('غامق (Ctrl+B)');
    expect(host.querySelector('option[value="h2"]')?.textContent?.trim()).toBe('عنوان 2');
    expect(host.querySelector('[data-action="italic"]')?.getAttribute('aria-label')).toBe('Italic');

    host.messages = { bold: 'Fett' };
    await host.updateComplete;

    expect(host.querySelector('[data-action="bold"]')?.getAttribute('aria-label')).toBe('Fett');
  });
});
