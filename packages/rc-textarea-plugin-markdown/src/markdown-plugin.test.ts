import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import type { RCTextarea } from '@rcarls/rc-textarea';
import '@rcarls/rc-textarea/define';
import { createMarkdownPlugin } from './markdown-plugin.js';

const SOURCE = [
  '# Cookbook',
  'Introduction',
  '## Ingredients',
  '- Flour',
  '- Water',
  '## Method',
  'Mix everything.',
].join('\n');

test('folds Markdown heading sections by level without changing source', async () => {
  const screen = render(html`
    <rc-textarea data-testid="host">
      <textarea name="markdown" aria-label="Markdown"></textarea>
    </rc-textarea>
  `);
  const host = screen.getByTestId('host').element() as RCTextarea;

  host.value = SOURCE;
  host.plugin = createMarkdownPlugin();

  await vi.waitFor(() =>
    expect(host.shadowRoot?.querySelectorAll('.fold-action-trigger').length).toBeGreaterThan(0),
  );

  const $buttons = [
    ...host.shadowRoot!.querySelectorAll<HTMLButtonElement>('.fold-action-trigger'),
  ];
  const $ingredients = $buttons.find(($button) =>
    $button.getAttribute('aria-label')?.startsWith('Heading level 2 at line 3'),
  )!;

  expect(host.gutter).toBe(true);
  $ingredients.click();

  await vi.waitFor(() =>
    expect(host.shadowRoot!.querySelectorAll('#editor .line[hidden]')).toHaveLength(2),
  );

  const $lines = host.shadowRoot!.querySelectorAll<HTMLElement>('#editor .line');

  expect($lines[5]!.hidden).toBe(false);
  expect(host.value).toBe(SOURCE);
  expect(host.querySelector('textarea')?.value).toBe(SOURCE);

  $ingredients.click();

  await vi.waitFor(() =>
    expect(host.shadowRoot!.querySelector('#editor .line[hidden]')).toBeNull(),
  );
  await expectNoA11yViolations(host);
});

test('offers folds for multiline lists, code, blockquotes, and GFM tables', async () => {
  const source = [
    '- item one',
    '- item two',
    '',
    '```ts',
    'const answer = 42;',
    '```',
    '',
    '> quoted line',
    '> another line',
    '',
    '| A | B |',
    '| - | - |',
    '| 1 | 2 |',
  ].join('\n');
  const screen = render(html`
    <rc-textarea data-testid="host"><textarea aria-label="Markdown"></textarea></rc-textarea>
  `);
  const host = screen.getByTestId('host').element() as RCTextarea;
  const plugin = createMarkdownPlugin();

  host.value = source;
  host.plugin = plugin;

  await vi.waitFor(() =>
    expect(host.shadowRoot?.querySelectorAll('.fold-action-trigger')).toHaveLength(4),
  );

  const labels = [
    ...host.shadowRoot!.querySelectorAll<HTMLButtonElement>('.fold-action-trigger'),
  ].map(($button) => $button.getAttribute('aria-label'));

  expect(labels.some((label) => label?.startsWith('list at line 1'))).toBe(true);
  expect(labels.some((label) => label?.startsWith('code at line 4'))).toBe(true);
  expect(labels.some((label) => label?.startsWith('blockquote at line 8'))).toBe(true);
  expect(labels.some((label) => label?.startsWith('table at line 11'))).toBe(true);
  expect(plugin.getPreviewHtml(source)).toContain('<table>');

  host.removePlugin();

  expect(host.gutter).toBe(false);
});

test('exposes a custom fold icon and styles its public parts from consumer CSS', async () => {
  const $style = document.createElement('style');

  $style.textContent = `
    rc-textarea::part(fold-trigger) { background-color: rgb(10, 20, 30); }
    rc-textarea::part(fold-icon) { color: rgb(40, 50, 60); }
  `;

  document.head.append($style);

  try {
    const screen = render(html`
      <rc-textarea data-testid="host"><textarea aria-label="Markdown"></textarea></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;

    host.value = '# Section\nBody';

    host.plugin = createMarkdownPlugin({
      folding: {
        createTriggerIcon(expanded) {
          const $icon = document.createElement('span');

          $icon.textContent = expanded ? 'expanded' : 'collapsed';

          return $icon;
        },
      },
    });

    await vi.waitFor(() =>
      expect(host.shadowRoot?.querySelector('[part~="fold-trigger"]')).not.toBeNull(),
    );

    const $button = host.shadowRoot!.querySelector<HTMLButtonElement>('[part~="fold-trigger"]')!;
    const $icon = $button.querySelector<HTMLElement>('[part~="fold-icon"]')!;

    expect($icon.getAttribute('aria-hidden')).toBe('true');
    expect($icon.textContent).toBe('expanded');
    expect(getComputedStyle($button).backgroundColor).toBe('rgb(10, 20, 30)');
    expect(getComputedStyle($icon).color).toBe('rgb(40, 50, 60)');
    $button.click();

    await vi.waitFor(() => expect($icon.isConnected).toBe(false));
    expect($button.querySelector('[part~="fold-icon"]')?.textContent).toBe('collapsed');
  } finally {
    $style.remove();
  }
});
