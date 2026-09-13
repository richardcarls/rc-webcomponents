import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCField } from './rc-field.js';

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

async function fieldFixture(template: ReturnType<typeof html>): Promise<RCField> {
  const screen = render(template);
  const $field = (await screen.getByTestId('field').element()) as RCField;

  await tick();
  await $field.updateComplete;

  return $field;
}

test('keeps the native control connected with author form attributes intact', async () => {
  const $field = await fieldFixture(html`
    <form>
      <rc-field data-testid="field">
        <label slot="label">Recipe name</label>
        <input name="name" value="Pasta" autocomplete="name" required />
      </rc-field>
    </form>
  `);
  const $input = $field.querySelector<HTMLInputElement>('input')!;

  expect($field.control).toBe($input);
  expect($input.isConnected).toBe(true);
  expect($input.name).toBe('name');
  expect($input.value).toBe('Pasta');
  expect($input.getAttribute('autocomplete')).toBe('name');
  expect($input.required).toBe(true);
  expect(new FormData($input.form!).get('name')).toBe('Pasta');
});

test('supports an enhancing control provider without replacing the native control', async () => {
  const $field = await fieldFixture(html`
    <form>
      <rc-field data-testid="field">
        <label slot="label" for="notes">Notes</label>
        <div data-rc-field-control tabindex="0">
          <textarea id="notes" name="notes">Remember the salt.</textarea>
        </div>
      </rc-field>
    </form>
  `);
  const $provider = $field.querySelector<HTMLElement>('[data-rc-field-control]')!;
  const $textarea = $provider.querySelector('textarea')!;

  expect($field.control).toBe($textarea);
  expect(new FormData($textarea.form!).get('notes')).toBe('Remember the salt.');
  expect($field.hasAttribute('data-multiline')).toBe(true);
  expect($field.hasAttribute('data-control-provider')).toBe(true);

  $field.focus();

  expect(document.activeElement).toBe($provider);
  expect($field.hasAttribute('data-focused')).toBe(true);
});

test('wires a sibling slotted native label without replacing author ids', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field">
      <label slot="label">Email</label>
      <input type="email" name="email" />
    </rc-field>
  `);
  const $label = $field.querySelector<HTMLLabelElement>('label')!;
  const $input = $field.querySelector<HTMLInputElement>('input')!;

  expect($input.id).not.toBe('');
  expect($label.htmlFor).toBe($input.id);
  expect($label.control).toBe($input);

  const generatedId = $input.id;

  $field.sync();
  await $field.updateComplete;

  expect($input.id).toBe(generatedId);
  expect($label.htmlFor).toBe(generatedId);
});

test('preserves an explicit label association', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field">
      <label slot="label" for="servings">Servings</label>
      <input id="servings" type="number" />
    </rc-field>
  `);
  const $label = $field.querySelector<HTMLLabelElement>('label')!;
  const $input = $field.querySelector<HTMLInputElement>('input')!;

  expect($label.htmlFor).toBe('servings');
  expect($input.id).toBe('servings');
  expect($label.control).toBe($input);
});

test('supports an ancestor native label', async () => {
  const screen = render(html`
    <label data-testid="label">
      Notes
      <rc-field data-testid="field"><textarea></textarea></rc-field>
    </label>
  `);
  const $label = (await screen.getByTestId('label').element()) as HTMLLabelElement;
  const $field = (await screen.getByTestId('field').element()) as RCField;

  await tick();

  expect($label.control).toBe($field.control);
  expect($field.hasAttribute('data-multiline')).toBe(true);
});

test('merges and restores hint and error descriptions', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field">
      <label slot="label">Title</label>
      <input required aria-describedby="author-note" />
      <small slot="hint">Use a descriptive title.</small>
      <small slot="error">A title is required.</small>
    </rc-field>
  `);
  const $input = $field.querySelector<HTMLInputElement>('input')!;
  const $hint = $field.querySelector<HTMLElement>('[slot="hint"]')!;
  const $error = $field.querySelector<HTMLElement>('[slot="error"]')!;

  expect($input.getAttribute('aria-describedby')?.split(/\s+/)).toEqual(['author-note', $hint.id]);

  expect($input.checkValidity()).toBe(false);
  await $field.updateComplete;

  expect($field.hasAttribute('data-invalid')).toBe(true);
  expect($input.getAttribute('aria-describedby')?.split(/\s+/)).toEqual(['author-note', $error.id]);

  $error.remove();
  await tick();

  expect($input.getAttribute('aria-describedby')).toBe('author-note');
});

test('keeps required fields visually quiet until validation is attempted', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field">
      <label slot="label">Name</label>
      <input required />
      <small slot="error">Enter a name.</small>
    </rc-field>
  `);
  const $input = $field.querySelector<HTMLInputElement>('input')!;

  expect($input.validity.valid).toBe(false);
  expect($field.hasAttribute('data-invalid')).toBe(false);
  expect($field.hasAttribute('data-validation-attempted')).toBe(false);

  $input.dispatchEvent(new Event('invalid'));
  await $field.updateComplete;

  expect($field.hasAttribute('data-invalid')).toBe(true);
  expect($field.hasAttribute('data-validation-attempted')).toBe(true);
  expect($input.getAttribute('aria-invalid')).toBe('true');

  $input.value = 'Soup';
  $input.dispatchEvent(new Event('input', { bubbles: true }));
  await $field.updateComplete;

  expect($field.hasAttribute('data-invalid')).toBe(false);
  expect($input.hasAttribute('aria-invalid')).toBe(false);
});

test('reflects native state and supports explicit invalid state', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field">
      <input aria-label="Quantity" disabled readonly required />
    </rc-field>
  `);

  expect($field.hasAttribute('data-disabled')).toBe(true);
  expect($field.hasAttribute('data-readonly')).toBe(true);
  expect($field.hasAttribute('data-required')).toBe(true);

  $field.invalid = true;
  await $field.updateComplete;

  expect($field.hasAttribute('data-invalid')).toBe(true);
  expect($field.control?.getAttribute('aria-invalid')).toBe('true');

  $field.invalid = false;
  await $field.updateComplete;

  expect($field.control?.hasAttribute('aria-invalid')).toBe(false);
});

test('updates populated and counter state from native input and sync()', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field" counter>
      <label slot="label">Summary</label>
      <input maxlength="10" />
    </rc-field>
  `);
  const $input = $field.querySelector<HTMLInputElement>('input')!;
  const $counter = $field.shadowRoot!.querySelector<HTMLElement>('[part="counter"]')!;

  expect($counter.textContent).toBe('0 / 10');

  $input.value = 'Stock';
  $input.dispatchEvent(new Event('input', { bubbles: true }));
  await $field.updateComplete;

  expect($field.hasAttribute('data-populated')).toBe(true);
  expect($counter.textContent).toBe('5 / 10');

  $input.value = 'Broth';
  $field.sync();
  await $field.updateComplete;

  expect($counter.textContent).toBe('5 / 10');
});

test('discovers a native select as the control and reflects populated state', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field">
      <label slot="label">Unit</label>
      <select>
        <option value="">Choose a unit</option>
        <option value="oz">oz</option>
        <option value="mL">mL</option>
      </select>
    </rc-field>
  `);
  const $select = $field.querySelector<HTMLSelectElement>('select')!;

  expect($field.control).toBe($select);
  expect($field.hasAttribute('data-populated')).toBe(false);
  expect($field.hasAttribute('data-multiline')).toBe(false);

  $select.value = 'oz';
  $select.dispatchEvent(new Event('change', { bubbles: true }));
  await $field.updateComplete;

  expect($field.hasAttribute('data-populated')).toBe(true);
});

test('reflects populated state for a multiple select from selectedOptions, not value', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field">
      <label slot="label">Categories</label>
      <select multiple>
        <option value="">Choose categories</option>
        <option value="braiser">Braiser</option>
        <option value="chicken">Chicken</option>
      </select>
    </rc-field>
  `);
  const $select = $field.querySelector<HTMLSelectElement>('select')!;

  expect($field.hasAttribute('data-populated')).toBe(false);

  // A multiple select's own .value is the first *selected* option's value in
  // tree order, not "the first option overall" — so selecting a blank
  // placeholder alongside a real choice leaves .value === '' (the blank
  // option comes first) even though the field genuinely has a selection.
  // Populated state must come from selectedOptions instead.
  $select.options[0]!.selected = true;
  $select.options[2]!.selected = true;
  $select.dispatchEvent(new Event('change', { bubbles: true }));
  await $field.updateComplete;

  expect($select.value).toBe('');
  expect($field.hasAttribute('data-populated')).toBe(true);
});

test('supports a select-owning control provider', async () => {
  const $field = await fieldFixture(html`
    <form>
      <rc-field data-testid="field">
        <label slot="label" for="unit">Unit</label>
        <div data-rc-field-control tabindex="0">
          <select id="unit" name="unit">
            <option value="">Choose a unit</option>
            <option value="oz">oz</option>
          </select>
        </div>
      </rc-field>
    </form>
  `);
  const $provider = $field.querySelector<HTMLElement>('[data-rc-field-control]')!;
  const $select = $provider.querySelector('select')!;

  expect($field.control).toBe($select);
  expect($field.hasAttribute('data-control-provider')).toBe(true);
  expect($field.hasAttribute('data-multiline')).toBe(false);
  expect(new FormData($select.form!).get('unit')).toBe('');

  $field.focus();

  expect(document.activeElement).toBe($provider);
  expect($field.hasAttribute('data-focused')).toBe(true);
});

test('delegates focus and does not steal trailing action clicks', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field">
      <label slot="label">Password</label>
      <input type="password" />
      <button slot="trailing" type="button">Show</button>
    </rc-field>
  `);
  const $input = $field.querySelector<HTMLInputElement>('input')!;
  const $button = $field.querySelector<HTMLButtonElement>('button')!;
  const clicked = vi.fn();

  $button.addEventListener('click', clicked);
  $field.focus();

  expect(document.activeElement).toBe($input);

  $button.click();

  expect(clicked).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe($input);
});

test('tracks a replaced direct native control', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field">
      <label slot="label">Value</label>
      <input value="one" />
    </rc-field>
  `);
  const $previous = $field.control!;
  const $textarea = document.createElement('textarea');

  $textarea.value = 'two';
  $previous.replaceWith($textarea);
  await tick();

  expect($field.control).toBe($textarea);
  expect($previous.isConnected).toBe(false);
  expect($field.hasAttribute('data-multiline')).toBe(true);
  expect($field.hasAttribute('data-populated')).toBe(true);
});

test('resynchronizes after native form reset', async () => {
  const $field = await fieldFixture(html`
    <form>
      <rc-field data-testid="field" counter>
        <label slot="label">Name</label>
        <input name="name" value="Initial" />
      </rc-field>
    </form>
  `);
  const $input = $field.querySelector<HTMLInputElement>('input')!;

  $input.value = 'Changed';
  $input.dispatchEvent(new Event('input', { bubbles: true }));
  $input.setCustomValidity('Not available');
  $input.dispatchEvent(new Event('invalid'));
  await $field.updateComplete;

  expect($field.hasAttribute('data-validation-attempted')).toBe(true);

  $input.setCustomValidity('');
  $input.form!.reset();
  await tick();

  expect($input.value).toBe('Initial');
  expect($field.shadowRoot?.querySelector('[part="counter"]')?.textContent).toBe('7');
  expect($field.hasAttribute('data-validation-attempted')).toBe(false);
});

test('preserves author-provided aria-invalid state', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field" invalid>
      <input aria-label="Quantity" aria-invalid="grammar" />
    </rc-field>
  `);

  expect($field.control?.getAttribute('aria-invalid')).toBe('grammar');

  $field.invalid = false;
  await $field.updateComplete;

  expect($field.control?.getAttribute('aria-invalid')).toBe('grammar');
});

test('has no automated accessibility violations', async () => {
  const $field = await fieldFixture(html`
    <rc-field data-testid="field" counter>
      <label slot="label">Recipe title</label>
      <input maxlength="80" required />
      <small slot="hint">Use the title shown on the recipe.</small>
    </rc-field>
  `);

  await expectNoA11yViolations($field);
});
