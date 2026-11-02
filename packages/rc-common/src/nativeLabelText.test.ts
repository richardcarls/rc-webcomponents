import { afterEach, expect, test } from 'vitest';

import { nativeLabelText } from './nativeLabelText.js';

afterEach(() => {
  document.body.replaceChildren();
});

test('nativeLabelText: prefers the control aria-label', () => {
  document.body.innerHTML = `
    <label for="notes">Notes</label>
    <textarea id="notes" aria-label="Meeting notes"></textarea>
  `;

  expect(nativeLabelText(document.querySelector('textarea'))).toBe('Meeting notes');
});

test('nativeLabelText: joins the text of every associated label', () => {
  document.body.innerHTML = `
    <label for="notes">Notes</label>
    <label>Draft <textarea id="notes"></textarea></label>
  `;

  expect(nativeLabelText(document.querySelector('textarea'))).toBe('Notes Draft');
});

test('nativeLabelText: returns undefined for an unlabeled control', () => {
  document.body.innerHTML = '<textarea aria-label="  "></textarea>';

  expect(nativeLabelText(document.querySelector('textarea'))).toBeUndefined();
  expect(nativeLabelText(null)).toBeUndefined();
});
