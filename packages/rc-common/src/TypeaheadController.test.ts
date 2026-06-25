import { test, expect, vi } from 'vitest';

import { TypeaheadController } from './TypeaheadController';

test('matches the next item by buffered printable keys', () => {
  const onMatch = vi.fn();
  const controller = new TypeaheadController<string>({
    items: () => ['Apple', 'Apricot', 'Banana'],
    text: (item) => item,
    startIndex: () => 0,
    onMatch,
  });

  expect(controller.search('b')).toBe('Banana');
  expect(onMatch).toHaveBeenCalledWith('Banana', 2);
});

test('handleKeydown ignores modifier shortcuts', () => {
  const onMatch = vi.fn();
  const controller = new TypeaheadController<string>({
    items: () => ['Apple'],
    text: (item) => item,
    onMatch,
  });
  const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });

  expect(controller.handleKeydown(event)).toBe(false);
  expect(onMatch).not.toHaveBeenCalled();
});

test('reset clears the current buffer', () => {
  const controller = new TypeaheadController<string>({
    items: () => ['Apple'],
    text: (item) => item,
    onMatch: vi.fn(),
  });

  controller.search('a');
  expect(controller.buffer).toBe('a');

  controller.reset();
  expect(controller.buffer).toBe('');
});
