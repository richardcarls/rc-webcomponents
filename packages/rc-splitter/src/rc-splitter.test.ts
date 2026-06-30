import { test, expect, describe, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define';
import type { RCSplitter } from './rc-splitter';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

// Helper to get elements from shadow DOM
function getSeparator(host: RCSplitter): HTMLElement {
  return host.shadowRoot!.querySelector('[role="separator"]') as HTMLElement;
}

function getPrimary(host: RCSplitter): HTMLElement {
  return host.shadowRoot!.querySelector('#primary') as HTMLElement;
}

async function focusSeparator(separator: HTMLElement): Promise<void> {
  separator.focus({ preventScroll: true });
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function pressKey(target: HTMLElement, keyToken: string): Promise<void> {
  const key = keyToken.startsWith('{') && keyToken.endsWith('}')
    ? keyToken.slice(1, -1)
    : keyToken;

  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      composed: true,
      key: key === 'Space' ? ' ' : key,
    }),
  );

  await new Promise((resolve) => setTimeout(resolve, 0));
}

// Waits for the ResizeObserver+RAF cycle to complete and _maxValue to be set.
// Returns the separator element for convenience.
async function waitForInit(host: RCSplitter): Promise<HTMLElement> {
  const separator = getSeparator(host);
  await vi.waitFor(() => {
    expect(Number(separator.getAttribute('aria-valuemax'))).toBeGreaterThan(0);
  });
  return separator;
}

function firePointerEvent(
  target: EventTarget,
  type: string,
  init?: PointerEventInit,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      ...init,
    }),
  );
}

describe('RCSplitter', () => {
  describe('basic rendering and ARIA', () => {
    test('renders with correct ARIA attributes', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));
      host.value = 100;

      const separator = getSeparator(host);

      expect(host).toBeInstanceOf(HTMLElement);
      expect(separator).not.toBeNull();
      expect(separator.getAttribute('tabindex')).toBe('0');
      expect(separator.getAttribute('aria-orientation')).toBe('vertical');
      expect(separator.getAttribute('aria-controls')).toBe('primary');
      expect(separator.getAttribute('aria-labelledby')).toBe('primary');
    });

    test('has no automated accessibility violations', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          label="Resize panels"
          style="width: 400px; height: 300px;"
        >
          <section>Primary</section>
          <section slot="secondary">Secondary</section>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      await expectNoA11yViolations(host);
    });

    test('renders with custom label', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          label="Custom Splitter"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const primary = getPrimary(host);
      expect(primary.getAttribute('aria-label')).toBe('Custom Splitter');
    });

    test('renders with vertical orientation', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      expect(separator.getAttribute('aria-orientation')).toBe('horizontal');
    });

    test('hides separator when no secondary content', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary Only</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const separator = getSeparator(host);
      expect(separator.hasAttribute('hidden')).toBe(true);
    });
  });

  describe('keyboard navigation - horizontal', () => {
    test('Right arrow increases value', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);

      await vi.waitFor(() => {
        expect(Number(separator.getAttribute('aria-valuemax'))).toBeGreaterThan(
          0,
        );
      });

      host.value = 100;

      const initialValue = host.value;

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowRight}');

      expect(host.value).toBeGreaterThan(initialValue);
    });

    test('Left arrow decreases value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      await vi.waitFor(() => {
        expect(Number(separator.getAttribute('aria-valuemax'))).toBeGreaterThan(
          0,
        );
      });

      // Set a value that can be decreased
      host.value = 100;
      const initialValue = host.value;

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowLeft}');

      expect(host.value).toBeLessThan(initialValue);
    });

    test('Home collapses to minimum', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      // Set a value that can be collapsed
      host.value = 100;

      const separator = getSeparator(host);
      await focusSeparator(separator);
      await pressKey(separator, '{Home}');

      expect(host.value).toBe(0);
    });

    test('End expands to maximum', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      await focusSeparator(separator);
      await pressKey(separator, '{End}');

      // Value should be at max (400px container width)
      expect(host.value).toBeGreaterThan(100);
    });

    test('Enter toggles collapse and restore', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      // Set a value that can be collapsed/restored
      host.value = 150;
      const initialValue = host.value;

      await focusSeparator(separator);

      // First Enter collapses
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(0);

      // Second Enter restores
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(initialValue);
    });
  });

  describe('keyboard navigation - vertical', () => {
    test('Down arrow increases value', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer and RAF to initialize _maxValue
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      await vi.waitFor(() => {
        expect(Number(separator.getAttribute('aria-valuemax'))).toBeGreaterThan(0);
      });

      host.value = 100;
      const initialValue = host.value;

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowDown}');

      expect(host.value).toBeGreaterThan(initialValue);
    });

    test('Up arrow decreases value', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      await vi.waitFor(() => {
        expect(Number(separator.getAttribute('aria-valuemax'))).toBeGreaterThan(
          0,
        );
      });

      // Set a value that can be decreased
      host.value = 100;
      const initialValue = host.value;

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowUp}');

      expect(host.value).toBeLessThan(initialValue);
    });

    test('Home and End work in vertical orientation', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      await focusSeparator(separator);

      await pressKey(separator, '{Home}');
      expect(host.value).toBe(0);

      await pressKey(separator, '{End}');
      expect(host.value).toBeGreaterThan(0);
    });
  });

  describe('keyboard navigation - large step (Shift+Arrow)', () => {
    test('Shift+Right arrow moves by 10× step on horizontal splitter', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" .step=${5} style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 100;
      await host.updateComplete;

      await focusSeparator(separator);
      separator.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true }),
      );
      await host.updateComplete;

      expect(host.value).toBe(150); // 100 + 5 * 10
    });

    test('Shift+Left arrow moves by 10× step on horizontal splitter', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" .step=${5} style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 200;
      await host.updateComplete;

      await focusSeparator(separator);
      separator.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, bubbles: true, cancelable: true }),
      );
      await host.updateComplete;

      expect(host.value).toBe(150); // 200 - 5 * 10
    });

    test('Shift+Down arrow moves by 10× step on vertical splitter', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          .step=${5}
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 100;
      await host.updateComplete;

      await focusSeparator(separator);
      separator.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true, cancelable: true }),
      );
      await host.updateComplete;

      expect(host.value).toBe(150); // 100 + 5 * 10
    });

    test('Shift+Arrow clamps to effective max', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" .step=${5} style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      // Set value near the max so 10× step would overshoot
      host.value = host.value; // current (mid-point)
      const max = (host as any)._effectiveMax as number;
      host.value = max - 20;
      await host.updateComplete;

      await focusSeparator(separator);
      separator.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true }),
      );
      await host.updateComplete;

      expect(host.value).toBe(max);
    });
  });

  describe('fixed property', () => {
    test('prevents keyboard resizing when fixed', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          fixed
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      // Set a specific value
      host.value = 100;
      const initialValue = host.value;

      const separator = getSeparator(host);
      await focusSeparator(separator);

      await pressKey(separator, '{ArrowRight}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{Home}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{End}');
      expect(host.value).toBe(initialValue);
    });
  });

  describe('step property', () => {
    test('respects custom step size', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          step="10"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      // Set a specific value
      host.value = 100;
      const initialValue = host.value;

      await focusSeparator(separator);

      await pressKey(separator, '{ArrowRight}');
      expect(host.value).toBe(initialValue + 10);

      await pressKey(separator, '{ArrowLeft}');
      expect(host.value).toBe(initialValue);
    });
  });

  describe('mode property', () => {
    test('valueText shows pixels in length mode', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          mode="length"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      expect(host.valueText).toBe(`${host.value}px`);
    });

    test('valueText shows percentage in percent mode', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          mode="percent"
          value="50"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      expect(host.valueText).toBe(`${host.value}%`);
    });

    test('percent mode has max of 100', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          mode="percent"
          value="50"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      await focusSeparator(separator);
      await pressKey(separator, '{End}');

      expect(host.value).toBe(100);
    });
  });

  describe('events', () => {
    test('dispatches rc-splitter-change on value change', async () => {
      const handleChange = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      host.addEventListener('rc-splitter-change', handleChange);
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));
      host.value = 100;

      const separator = getSeparator(host);

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowRight}');

      expect(handleChange).toHaveBeenCalled();
      const event = (handleChange as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(event.detail).toHaveProperty('value');
      expect(event.detail).toHaveProperty('valueText');
    });

    test('does not dispatch event when value unchanged', async () => {
      const handleChange = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="0"
          style="width: 400px; height: 300px;"
          @rc-splitter-change=${handleChange}
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const separator = getSeparator(host);

      await focusSeparator(separator);

      // Clear any initial change events
      (handleChange as ReturnType<typeof vi.fn>).mockClear();

      // Already at minimum, left arrow should not change value
      await pressKey(separator, '{ArrowLeft}');
      await pressKey(separator, '{Home}');

      // Neither action should have triggered a change
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('ARIA value attributes', () => {
    test('updates aria-valuenow and aria-valuetext on change', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const separator = getSeparator(host);

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowRight}');
      await host.updateComplete;

      expect(separator.getAttribute('aria-valuenow')).toBe(String(host.value));
      expect(separator.getAttribute('aria-valuetext')).toBe(host.valueText);
    });

    test('has aria-valuemin and aria-valuemax', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      expect(separator.getAttribute('aria-valuemin')).toBe('0');
      const maxValue = separator.getAttribute('aria-valuemax');
      expect(Number(maxValue)).toBeGreaterThan(0);
    });
  });

  describe('interaction mode', () => {
    test('sets keyboard interaction mode on keyboard focus', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      await focusSeparator(separator);
      // Dispatch keyboard event directly on the separator
      separator.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );

      expect(separator.getAttribute('data-interaction-mode')).toBe('keyboard');
    });

    test('clears interaction mode on mouse click', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);

      // First trigger keyboard mode
      await focusSeparator(separator);
      separator.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      expect(separator.getAttribute('data-interaction-mode')).toBe('keyboard');

      // Pointer interaction should clear it (keyInteraction listens for pointerdown)
      separator.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true, composed: true }),
      );
      expect(separator.hasAttribute('data-interaction-mode')).toBe(false);
    });
  });

  describe('pointer drag resizing - horizontal', () => {
    test('pointer drag changes value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);
      const initialValue = host.value;

      firePointerEvent(separator, 'pointerdown');

      const hostRect = host.getBoundingClientRect();

      firePointerEvent(separator, 'pointermove', {
        clientX: hostRect.left + 300,
        clientY: hostRect.top + 150,
      });
      firePointerEvent(separator, 'pointerup');

      expect(host.value).not.toBe(initialValue);
    });

    test('pointer drag is prevented when fixed', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          fixed
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 100;
      const initialValue = host.value;

      firePointerEvent(separator, 'pointerdown');

      const hostRect = host.getBoundingClientRect();

      firePointerEvent(separator, 'pointermove', {
        clientX: hostRect.left + 300,
        clientY: hostRect.top + 150,
      });
      firePointerEvent(separator, 'pointerup');

      expect(host.value).toBe(initialValue);
    });
  });

  describe('pointer drag resizing - vertical', () => {
    test('pointer drag changes value vertically', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);
      const initialValue = host.value;

      firePointerEvent(separator, 'pointerdown');

      const hostRect = host.getBoundingClientRect();

      firePointerEvent(separator, 'pointermove', {
        clientX: hostRect.left + 200,
        clientY: hostRect.top + 200,
      });
      firePointerEvent(separator, 'pointerup');

      expect(host.value).not.toBe(initialValue);
    });
  });

  describe('value clamping and boundaries', () => {
    test('clamps value to minimum (0)', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = -100;

      expect(host.value).toBe(0);
    });

    test('clamps value to maximum', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const maxValue = 400; // container width
      host.value = 1000;

      expect(host.value).toBeLessThanOrEqual(maxValue);
    });

    test('arrow key at minimum does not go below zero', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="0"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      await focusSeparator(separator);

      await pressKey(separator, '{ArrowLeft}');

      expect(host.value).toBe(0);
    });

    test('arrow key at maximum does not exceed max', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      // Press End to go to max
      const separator = getSeparator(host);
      await focusSeparator(separator);
      await pressKey(separator, '{End}');
      const maxValue = host.value;

      await pressKey(separator, '{ArrowRight}');

      expect(host.value).toBe(maxValue);
    });
  });

  describe('step rounding', () => {
    test('rounds value to nearest step', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          step="10"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);

      // Set a value that's not a multiple of step
      host.value = 103;

      expect(host.value).toBe(100);
    });

    test('rounds up when closer to next step', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          step="10"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);

      host.value = 107;

      expect(host.value).toBe(110);
    });

    test('large step size limits movement options', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          step="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 100;
      await focusSeparator(separator);

      await pressKey(separator, '{ArrowRight}');

      expect(host.value).toBe(200);
    });
  });

  describe('initial value behavior', () => {
    test('uses initial value attribute when provided', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="150"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);

      expect(host.value).toBe(150);
    });

    test('defaults to half of max when no initial value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);

      // Default should be max/2 = 400/2 = 200
      expect(host.value).toBe(200);
    });

    test('clamps initial value if exceeds max', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="1000"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(host.value).toBeLessThanOrEqual(400);
    });
  });

  describe('pane visibility', () => {
    test('hides primary pane when value is 0', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="0"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const primary = getPrimary(host);
      expect(primary.hasAttribute('hidden')).toBe(true);
    });

    test('hides secondary pane when value is at max', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      await focusSeparator(separator);
      await pressKey(separator, '{End}');
      await host.updateComplete;

      const secondary = host.shadowRoot!.querySelector(
        '#secondary',
      ) as HTMLElement;
      expect(secondary.hasAttribute('hidden')).toBe(true);
    });
  });

  describe('empty and edge case content', () => {
    test('handles empty splitter gracefully', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      // Should not throw and separator should be hidden
      const separator = getSeparator(host);
      expect(separator.hasAttribute('hidden')).toBe(true);
    });

    test('secondary-only content moves to primary', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div slot="secondary" data-testid="content">Only Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const content = screen.getByTestId('content').element();

      // Content should have been moved to primary (slot removed)
      expect(content.getAttribute('slot')).toBeNull();
    });
  });

  describe('keyboard edge cases', () => {
    test('unrelated keys do not affect value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 100;
      const initialValue = host.value;

      await focusSeparator(separator);

      await pressKey(separator, '{Escape}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, 'a');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{Space}');
      expect(host.value).toBe(initialValue);
    });

    test('multiple sequential arrow presses accumulate', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          step="10"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 100;
      await focusSeparator(separator);

      await pressKey(separator, '{ArrowRight}');
      await pressKey(separator, '{ArrowRight}');
      await pressKey(separator, '{ArrowRight}');

      expect(host.value).toBe(130);
    });

    test('wrong orientation arrows are ignored', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 100;
      const initialValue = host.value;

      await focusSeparator(separator);

      // Vertical arrows should be ignored for horizontal splitter
      await pressKey(separator, '{ArrowUp}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{ArrowDown}');
      expect(host.value).toBe(initialValue);
    });

    test('vertical splitter ignores horizontal arrows', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 100;
      const initialValue = host.value;

      await focusSeparator(separator);

      // Horizontal arrows should be ignored for vertical splitter
      await pressKey(separator, '{ArrowLeft}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{ArrowRight}');
      expect(host.value).toBe(initialValue);
    });
  });

  describe('programmatic value changes', () => {
    test('does not dispatch event on programmatic value change', async () => {
      const handleChange = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-splitter
          data-testid="host"
          style="width: 400px; height: 300px;"
          @rc-splitter-change=${handleChange}
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);

      (handleChange as ReturnType<typeof vi.fn>).mockClear();

      host.value = 250;

      expect(handleChange).not.toHaveBeenCalled();
      expect(host.value).toBe(250);
    });

    test('setting same value does not dispatch event', async () => {
      const handleChange = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          style="width: 400px; height: 300px;"
          @rc-splitter-change=${handleChange}
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      (handleChange as ReturnType<typeof vi.fn>).mockClear();

      // Set same value
      host.value = 100;

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('collapse and restore edge cases', () => {
    test('Enter at zero restores to previous value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 180;

      await focusSeparator(separator);

      // Press Home to collapse
      await pressKey(separator, '{Home}');
      expect(host.value).toBe(0);

      // Press Enter should restore
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(180);
    });

    test('collapse remembers last non-zero value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 120;
      await focusSeparator(separator);

      // Move a bit
      await pressKey(separator, '{ArrowRight}');
      const lastValue = host.value;

      // Collapse
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(0);

      // Restore
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(lastValue);
    });
  });

  describe('slots', () => {
    test('renders primary and secondary slot content', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div data-testid="primary-content">Primary Content</div>
          <div slot="secondary" data-testid="secondary-content">
            Secondary Content
          </div>
        </rc-splitter>
      `);

      const primaryContent = screen.getByTestId('primary-content');
      const secondaryContent = screen.getByTestId('secondary-content');

      await expect.element(primaryContent).toBeInTheDocument();
      await expect.element(secondaryContent).toBeInTheDocument();
    });

    test('exposes primary and secondary pane parts', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary Content</div>
          <div slot="secondary">Secondary Content</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      expect(host.shadowRoot!.querySelector('#primary')?.getAttribute('part')).toBe('primary');
      expect(host.shadowRoot!.querySelector('#secondary')?.getAttribute('part')).toBe('secondary');
    });

    test('moves extra primary elements to secondary slot', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
          <div data-testid="third">Third</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      // Wait for slot change to process
      await new Promise((resolve) => setTimeout(resolve, 50));

      const first = screen.getByTestId('first');
      const second = screen.getByTestId('second');
      const third = screen.getByTestId('third');

      // First element stays in primary (no slot attribute)
      expect(first.element().getAttribute('slot')).toBeNull();

      // Additional elements moved to secondary
      expect(second.element().getAttribute('slot')).toBe('secondary');
      expect(third.element().getAttribute('slot')).toBe('secondary');
    });
  });

  describe('collapsible', () => {
    function getCollapseButton(host: RCSplitter): HTMLButtonElement | null {
      return host.shadowRoot!.querySelector('#collapse-button');
    }

    test('collapse button is absent by default', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      expect(getCollapseButton(host)).toBeNull();
    });

    test('collapse button appears when collapsible is set', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" collapsible style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));
      expect(getCollapseButton(host)).not.toBeNull();
    });

    test('collapse button is absent when fixed', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" collapsible fixed style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));
      expect(getCollapseButton(host)).toBeNull();
    });

    test('collapse button has correct aria-label when expanded', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" collapsible label="Editor" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);
      const btn = getCollapseButton(host)!;
      expect(btn.getAttribute('aria-label')).toBe('Collapse Editor');
      expect(btn.getAttribute('aria-expanded')).toBe('true');
    });

    test('clicking collapse button collapses primary pane', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" collapsible style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);

      const btn = getCollapseButton(host)!;
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await host.updateComplete;

      expect(host.value).toBe(0);
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(btn.getAttribute('aria-label')).toBe('Expand Splitter');
    });

    test('clicking collapse button again restores previous value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" collapsible value="200" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);

      const btn = getCollapseButton(host)!;
      // Collapse
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await host.updateComplete;
      expect(host.value).toBe(0);

      // Expand
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await host.updateComplete;
      expect(host.value).toBe(200);
    });

    test('Ctrl+ArrowLeft collapses horizontal splitter', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          collapsible
          value="200"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      separator.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'ArrowLeft',
          ctrlKey: true,
        }),
      );
      await host.updateComplete;

      expect(host.value).toBe(0);
    });

    test('Ctrl+ArrowLeft then Ctrl+ArrowRight expands horizontal splitter', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          collapsible
          value="200"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      separator.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowLeft', ctrlKey: true }),
      );
      await host.updateComplete;
      separator.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight', ctrlKey: true }),
      );
      await host.updateComplete;

      expect(host.value).toBe(200);
    });

    test('Ctrl+ArrowUp collapses vertical splitter', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          collapsible
          orientation="vertical"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      separator.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'ArrowUp',
          ctrlKey: true,
        }),
      );
      await host.updateComplete;

      expect(host.value).toBe(0);
    });

    test('collapse button dispatches rc-splitter-change', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" collapsible style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);

      const events: CustomEvent[] = [];
      host.addEventListener('rc-splitter-change', (e) => events.push(e as CustomEvent));

      const btn = getCollapseButton(host)!;
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await host.updateComplete;

      expect(events).toHaveLength(1);
      expect(events[0].detail.value).toBe(0);
    });
  });

  describe('min and max properties', () => {
    test('min clamps value to lower bound', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          min="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);

      host.value = 50;
      await host.updateComplete;

      expect(host.value).toBe(100);
    });

    test('max clamps value to upper bound', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          max="200"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await waitForInit(host);

      host.value = 350;
      await host.updateComplete;

      expect(host.value).toBe(200);
    });

    test('Home key moves to min when min is set', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          min="80"
          value="200"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);
      await focusSeparator(separator);

      await pressKey(separator, '{Home}');

      expect(host.value).toBe(80);
    });

    test('End key moves to max when max is set', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          max="250"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);
      await focusSeparator(separator);

      await pressKey(separator, '{End}');

      expect(host.value).toBe(250);
    });

    test('aria-valuemin and aria-valuemax reflect min/max props', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          min="50"
          max="300"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      const separator = await waitForInit(host);

      expect(Number(separator.getAttribute('aria-valuemin'))).toBe(50);
      expect(Number(separator.getAttribute('aria-valuemax'))).toBe(300);
    });
  });
});
