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

test('nativeLabelText: excludes a wrapped textarea value without changing the authored DOM', () => {
  document.body.innerHTML = `
    <label>Meeting <strong>notes</strong><span><textarea id="notes" name="notes">Draft content</textarea></span></label>
  `;

  const $label = document.querySelector('label')!;
  const $textarea = document.querySelector('textarea')!;
  const markup = $label.innerHTML;

  expect(nativeLabelText($textarea)).toBe('Meeting notes');
  expect($label.control).toBe($textarea);
  expect($label.innerHTML).toBe(markup);
  expect($textarea.value).toBe('Draft content');
});

test('nativeLabelText: excludes a wrapped select option list', () => {
  document.body.innerHTML = `
    <label>Status <span><select><option>Draft</option><option>Published</option></select></span></label>
  `;

  expect(nativeLabelText(document.querySelector('select'))).toBe('Status');
});
