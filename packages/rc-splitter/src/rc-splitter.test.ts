import { test, expect, describe, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define.js';
import type { RCSplitter } from './rc-splitter.js';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';

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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pressKey(target: HTMLElement, keyToken: string): Promise<void> {
  const key = keyToken.startsWith('{') && keyToken.endsWith('}') ? keyToken.slice(1, -1) : keyToken;

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

function firePointerEvent(target: EventTarget, type: string, init?: PointerEventInit): void {
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
      const separator = await waitForInit(host);
      host.value = 100;

      expect(host).toBeInstanceOf(HTMLElement);
      expect(separator).not.toBeNull();
      expect(separator.getAttribute('tabindex')).toBe('0');
      expect(separator.getAttribute('aria-orientation')).toBe('vertical');
      expect(separator.getAttribute('aria-controls')).toBe('primary');
      expect(separator.getAttribute('aria-labelledby')).toBe('primary');
    });

    test('has no automated accessibility violations', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" label="Resize panels" style="width: 400px; height: 300px;">
          <section>Primary</section>
          <section slot="secondary">Secondary</section>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;
      await waitForInit(host);

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
        <rc-splitter data-testid="host" orientation="vertical" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;
      const separator = await waitForInit(host);

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
    test('moves, reaches endpoints, and restores through one keyboard journey', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" value="100" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;
      const separator = await waitForInit(host);

      const initialValue = host.value;

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowRight}');
      expect(host.value).toBeGreaterThan(initialValue);
      await pressKey(separator, '{ArrowLeft}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{Home}');
      expect(host.value).toBe(0);
      await pressKey(separator, '{End}');
      expect(host.value).toBeGreaterThan(100);

      host.value = 150;
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(0);
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(150);
    });
  });

  describe('keyboard navigation - vertical', () => {
    test('moves and reaches endpoints through one vertical journey', async () => {
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

      const initialValue = host.value;

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowDown}');
      expect(host.value).toBeGreaterThan(initialValue);
      await pressKey(separator, '{ArrowUp}');
      expect(host.value).toBe(initialValue);
      await pressKey(separator, '{Home}');
      expect(host.value).toBe(0);
      await pressKey(separator, '{End}');
      expect(host.value).toBeGreaterThan(0);
    });
  });

  describe('keyboard navigation - large step (Shift+Arrow)', () => {
    test('moves by 10× step in both directions and clamps at the endpoint', async () => {
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
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      await host.updateComplete;

      expect(host.value).toBe(150); // 100 + 5 * 10

      host.value = 200;
      await host.updateComplete;

      separator.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowLeft',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      await host.updateComplete;

      expect(host.value).toBe(150); // 200 - 5 * 10

      const max = Number(separator.getAttribute('aria-valuemax'));

      host.value = max - 20;
      await host.updateComplete;

      separator.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      await host.updateComplete;

      expect(host.value).toBe(max);
    });
  });

  describe('fixed property', () => {
    test('prevents keyboard resizing when fixed', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" fixed style="width: 400px; height: 300px;">
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
        <rc-splitter data-testid="host" step="10" style="width: 400px; height: 300px;">
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
    test('exposes length and percent value text and bounds', async () => {
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

      host.mode = 'percent';
      host.value = 50;
      await host.updateComplete;

      expect(host.valueText).toBe(`${host.value}%`);

      const separator = await waitForInit(host);

      expect(separator.getAttribute('aria-valuemax')).toBe('100');
    });
  });

  describe('events', () => {
    test('keeps host writes silent and dispatches detail for user changes', async () => {
      const handleChange = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-splitter data-testid="host" value="100" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;

      host.addEventListener('rc-splitter-change', handleChange);
      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = 120;
      await host.updateComplete;
      expect(handleChange).not.toHaveBeenCalled();

      host.value = 120;
      await host.updateComplete;
      expect(handleChange).not.toHaveBeenCalled();

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
        <rc-splitter data-testid="host" value="100" style="width: 400px; height: 300px;">
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
    test('switches from keyboard to pointer interaction mode', async () => {
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
      separator.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

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

      host.value = 100;
      await host.updateComplete;
      expect(host.value).toBe(100);

      const hostRect = host.getBoundingClientRect();

      firePointerEvent(separator, 'pointerdown', {
        clientX: hostRect.left + 100,
        clientY: hostRect.top + 150,
      });

      firePointerEvent(separator, 'pointermove', {
        clientX: hostRect.left + 300,
        clientY: hostRect.top + 150,
      });

      firePointerEvent(separator, 'pointerup', {
        clientX: hostRect.left + 300,
        clientY: hostRect.top + 150,
      });

      expect(host.value).toBe(300);
    });

    test('pointer drag is prevented when fixed', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" fixed style="width: 400px; height: 300px;">
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
        <rc-splitter data-testid="host" orientation="vertical" style="width: 400px; height: 300px;">
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
    test('clamps host writes to the measured range', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;
      const separator = await waitForInit(host);

      host.value = -100;
      expect(host.value).toBe(0);

      host.value = 1000;
      expect(host.value).toBe(Number(separator.getAttribute('aria-valuemax')));
    });
  });

  describe('step rounding', () => {
    test('rounds in both directions and applies large steps', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" step="10" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;
      const separator = await waitForInit(host);

      // Set a value that's not a multiple of step
      host.value = 103;

      expect(host.value).toBe(100);

      host.value = 107;
      expect(host.value).toBe(110);

      host.step = 100;
      host.value = 100;
      await focusSeparator(separator);
      await pressKey(separator, '{ArrowRight}');
      expect(host.value).toBe(200);
    });
  });

  describe('initial value behavior', () => {
    test('uses initial value attribute when provided', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" value="150" style="width: 400px; height: 300px;">
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
  });

  describe('pane visibility', () => {
    test('hides the pane at each range endpoint', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" value="0" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;
      const separator = await waitForInit(host);

      const primary = getPrimary(host);

      expect(primary.hasAttribute('hidden')).toBe(true);

      await focusSeparator(separator);
      await pressKey(separator, '{End}');
      await host.updateComplete;

      const secondary = host.shadowRoot!.querySelector('#secondary') as HTMLElement;

      expect(secondary.hasAttribute('hidden')).toBe(true);
    });
  });

  describe('empty and edge case content', () => {
    test('handles empty splitter gracefully', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;"> </rc-splitter>
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

      const content = screen.getByTestId('content').element();

      await vi.waitFor(() => expect(content.getAttribute('slot')).toBeNull());
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

    test('ignores arrows outside the active orientation', async () => {
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

      host.orientation = 'vertical';
      host.value = 100;
      await host.updateComplete;

      await pressKey(separator, '{ArrowLeft}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{ArrowRight}');
      expect(host.value).toBe(initialValue);
    });
  });

  describe('slots', () => {
    test('renders slot content and exposes pane parts', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div data-testid="primary-content">Primary Content</div>
          <div slot="secondary" data-testid="secondary-content">Secondary Content</div>
        </rc-splitter>
      `);

      const primaryContent = screen.getByTestId('primary-content');
      const secondaryContent = screen.getByTestId('secondary-content');
      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;

      await expect.element(primaryContent).toBeInTheDocument();
      await expect.element(secondaryContent).toBeInTheDocument();
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

      const first = screen.getByTestId('first');
      const second = screen.getByTestId('second');
      const third = screen.getByTestId('third');

      await vi.waitFor(() => {
        expect(first.element().getAttribute('slot')).toBeNull();
        expect(second.element().getAttribute('slot')).toBe('secondary');
        expect(third.element().getAttribute('slot')).toBe('secondary');
      });
    });
  });

  describe('collapsible', () => {
    function getCollapseButton(host: RCSplitter): HTMLButtonElement | null {
      return host.shadowRoot!.querySelector('#collapse-button');
    }

    test('shows a labelled collapse button only when enabled and resizable', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;
      expect(getCollapseButton(host)).toBeNull();

      host.label = 'Editor';
      host.collapsible = true;
      await host.updateComplete;
      await waitForInit(host);

      const btn = getCollapseButton(host)!;

      expect(btn.getAttribute('aria-label')).toBe('Collapse Editor');
      expect(btn.getAttribute('aria-expanded')).toBe('true');

      host.fixed = true;
      await host.updateComplete;
      expect(getCollapseButton(host)).toBeNull();
    });

    test('collapse button collapses, restores, and dispatches user events', async () => {
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
      await waitForInit(host);

      const events: CustomEvent[] = [];
      const btn = getCollapseButton(host)!;

      host.addEventListener('rc-splitter-change', (event) => events.push(event as CustomEvent));

      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await host.updateComplete;

      expect(host.value).toBe(0);
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(btn.getAttribute('aria-label')).toBe('Expand Splitter');

      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await host.updateComplete;

      expect(host.value).toBe(200);
      expect(events.map((event) => event.detail.value)).toEqual([0, 200]);
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
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'ArrowLeft',
          ctrlKey: true,
        }),
      );

      await host.updateComplete;

      separator.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'ArrowRight',
          ctrlKey: true,
        }),
      );

      await host.updateComplete;

      expect(host.value).toBe(200);
    });
  });

  describe('min and max properties', () => {
    test('clamps writes, drives keyboard endpoints, and reflects ARIA bounds', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          min="50"
          max="300"
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

      expect(Number(separator.getAttribute('aria-valuemin'))).toBe(50);
      expect(Number(separator.getAttribute('aria-valuemax'))).toBe(300);

      host.value = 0;
      await host.updateComplete;
      expect(host.value).toBe(50);

      host.value = 400;
      await host.updateComplete;
      expect(host.value).toBe(300);

      await focusSeparator(separator);
      await pressKey(separator, '{Home}');
      expect(host.value).toBe(50);
      await pressKey(separator, '{End}');
      expect(host.value).toBe(300);
    });
  });

  describe('fixed pane mode', () => {
    test('mode="fixed" reflects, uses pixel bounds, and keeps secondary content visible', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          mode="fixed"
          value="360"
          min="320"
          max="412"
          style="width: 800px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;

      const separator = await waitForInit(host);

      expect(host.getAttribute('mode')).toBe('fixed');
      expect(host.valueText).toBe('360px');
      expect(separator.getAttribute('aria-valuetext')).toBe('360px');

      host.value = 100;
      await host.updateComplete;
      expect(host.value).toBe(320);

      host.value = 600;
      await host.updateComplete;
      expect(host.value).toBe(412);
      expect(host.shadowRoot!.querySelector('#secondary')?.hasAttribute('hidden')).toBe(false);
    });

    test('legacy fixed boolean still disables resizing', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          fixed
          mode="fixed"
          value="360"
          min="320"
          max="412"
          style="width: 800px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;

      const separator = await waitForInit(host);

      await focusSeparator(separator);

      await pressKey(separator, '{ArrowRight}');

      expect(host.value).toBe(360);
    });
  });

  describe('anchored settling', () => {
    test('snapTo() clamps finite indices and ignores non-finite indices', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          snap-points="0 100 240"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;
      await waitForInit(host);

      host.snapTo(8, 'instant');
      await vi.waitFor(() => expect(host.value).toBe(240));

      host.snapTo(Number.NaN, 'instant');
      expect(host.value).toBe(240);
    });

    test('slow release settles at the nearest authored point', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          snap-points="0 100 200 300"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;

      const separator = await waitForInit(host);
      const rect = host.getBoundingClientRect();

      firePointerEvent(separator, 'pointerdown', {
        clientX: rect.left + 100,
        clientY: rect.top + 100,
      });

      firePointerEvent(separator, 'pointermove', {
        clientX: rect.left + 135,
        clientY: rect.top + 100,
      });

      firePointerEvent(separator, 'pointerup', {
        clientX: rect.left + 135,
        clientY: rect.top + 100,
      });

      await vi.waitFor(() => expect(host.value).toBe(100));
    });

    test('decisive swipe selects the next authored point', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          snap-points="0 100 200 300"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);
      const host = screen.getByTestId('host').element() as RCSplitter;

      await host.updateComplete;

      const separator = await waitForInit(host);
      const rect = host.getBoundingClientRect();

      firePointerEvent(separator, 'pointerdown', {
        clientX: rect.left + 100,
        clientY: rect.top + 100,
      });

      await wait(12);

      firePointerEvent(separator, 'pointermove', {
        clientX: rect.left + 140,
        clientY: rect.top + 100,
      });

      firePointerEvent(separator, 'pointerup', {
        clientX: rect.left + 140,
        clientY: rect.top + 100,
      });

      await vi.waitFor(() => expect(host.value).toBe(200));
    });

    test('collapsible splitter swipes to minimum and restores without snap points', async () => {
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
      const rect = host.getBoundingClientRect();

      firePointerEvent(separator, 'pointerdown', {
        clientX: rect.left + 200,
        clientY: rect.top + 100,
      });

      await wait(12);

      firePointerEvent(separator, 'pointermove', {
        clientX: rect.left + 150,
        clientY: rect.top + 100,
      });

      firePointerEvent(separator, 'pointerup', {
        clientX: rect.left + 150,
        clientY: rect.top + 100,
      });

      await vi.waitFor(() => expect(host.value).toBe(0));

      firePointerEvent(separator, 'pointerdown', {
        clientX: rect.left,
        clientY: rect.top + 100,
      });

      await wait(12);

      firePointerEvent(separator, 'pointermove', {
        clientX: rect.left + 50,
        clientY: rect.top + 100,
      });

      firePointerEvent(separator, 'pointerup', {
        clientX: rect.left + 50,
        clientY: rect.top + 100,
      });

      await vi.waitFor(() => expect(host.value).toBe(200));
    });
  });
});

describe('RCSplitter direction and writing mode', () => {
  test('places the primary pane at the inline start and measures drags from it in RTL', async () => {
    const screen = render(html`
      <div dir="rtl">
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      </div>
    `);
    const host = screen.getByTestId('host').element() as RCSplitter;

    await host.updateComplete;

    const separator = await waitForInit(host);

    host.value = 100;
    await host.updateComplete;

    const hostRect = host.getBoundingClientRect();

    // The primary pane starts at the right edge in RTL.
    expect(getPrimary(host).getBoundingClientRect().right).toBeCloseTo(hostRect.right, 0);

    // 300px from the right edge is a primary size of 300, not 100.
    firePointerEvent(separator, 'pointerdown', {
      clientX: hostRect.right - 100,
      clientY: hostRect.top + 150,
    });
    firePointerEvent(separator, 'pointermove', {
      clientX: hostRect.right - 300,
      clientY: hostRect.top + 150,
    });
    firePointerEvent(separator, 'pointerup', {
      clientX: hostRect.right - 300,
      clientY: hostRect.top + 150,
    });

    expect(host.value).toBe(300);
  });

  test('reports the separator orientation it renders in vertical text', async () => {
    const screen = render(html`
      <div style="writing-mode: vertical-rl;">
        <rc-splitter data-testid="host" style="inline-size: 400px; block-size: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      </div>
    `);
    const host = screen.getByTestId('host').element() as RCSplitter;

    await host.updateComplete;

    const separator = await waitForInit(host);

    // Side-by-side panes run along the inline axis, which is vertical here,
    // so the bar between them is horizontal.
    await vi.waitFor(() => expect(separator.getAttribute('aria-orientation')).toBe('horizontal'));
  });
});
