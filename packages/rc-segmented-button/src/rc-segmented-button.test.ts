import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCSegmentedButton } from './rc-segmented-button.js';

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
    <rc-segmented-button data-testid="host" style="--rc-segmented-button-appearance: segmented">
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

  if (!supportsStyleQueries()) {
    // Firefox currently parses CSSContainerRule but does not evaluate style
    // queries. The component deliberately falls back to native radio markup.
    expect(getComputedStyle(host.querySelector('fieldset')!).display).toBe('block');

    return;
  }

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

test('the selected segment is restated in system colors for forced colors', async () => {
  const screen = render(html`
    <rc-segmented-button data-testid="host">
      <fieldset>
        <legend>Text size</legend>
        <label><input type="radio" name="fc" value="small" /> Small</label>
        <label data-testid="selected">
          <input type="radio" name="fc" value="medium" checked />
          Medium
        </label>
      </fieldset>
    </rc-segmented-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSegmentedButton;

  await flushSegmented(host);

  const $style = document.querySelector<HTMLStyleElement>(
    'style[data-rc-light-dom-base="rc-segmented-button"]',
  );

  expect($style).not.toBeNull();

  const forced = [...($style!.sheet?.cssRules ?? [])]
    .filter((rule): rule is CSSLayerBlockRule => rule instanceof CSSLayerBlockRule)
    .flatMap((layer) => [...layer.cssRules])
    .find(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule && rule.conditionText.includes('forced-colors'),
    );

  expect(forced, 'the base styles declare a forced-colors block').toBeDefined();

  // Asserting through the CSSOM rather than the stylesheet text: the rule has to
  // actually select the checked segment, which is what a theme cannot guarantee
  // on its own once the forced palette replaces its selected background.
  const $selected = (await screen.getByTestId('selected').element()) as HTMLElement;
  const rules = [...forced!.cssRules].filter(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule,
  );
  const selectedRule = rules.find(
    (rule) => rule.selectorText.includes(':checked') && $selected.matches(rule.selectorText),
  );
  const baseRule = rules.find((rule) => !rule.selectorText.includes(':checked'));

  expect(selectedRule, 'a forced-colors rule matches the checked segment').toBeDefined();
  expect(baseRule, 'a forced-colors rule covers the resting segment').toBeDefined();

  // The CSSOM lower-cases system color keywords.
  expect(selectedRule!.style.getPropertyValue('background').toLowerCase()).toBe('highlight');
  expect(selectedRule!.style.getPropertyValue('color').toLowerCase()).toBe('highlighttext');
  expect(baseRule!.style.getPropertyValue('background').toLowerCase()).toBe('buttonface');
});

/** True when the engine evaluates `@container style(...)` queries. */
function supportsStyleQueries(): boolean {
  const $probe = document.createElement('style');
  const $container = document.createElement('div');
  const $child = document.createElement('div');

  $container.style.setProperty('--rc-probe', 'yes');
  $child.dataset.rcStyleQueryProbe = '';
  $container.append($child);

  $probe.textContent = `
    @container style(--rc-probe: yes) {
      [data-rc-style-query-probe] { --rc-style-query-supported: yes; }
    }
  `;

  document.head.append($probe);
  document.body.append($container);

  const supported =
    getComputedStyle($child).getPropertyValue('--rc-style-query-supported').trim() === 'yes';

  $probe.remove();

  $container.remove();

  return supported;
}

test('the appearance switch gates the segmented recipe', async () => {
  const screen = render(html`
    <rc-segmented-button data-testid="host">
      <fieldset data-testid="fieldset">
        <legend data-testid="legend">Text size</legend>
        <label>
          <input data-testid="radio" type="radio" name="gate" value="small" checked />
          Small
        </label>
      </fieldset>
    </rc-segmented-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSegmentedButton;

  await flushSegmented(host);

  const $fieldset = (await screen.getByTestId('fieldset').element()) as HTMLElement;
  const $legend = (await screen.getByTestId('legend').element()) as HTMLElement;
  const $radio = (await screen.getByTestId('radio').element()) as HTMLInputElement;

  // Unset, the native appearance is the documented contract.
  expect(getComputedStyle($fieldset).display).toBe('block');
  expect(getComputedStyle($legend).position).toBe('static');
  expect(getComputedStyle($radio).opacity).toBe('1');

  host.style.setProperty('--rc-segmented-button-appearance', 'segmented');

  if (!supportsStyleQueries()) {
    // Documented degradation: without style query support the recipe never
    // applies, which lands on the same native appearance.
    expect(getComputedStyle($fieldset).display).toBe('block');
    expect(getComputedStyle($radio).opacity).toBe('1');

    return;
  }

  expect(getComputedStyle($fieldset).display).toBe('inline-flex');
  expect(getComputedStyle($legend).position).toBe('absolute');

  // The radio stays focusable and in the accessibility tree while invisible,
  // which is why the component owns this rather than each theme.
  expect(getComputedStyle($radio).opacity).toBe('0');
  expect(getComputedStyle($radio).display).not.toBe('none');
  expect(getComputedStyle($radio).visibility).toBe('visible');

  $radio.focus();
  expect(document.activeElement).toBe($radio);
});
