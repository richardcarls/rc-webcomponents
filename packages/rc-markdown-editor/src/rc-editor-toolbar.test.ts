import { test, expect, describe } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define.ts';
import type { RcEditorToolbar } from './rc-editor-toolbar.ts';
import type { EditorToolbarActionDetail } from './types.ts';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';


describe('RcEditorToolbar', () => {
  test('renders 10 default buttons', async () => {
    const screen = render(html`
      <rc-editor-toolbar data-testid="host"></rc-editor-toolbar>
    `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;
    await host.updateComplete;

    const buttons = host.querySelectorAll('button[data-action]');
    expect(buttons).toHaveLength(10);
  });

  test('all default buttons have a non-empty aria-label', async () => {
    const screen = render(html`
      <rc-editor-toolbar data-testid="host"></rc-editor-toolbar>
    `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;
    await host.updateComplete;

    const buttons = host.querySelectorAll<HTMLButtonElement>('button[data-action]');
    for (const btn of buttons) {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    }
  });

  test('clicking Bold dispatches rc-toolbar-action with action "bold"', async () => {
    const screen = render(html`
      <rc-editor-toolbar data-testid="host"></rc-editor-toolbar>
    `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;
    await host.updateComplete;

    const received: EditorToolbarActionDetail[] = [];
    host.addEventListener('rc-toolbar-action', (e) => {
      received.push((e as CustomEvent<EditorToolbarActionDetail>).detail);
    });

    const boldBtn = host.querySelector<HTMLButtonElement>('button[data-action="bold"]');
    boldBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(received).toHaveLength(1);
    expect(received[0]!.action).toBe('bold');
  });

  test('dispatches correct action for each default button', async () => {
    const screen = render(html`
      <rc-editor-toolbar data-testid="host"></rc-editor-toolbar>
    `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;
    await host.updateComplete;

    const actions: string[] = [];
    host.addEventListener('rc-toolbar-action', (e) => {
      actions.push((e as CustomEvent<EditorToolbarActionDetail>).detail.action);
    });

    for (const action of ['bold', 'italic', 'code', 'link', 'heading', 'blockquote', 'bullet-list', 'ordered-list', 'code-block', 'source']) {
      const btn = host.querySelector<HTMLButtonElement>(`button[data-action="${action}"]`);
      btn!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }

    expect(actions).toEqual(['bold', 'italic', 'code', 'link', 'heading', 'blockquote', 'bullet-list', 'ordered-list', 'code-block', 'source']);
  });

  test('has no automated accessibility violations', async () => {
    const screen = render(html`
      <rc-editor-toolbar data-testid="host"></rc-editor-toolbar>
    `);
    const host = screen.getByTestId('host').element() as RcEditorToolbar;
    await host.updateComplete;

    await expectNoA11yViolations(host);
  });
});
