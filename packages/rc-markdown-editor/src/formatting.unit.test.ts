import { expect, test } from 'vitest';

import { setCodeBlockLanguage } from './formatting.ts';

test('updates the opening fence language when the cursor is inside a code block', () => {
  const value = 'Before\n\n```ts\nconst answer = 42;\n```\n';
  const selectionStart = value.indexOf('answer');

  expect(setCodeBlockLanguage(value, selectionStart, 'js')).toBe(
    'Before\n\n```js\nconst answer = 42;\n```\n',
  );
});

test('does not update a fence when the cursor is outside a code block', () => {
  const value = 'Before\n\n```ts\nconst answer = 42;\n```\n\nAfter';

  expect(setCodeBlockLanguage(value, value.indexOf('After'), 'js')).toBeNull();
});
