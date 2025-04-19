import { test, expect } from 'vitest';

import { isFocusable } from './isFocusable';

// ─── Natively focusable elements ────────────────────────────────────────────

test('isFocusable: button is focusable', () => {
  expect(isFocusable(document.createElement('button'))).toBe(true);
});

test('isFocusable: input is focusable', () => {
  expect(isFocusable(document.createElement('input'))).toBe(true);
});

test('isFocusable: textarea is focusable', () => {
  expect(isFocusable(document.createElement('textarea'))).toBe(true);
});

test('isFocusable: select is focusable', () => {
  expect(isFocusable(document.createElement('select'))).toBe(true);
});

test('isFocusable: anchor with href is focusable', () => {
  const a = document.createElement('a');
  a.href = '#';
  expect(isFocusable(a)).toBe(true);
});

test('isFocusable: area with href is focusable', () => {
  const area = document.createElement('area');
  area.href = '#';
  expect(isFocusable(area)).toBe(true);
});

// ─── tabindex opt-in ─────────────────────────────────────────────────────────

test('isFocusable: div with tabindex="0" is focusable', () => {
  const el = document.createElement('div');
  el.setAttribute('tabindex', '0');
  expect(isFocusable(el)).toBe(true);
});

test('isFocusable: div with tabindex="-1" is focusable (roving-tabindex convention)', () => {
  // Cannot check tabindex >= 0 because rc-common sets -1 on inactive items.
  const el = document.createElement('div');
  el.setAttribute('tabindex', '-1');
  expect(isFocusable(el)).toBe(true);
});

// ─── Non-focusable elements ───────────────────────────────────────────────────

test('isFocusable: plain div is not focusable', () => {
  expect(isFocusable(document.createElement('div'))).toBe(false);
});

test('isFocusable: span is not focusable', () => {
  expect(isFocusable(document.createElement('span'))).toBe(false);
});

test('isFocusable: anchor without href is not focusable', () => {
  expect(isFocusable(document.createElement('a'))).toBe(false);
});

test('isFocusable: area without href is not focusable', () => {
  expect(isFocusable(document.createElement('area'))).toBe(false);
});

// ─── Disabled elements ───────────────────────────────────────────────────────

test('isFocusable: disabled button is not focusable', () => {
  const el = document.createElement('button');
  el.disabled = true;
  expect(isFocusable(el)).toBe(false);
});

test('isFocusable: disabled input is not focusable', () => {
  const el = document.createElement('input');
  el.disabled = true;
  expect(isFocusable(el)).toBe(false);
});

test('isFocusable: element with disabled attribute is not focusable', () => {
  const el = document.createElement('div');
  el.setAttribute('tabindex', '0');
  el.setAttribute('disabled', '');
  expect(isFocusable(el)).toBe(false);
});

// ─── Null / undefined guards ─────────────────────────────────────────────────

test('isFocusable: null returns false', () => {
  expect(isFocusable(null)).toBe(false);
});

test('isFocusable: undefined returns false', () => {
  expect(isFocusable(undefined)).toBe(false);
});
