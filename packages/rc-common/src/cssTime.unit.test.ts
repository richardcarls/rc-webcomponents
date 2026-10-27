import { expect, test } from 'vitest';

import { parseCssTime } from './cssTime.js';

test('parseCssTime converts seconds and milliseconds', () => {
  expect(parseCssTime('300ms')).toBe(300);
  expect(parseCssTime('.3s')).toBe(300);
  expect(parseCssTime('0.25s')).toBe(250);
  expect(parseCssTime('2S')).toBe(2000);
  expect(parseCssTime(' 150MS ')).toBe(150);
  expect(parseCssTime('1e2ms')).toBe(100);
});

test('parseCssTime reads a unitless number as milliseconds', () => {
  expect(parseCssTime('0')).toBe(0);
  expect(parseCssTime('200')).toBe(200);
});

test('parseCssTime rejects values a caller should replace with its default', () => {
  expect(parseCssTime('')).toBeUndefined();
  expect(parseCssTime('-100ms')).toBeUndefined();
  expect(parseCssTime('fast')).toBeUndefined();
  expect(parseCssTime('300px')).toBeUndefined();
  expect(parseCssTime('calc(1s / 2)')).toBeUndefined();
  expect(parseCssTime('1e400s')).toBeUndefined();
});
