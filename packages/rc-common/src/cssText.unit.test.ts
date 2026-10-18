import { expect, test } from 'vitest';

import { cssText } from './cssText.js';

test('cssText returns the same text as an untagged template', () => {
  const selector = 'rc-example > button';

  expect(cssText`${selector} { color: red; }`).toBe(`${selector} { color: red; }`);
  expect(cssText`a { order: ${1}; } b { order: ${2}; }`).toBe('a { order: 1; } b { order: 2; }');
  expect(cssText`plain`).toBe('plain');
});

test('cssText cooks escapes like an untagged template', () => {
  expect(cssText`a::before { content: '\\25B8'; }`).toBe(`a::before { content: '\\25B8'; }`);
});
