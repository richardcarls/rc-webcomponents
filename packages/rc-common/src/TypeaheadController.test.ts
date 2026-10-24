import { test, expect, vi } from 'vitest';

import { TypeaheadController } from './TypeaheadController.js';

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

test('matches prefixes regardless of case and accents', () => {
  const controller = new TypeaheadController<string>({
    items: () => ['Banana', 'Éclair', 'Figs'],
    text: (item) => item,
    startIndex: () => 0,
    onMatch: vi.fn(),
  });

  expect(controller.search('e')).toBe('Éclair');
  expect(controller.search('C')).toBe('Éclair');
});

test('matches with the collation of the given locale', () => {
  const items = ['Apple', 'Ångström'];
  const swedish = new TypeaheadController<string>({
    items: () => items,
    text: (item) => item,
    startIndex: () => 0,
    onMatch: vi.fn(),
    locale: () => 'sv',
  });

  // In Swedish, Å is its own letter rather than an accented A.
  expect(swedish.search('a')).toBe('Apple');
  swedish.reset();
  expect(swedish.search('å')).toBe('Ångström');
});

test('matches a decomposed grapheme without slicing its UTF-16 units', () => {
  const controller = new TypeaheadController<string>({
    items: () => ['Other', 'e\u0301clair'],
    text: (item) => item,
    startIndex: () => 0,
    onMatch: vi.fn(),
  });

  expect(controller.search('e')).toBe('e\u0301clair');
});

test('matches prefixes whose collation expands a character', () => {
  const controller = new TypeaheadController<string>({
    items: () => ['Other', 'straße'],
    text: (item) => item,
    startIndex: () => 0,
    onMatch: vi.fn(),
    locale: () => 'de',
  });

  expect(controller.search('strass')).toBe('straße');
});
