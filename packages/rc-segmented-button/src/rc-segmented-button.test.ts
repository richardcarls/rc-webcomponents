import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define';
import type { RCSegmentedButton } from './rc-segmented-button';

async function flushSegmented(host: RCSegmentedButton): Promise<void> {
  await host.updateComplete;
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await host.updateComplete;
}

test('preserves a native fieldset and radio inputs', async () => {
  const screen = render(html`
    <rc-segmented-button data-testid="host">
      <fieldset>
        <legend>Text size</legend>
        <label><input type="radio" name="size" value="small" /> Small</label>
        <label><input type="radio" name="size" value="medium" checked /> Medium</label>
      </fieldset>
    </rc-segmented-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSegmentedButton;

  await flushSegmented(host);

  const fieldset = host.querySelector('fieldset')!;
  const checked = host.querySelector<HTMLInputElement>('input:checked')!;

  expect(fieldset.isConnected).toBe(true);
  expect(checked.value).toBe('medium');
  expect(host.value).toBe('medium');
});

test('preserves native fieldset, legend, and radio appearance without theme tokens', async () => {
  const screen = render(html`
    <fieldset data-testid="native-fieldset">
      <legend>Native group</legend>
      <label><input data-testid="native-radio" type="radio" /> Native</label>
    </fieldset>
    <rc-segmented-button data-testid="host">
      <fieldset>
        <legend>Enhanced group</legend>
        <label><input type="radio" name="choice" value="enhanced" /> Enhanced</label>
      </fieldset>
    </rc-segmented-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSegmentedButton;
  const nativeFieldset = await screen.getByTestId('native-fieldset').element();
  const nativeRadio = await screen.getByTestId('native-radio').element();

  await flushSegmented(host);

  const fieldset = host.querySelector('fieldset')!;
  const legend = host.querySelector('legend')!;
  const radio = host.querySelector('input')!;
  const nativeFieldsetStyles = getComputedStyle(nativeFieldset);
  const fieldsetStyles = getComputedStyle(fieldset);
  const nativeRadioStyles = getComputedStyle(nativeRadio);
  const radioStyles = getComputedStyle(radio);

  expect(fieldsetStyles.display).toBe(nativeFieldsetStyles.display);
  expect(fieldsetStyles.borderBlockStartStyle).toBe(nativeFieldsetStyles.borderBlockStartStyle);
  expect(fieldsetStyles.borderBlockStartWidth).toBe(nativeFieldsetStyles.borderBlockStartWidth);
  expect(fieldsetStyles.paddingBlockStart).toBe(nativeFieldsetStyles.paddingBlockStart);
  expect(getComputedStyle(legend).position).toBe('static');
  expect(radioStyles.position).toBe(nativeRadioStyles.position);
  expect(radioStyles.opacity).toBe(nativeRadioStyles.opacity);
  expect(radioStyles.inlineSize).toBe(nativeRadioStyles.inlineSize);
});

test('selected-icon slot reserves constant width, regardless of checked state', async () => {
  const screen = render(html`
    <rc-segmented-button
      data-testid="host"
      style="
        --_rc-segmented-button-segment-display: inline-flex;
        --_rc-segmented-button-radio-position: absolute;
        --_rc-segmented-button-radio-inline-size: 1px;
        --_rc-segmented-button-radio-block-size: 1px;
        --_rc-segmented-button-radio-margin: -1px;
        --_rc-segmented-button-radio-opacity: 0;
      "
    >
      <fieldset>
        <legend>Size</legend>
        <label data-testid="unchecked-label">
          <input type="radio" name="size-icon" value="small" />
          <span data-testid="unchecked-icon" data-rc-segmented-button-selected-icon>✓</span>
          <span>Same label</span>
        </label>
        <label data-testid="checked-label">
          <input type="radio" name="size-icon" value="medium" checked />
          <span data-testid="checked-icon" data-rc-segmented-button-selected-icon>✓</span>
          <span>Same label</span>
        </label>
      </fieldset>
    </rc-segmented-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSegmentedButton;

  await flushSegmented(host);

  const uncheckedLabel = await screen.getByTestId('unchecked-label').element();
  const checkedLabel = await screen.getByTestId('checked-label').element();
  const uncheckedIcon = await screen.getByTestId('unchecked-icon').element();
  const checkedIcon = await screen.getByTestId('checked-icon').element();

  // Same reserved width either way — no display:none on the unchecked slot.
  expect(getComputedStyle(uncheckedIcon).inlineSize).toBe(getComputedStyle(checkedIcon).inlineSize);
  expect(getComputedStyle(uncheckedIcon).visibility).toBe('hidden');
  expect(getComputedStyle(checkedIcon).visibility).toBe('visible');

  // Both labels end up the same width — the whole point of reserving the slot.
  expect(uncheckedLabel.getBoundingClientRect().width).toBeCloseTo(
    checkedLabel.getBoundingClientRect().width,
    0,
  );

  // Trailing mirror spacer exists and matches the icon slot's width.
  const uncheckedAfterWidth = getComputedStyle(uncheckedLabel, '::after').inlineSize;

  expect(uncheckedAfterWidth).toBe(getComputedStyle(uncheckedIcon).inlineSize);
});

test('host value writes are silent and sync the checked radio', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-segmented-button data-testid="host">
      <fieldset>
        <legend>Text size</legend>
        <label><input type="radio" name="size" value="small" /> Small</label>
        <label><input type="radio" name="size" value="medium" /> Medium</label>
      </fieldset>
    </rc-segmented-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSegmentedButton;

  host.addEventListener('rc-segmented-button-change', listener);

  await flushSegmented(host);
  host.value = 'medium';
  await flushSegmented(host);

  expect(host.querySelector<HTMLInputElement>('input[value="medium"]')?.checked).toBe(true);
  expect(listener).not.toHaveBeenCalled();
});

test('user selection dispatches rc-segmented-button-change', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-segmented-button data-testid="host">
      <fieldset>
        <legend>Text size</legend>
        <label><input type="radio" name="size" value="small" checked /> Small</label>
        <label><input data-testid="medium" type="radio" name="size" value="medium" /> Medium</label>
      </fieldset>
    </rc-segmented-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSegmentedButton;
  const medium = await screen.getByTestId('medium').element();
  const mediumLabel = medium.closest('label');

  host.addEventListener('rc-segmented-button-change', listener);

  await flushSegmented(host);
  expect(mediumLabel).not.toBeNull();
  await userEvent.click(mediumLabel as HTMLLabelElement);

  expect(host.value).toBe('medium');
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: 'medium' } }));
});

test('arrow keys move and select radios', async () => {
  const screen = render(html`
    <rc-segmented-button data-testid="host">
      <fieldset>
        <legend>Text size</legend>
        <label
          ><input data-testid="small" type="radio" name="size" value="small" checked /> Small</label
        >
        <label><input data-testid="medium" type="radio" name="size" value="medium" /> Medium</label>
      </fieldset>
    </rc-segmented-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSegmentedButton;
  const small = await screen.getByTestId('small').element();
  const medium = await screen.getByTestId('medium').element();

  await flushSegmented(host);
  small.focus();
  await userEvent.keyboard('{ArrowRight}');

  expect(document.activeElement).toBe(medium);
  expect(host.value).toBe('medium');
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-segmented-button data-testid="host">
      <fieldset>
        <legend>Text size</legend>
        <label><input type="radio" name="size" value="small" /> Small</label>
        <label><input type="radio" name="size" value="medium" checked /> Medium</label>
      </fieldset>
    </rc-segmented-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSegmentedButton;

  await flushSegmented(host);
  await expectNoA11yViolations(host);
});
