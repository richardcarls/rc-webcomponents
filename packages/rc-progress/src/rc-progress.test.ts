import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCProgress } from './rc-progress.js';

test('rc-progress renders fill part', async () => {
  const screen = render(html`
    <rc-progress data-testid="host">
      <progress value="25" max="100" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  expect(host.shadowRoot?.querySelector('[part="fill"]')).toBeTruthy();
});

test('rc-progress fill transition is themeable rather than hardcoded', async () => {
  const screen = render(html`
    <rc-progress
      data-testid="host"
      style="--rc-progress-fill-transition-duration: 400ms; --rc-progress-fill-transition-easing: linear"
    >
      <progress value="25" max="100" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  const fill = host.shadowRoot?.querySelector<HTMLElement>('[part="fill"]');

  expect(fill).toBeTruthy();

  const styles = getComputedStyle(fill!);

  expect(styles.transitionDuration).toBe('0.4s');
  expect(styles.transitionTimingFunction).toBe('linear');
});

test('rc-progress indeterminate loop paces at a constant rate, not eased', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" indeterminate>
      <progress aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  const fill = host.shadowRoot?.querySelector<HTMLElement>('[part="fill"]');

  expect(fill).toBeTruthy();
  expect(getComputedStyle(fill!).animationTimingFunction).toBe('linear');
});

test('rc-progress default value display renders a percentage', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" display="overlay">
      <progress value="25" max="100" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  await expect.element(screen.getByText('25%')).toBeInTheDocument();
});

test('rc-progress renders value-text override instead of the default percentage', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" display="overlay" value-text="4 of 10 recipes">
      <progress value="4" max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  await expect.element(screen.getByText('4 of 10 recipes')).toBeInTheDocument();
});

test('rc-progress keeps the native progress element in the DOM after upgrade', async () => {
  const screen = render(html`
    <rc-progress data-testid="host">
      <progress value="40" max="100" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  const progress = host.querySelector<HTMLProgressElement>('progress');

  expect(progress).toBeTruthy();
  expect(progress?.isConnected).toBe(true);
});

test('rc-progress leaves the consumer native progress in light DOM', async () => {
  const screen = render(html`
    <rc-progress data-testid="host">
      <progress
        class="consumer-progress"
        part="consumer-part"
        value="40"
        aria-label="Sync"
      ></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  const progress = host.querySelector<HTMLProgressElement>('progress');

  expect(progress?.className).toBe('consumer-progress');
  expect(progress?.getAttribute('part')).toBe('consumer-part');
});

test('rc-progress reflects styling state on the root part', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" disabled value-text="4 of 10">
      <progress value="4" max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  const root = host.shadowRoot?.querySelector('[part="root"]');

  expect(root?.hasAttribute('data-disabled')).toBe(true);
  expect(root?.hasAttribute('data-has-value-text')).toBe(true);
});

test('rc-progress indeterminate removes the native value attribute', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" indeterminate>
      <progress value="4" max="10" aria-label="Preparing"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  const progress = host.querySelector<HTMLProgressElement>('progress');

  expect(progress?.hasAttribute('value')).toBe(false);
});

test('rc-progress restores the native value attribute when indeterminate clears', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" indeterminate>
      <progress value="4" max="10" aria-label="Preparing"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  host.indeterminate = false;
  await host.updateComplete;

  const progress = host.querySelector<HTMLProgressElement>('progress');

  expect(progress?.hasAttribute('value')).toBe(true);
  expect(progress?.value).toBe(4);
});

test('rc-progress fires rc-progress-complete exactly once on reaching max', async () => {
  const completeSpy = vi.fn();
  const screen = render(html`
    <rc-progress data-testid="host" @rc-progress-complete=${completeSpy}>
      <progress value="8" max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  host.value = 10;
  await host.updateComplete;
  host.value = 10;
  await host.updateComplete;

  expect(completeSpy).toHaveBeenCalledOnce();
});

test('rc-progress does not fire rc-progress-complete while indeterminate', async () => {
  const completeSpy = vi.fn();
  const screen = render(html`
    <rc-progress data-testid="host" indeterminate @rc-progress-complete=${completeSpy}>
      <progress value="10" max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  expect(completeSpy).not.toHaveBeenCalled();
});

test('rc-progress re-fires rc-progress-complete after dropping below max and reaching it again', async () => {
  const completeSpy = vi.fn();
  const screen = render(html`
    <rc-progress data-testid="host" @rc-progress-complete=${completeSpy}>
      <progress value="10" max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;
  expect(completeSpy).toHaveBeenCalledOnce();

  host.value = 5;
  await host.updateComplete;
  host.value = 10;
  await host.updateComplete;

  expect(completeSpy).toHaveBeenCalledTimes(2);
});

test('rc-progress exposes aria-valuetext and aria-orientation on the native element', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" value-text="Low" orientation="vertical">
      <progress value="25" max="100" aria-label="Volume"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  const progress = host.querySelector('progress') as HTMLProgressElement;

  expect(progress.getAttribute('aria-valuetext')).toBe('Low');
  expect(progress.getAttribute('aria-orientation')).toBe('vertical');
});

test('rc-progress native for/id label association survives component upgrade', async () => {
  const screen = render(html`
    <div data-testid="wrapper">
      <label for="test-progress">Sync</label>
      <rc-progress data-testid="host">
        <progress id="test-progress" value="4" max="10"></progress>
      </rc-progress>
    </div>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  const progress = host.querySelector<HTMLProgressElement>('progress');

  expect(progress?.isConnected).toBe(true);
  expect(progress?.id).toBe('test-progress');
  expect((host.previousElementSibling as HTMLLabelElement).control).toBe(progress);
});

test('rc-progress defaultValue sets initial value without controlling', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" default-value="3">
      <progress max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  const progress = host.querySelector('progress') as HTMLProgressElement;

  expect(host.value).toBe(3);
  expect(progress.value).toBe(3);
});

test('rc-progress controlled value overrides defaultValue', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" default-value="3">
      <progress max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  host.value = 8;
  await host.updateComplete;

  expect(host.value).toBe(8);
  expect((host.querySelector('progress') as HTMLProgressElement).value).toBe(8);
});

test('rc-progress releases a controlled value back to its default', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" default-value="3">
      <progress max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const $host = screen.getByTestId('host').element() as RCProgress;

  $host.value = 8;
  await $host.updateComplete;

  $host.value = undefined;
  await $host.updateComplete;

  expect($host.value).toBe(3);
  expect($host.querySelector('progress')?.value).toBe(3);
});

test('rc-progress reacts to live native value and max changes when uncontrolled', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" display="overlay">
      <progress value="2" max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const $host = screen.getByTestId('host').element() as RCProgress;
  const $progress = $host.querySelector('progress');

  if (!$progress) {
    throw new Error('Expected the native progress child');
  }

  await $host.updateComplete;

  $progress.value = 6;
  $progress.max = 12;

  await vi.waitFor(() => expect($host.shadowRoot?.textContent).toContain('50%'));
});

test('rc-progress without defaultValue falls back to the native element value', async () => {
  const screen = render(html`
    <rc-progress data-testid="host">
      <progress value="0" max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;

  expect(host.value).toBe(0);
});

test('rc-progress has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-progress data-testid="host">
      <progress value="4" max="10" aria-label="Sync"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;
  await expectNoA11yViolations(host);
});

test('rc-progress has no automated accessibility violations while indeterminate', async () => {
  const screen = render(html`
    <rc-progress data-testid="host" indeterminate>
      <progress aria-label="Preparing"></progress>
    </rc-progress>
  `);
  const host = screen.getByTestId('host').element() as RCProgress;

  await host.updateComplete;
  await expectNoA11yViolations(host);
});
