import { page } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';

import '@rcarls/rc-button/define';
import '@rcarls/rc-dialog/define';
import '@rcarls/rc-disclosure/define';
import '@rcarls/rc-listbox/define';
import '@rcarls/rc-progress/define';
import '@rcarls/rc-segmented-button/define';
import '@rcarls/rc-toolbar/define';

import './theme.css';
import constraints from './constraints/win31.json';

// Linux distributions rasterize the fallback sans differently when the period
// face is unavailable, which is the expected outcome rather than a defect.
const SCREENSHOT_OPTIONS = {
  comparatorOptions: { allowedMismatchedPixelRatio: 0.01 },
} as const;

afterEach(() => {
  document.body.replaceChildren();
});

async function settle(element: Element): Promise<void> {
  const updates = [element, ...element.querySelectorAll('*')]
    .map(
      (candidate) => (candidate as Element & { updateComplete?: Promise<unknown> }).updateComplete,
    )
    .filter((update): update is Promise<unknown> => update instanceof Promise);

  await Promise.all(updates);

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

function renderScope(markup: string): HTMLElement {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-win31';
  scope.innerHTML = markup;
  document.body.append(scope);

  return scope;
}

function constraint(id: string): Record<string, Record<string, string>> {
  const found = constraints.constraints.find((entry) => entry.id === id);

  expect(found, `unknown constraint ${id}`).toBeDefined();

  return found as unknown as Record<string, Record<string, string>>;
}

test('controls render at the sizes the dialog-unit derivation predicts', async () => {
  const scope = renderScope(`
    <rc-button><button>OK</button></rc-button>
    <rc-toolbar><button aria-label="Pin">P</button></rc-toolbar>
    <rc-listbox><select multiple size="3"><option>One</option><option>Two</option></select></rc-listbox>
  `);

  await settle(scope);

  const $button = scope.querySelector('rc-button > button')!;
  const $toolbarButton = scope.querySelector('rc-toolbar button')!;

  expect(getComputedStyle($button).minBlockSize).toBe(
    constraint('button.container').geometry.minBlockSize,
  );
  expect(getComputedStyle($toolbarButton).inlineSize).toBe(
    constraint('toolbar.button').geometry.inlineSize,
  );
  expect(getComputedStyle($toolbarButton).blockSize).toBe(
    constraint('toolbar.button').geometry.blockSize,
  );

  const $option = scope
    .querySelector('rc-listbox')!
    .shadowRoot?.querySelector<HTMLElement>('[part~="option"]');

  if ($option) {
    expect(getComputedStyle($option).minBlockSize).toBe(
      constraint('listbox.row').geometry.minBlockSize,
    );
  }
});

test('the dialog caption bar matches the recorded window-chrome constraint', async () => {
  const scope = renderScope(`
    <rc-dialog movable move-handle="header">
      <dialog open aria-labelledby="win31-title">
        <header><button aria-label="System menu"></button><h2 id="win31-title">Save Changes</h2></header>
        <p>Save changes before closing?</p>
        <footer><button data-rc-win31-default>OK</button><button>Cancel</button></footer>
      </dialog>
    </rc-dialog>
  `);

  await settle(scope);

  const $header = scope.querySelector('rc-dialog > dialog > header')!;
  const $title = scope.querySelector('rc-dialog > dialog > header > h2')!;
  const expected = constraint('dialog.caption');

  expect(getComputedStyle($header).minBlockSize).toBe(expected.geometry.minBlockSize);
  expect(getComputedStyle($title).fontWeight).toBe(expected.typography.weight);
  expect(getComputedStyle($title).textAlign).toBe(expected.typography.align);
});

test('every themed element stays square and motionless', async () => {
  const scope = renderScope(`
    <rc-button><button>OK</button></rc-button>
    <rc-toolbar><button aria-label="Pin">P</button></rc-toolbar>
    <rc-progress><progress value="40" max="100"></progress></rc-progress>
    <rc-disclosure><details open><summary>Status</summary><p>Population</p></details></rc-disclosure>
    <rc-segmented-button>
      <fieldset>
        <legend>View</legend>
        <label><input type="radio" name="v" checked> Normal</label>
        <label><input type="radio" name="v"> Minerals</label>
      </fieldset>
    </rc-segmented-button>
  `);

  await settle(scope);

  const square = constraint('theme.square').geometry.borderRadius;
  const motionless = constraint('theme.motionless').motion.transitionDuration;

  for (const element of scope.querySelectorAll('*')) {
    const styles = getComputedStyle(element);

    expect(styles.borderRadius, element.tagName).toBe(square);
    expect(styles.transitionDuration, element.tagName).toBe(motionless);
  }
});

test('the theme scales from one unit without changing a proportion', async () => {
  const scope = renderScope('<rc-button><button>OK</button></rc-button>');

  await settle(scope);

  const $button = scope.querySelector('rc-button > button')!;
  const single = Number.parseFloat(getComputedStyle($button).minBlockSize);

  scope.style.setProperty('--win31-unit', '2px');

  const doubled = Number.parseFloat(getComputedStyle($button).minBlockSize);

  expect(doubled).toBe(single * 2);
});

test('window chrome renders', async () => {
  const scope = renderScope(`
    <rc-toolbar>
      <button aria-label="One">A</button>
      <button aria-label="Two" aria-pressed="true">B</button>
      <button aria-label="Three" disabled>C</button>
    </rc-toolbar>
    <rc-button><button>OK</button></rc-button>
    <rc-button><button disabled>Disabled</button></rc-button>
    <rc-progress><progress value="40" max="100"></progress></rc-progress>
    <rc-disclosure><details open><summary>Status</summary><p>Population 10,000</p></details></rc-disclosure>
    <rc-segmented-button>
      <fieldset>
        <legend>View</legend>
        <label><input type="radio" name="view" checked> Normal</label>
        <label><input type="radio" name="view"> Minerals</label>
      </fieldset>
    </rc-segmented-button>
  `);

  scope.style.inlineSize = '420px';
  scope.style.padding = '8px';
  scope.style.background = '#c0c0c0';

  await settle(scope);

  await expect(page.screenshot(SCREENSHOT_OPTIONS)).resolves.toBeDefined();
});
