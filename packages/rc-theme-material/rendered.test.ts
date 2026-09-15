import { page } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';

import '@rcarls/rc-adaptive-menu/define';
import '@rcarls/rc-button/define';
import '@rcarls/rc-combobox/define';
import '@rcarls/rc-dialog/define';
import '@rcarls/rc-field/define';
import '@rcarls/rc-list/define';
import '@rcarls/rc-menu-button/define';
import '@rcarls/rc-select/define';

import './theme.css';
import { logicalInsets, unexpectedOverflow } from '../../test-helpers/rendered-ui';

// Linux distributions rasterize fallback fonts differently when Roboto is unavailable.
const SCREENSHOT_OPTIONS = {
  comparatorOptions: { allowedMismatchedPixelRatio: 0.01 },
} as const;

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('color-scheme');
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

test('Material fields render filled and outlined native-control compositions', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-field counter>
      <label slot="label">Recipe title</label>
      <input value="Soup" maxlength="80" required>
      <small slot="hint">Use a descriptive title.</small>
    </rc-field>
    <rc-field class="rc-field--outlined">
      <label slot="label">Notes</label>
      <textarea rows="3"></textarea>
    </rc-field>
    <rc-field>
      <label slot="label">Amount per serving</label>
      <input type="number">
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  const [$filled, $outlined, $empty] = scope.querySelectorAll('rc-field');
  const $filledSurface = $filled.shadowRoot?.querySelector<HTMLElement>('[part="field"]');
  const $outlinedSurface = $outlined.shadowRoot?.querySelector<HTMLElement>('[part="field"]');
  const $filledLabel = $filled.shadowRoot?.querySelector<HTMLElement>('[part="label"]');
  const $filledControl = $filled.querySelector('input');
  const $emptyLabel = $empty.shadowRoot?.querySelector<HTMLElement>('[part="label"]');
  const $emptyControl = $empty.querySelector('input');

  expect($filledSurface).not.toBeNull();
  expect($outlinedSurface).not.toBeNull();
  expect($filledLabel).not.toBeNull();
  expect($filledControl).not.toBeNull();
  expect($emptyLabel).not.toBeNull();
  expect($emptyControl).not.toBeNull();
  expect($filledSurface!.getBoundingClientRect().height).toBe(56);
  expect(getComputedStyle($filledSurface!).borderBottomWidth).toBe('1px');
  expect(getComputedStyle($outlinedSurface!).borderTopWidth).toBe('1px');
  expect($outlined.hasAttribute('data-multiline')).toBe(true);
  expect($filled.querySelector('input')?.isConnected).toBe(true);
  expect($filledLabel!.getBoundingClientRect().left).toBe(
    $filledControl!.getBoundingClientRect().left,
  );

  expect($filledLabel!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    $filledControl!.getBoundingClientRect().top,
  );

  const restingTop = $emptyLabel!.getBoundingClientRect().top;

  $emptyControl!.focus();
  await settle($empty);

  expect($empty.hasAttribute('data-focused')).toBe(true);

  await expect.poll(() => $emptyLabel!.getBoundingClientRect().top).toBeLessThan(restingTop);
});

test('rc-select and rc-combobox lose their own chrome when composed as rc-field control providers', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-field>
      <label slot="label">Unit</label>
      <rc-select data-rc-field-control>
        <select>
          <option value="">Choose a unit</option>
          <option value="oz">oz</option>
        </select>
      </rc-select>
    </rc-field>
    <rc-field>
      <label slot="label">Categories</label>
      <rc-combobox data-rc-field-control multiple>
        <select multiple>
          <option value="braiser">Braiser</option>
        </select>
      </rc-combobox>
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  const [$selectField, $comboboxField] = scope.querySelectorAll('rc-field');
  const $select = $selectField.querySelector('rc-select')!;
  const $selectTrigger = $select.shadowRoot!.querySelector<HTMLElement>('[part="trigger"]')!;
  const $combobox = $comboboxField.querySelector('rc-combobox')!;
  const $comboboxAnchor = $combobox.shadowRoot!.querySelector<HTMLElement>('[part="anchor"]')!;

  expect($selectField.control).toBe($select.querySelector('select'));
  expect($selectField.hasAttribute('data-control-provider')).toBe(true);
  expect($comboboxField.control).toBe($combobox.querySelector('select'));
  expect($comboboxField.hasAttribute('data-control-provider')).toBe(true);

  expect(getComputedStyle($selectTrigger).borderWidth).toBe('0px');
  expect(getComputedStyle($selectTrigger).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle($comboboxAnchor).borderWidth).toBe('0px');
  expect(getComputedStyle($comboboxAnchor).backgroundColor).toBe('rgba(0, 0, 0, 0)');

  ($select as unknown as { focus(): void }).focus();
  await settle($selectField);

  expect($selectField.hasAttribute('data-focused')).toBe(true);

  // border-color is moot once border-width is 0 (invisible regardless of color), and
  // :focus-visible is a scripted-focus heuristic that varies by environment; border-width
  // and box-shadow are what actually determine whether chrome is visible here.
  expect(getComputedStyle($selectTrigger).borderWidth).toBe('0px');
  expect(getComputedStyle($selectTrigger).boxShadow).toBe('none');
});

test('dialog-mode combobox fills the current visual viewport', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-field>
      <label slot="label">Categories</label>
      <rc-combobox data-rc-field-control popup-mode="dialog" multiple>
        <select aria-label="Categories" multiple>
          <option value="quick">Quick meal</option>
          <option value="vegetarian">Vegetarian</option>
        </select>
      </rc-combobox>
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  const $combobox = scope.querySelector<HTMLElement & { openPopup(): void }>('rc-combobox')!;

  $combobox.openPopup();
  await settle($combobox);

  const $dialogHost = $combobox.shadowRoot!.querySelector('rc-dialog')!;
  const $dialog = $dialogHost.querySelector<HTMLDialogElement>('[part~="dialog"]')!;
  const $search = $dialog.querySelector<HTMLInputElement>('[part~="dialog-input"]')!;
  const $cancel = $dialog.querySelector<HTMLButtonElement>('[part~="dialog-cancel"]')!;
  const $confirm = $dialog.querySelector<HTMLButtonElement>('[part~="dialog-confirm"]')!;
  const viewport = window.visualViewport;
  const rect = $dialog.getBoundingClientRect();

  expect($dialogHost.getAttribute('variant')).toBe('fullscreen');
  expect($dialog.open).toBe(true);
  expect(getComputedStyle($search).borderWidth).toBe('1px');
  expect($cancel.getAttribute('aria-label')).toBe('Cancel');
  expect($confirm.textContent?.trim()).toBe('Done');
  expect(rect.left).toBeCloseTo(viewport?.offsetLeft ?? 0, 0);
  expect(rect.top).toBeCloseTo(viewport?.offsetTop ?? 0, 0);
  expect(rect.width).toBeCloseTo(viewport?.width ?? window.innerWidth, 0);
  expect(rect.height).toBeCloseTo(viewport?.height ?? window.innerHeight, 0);

  $dialog.close();
});

test('standalone fullscreen dialog uses the Material visual viewport surface', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-dialog variant="fullscreen">
      <dialog aria-label="Fullscreen example"><button>Close</button></dialog>
    </rc-dialog>
  `;

  document.body.append(scope);
  await settle(scope);

  const $host = scope.querySelector<HTMLElement & { showModal(): void }>('rc-dialog')!;

  $host.showModal();
  await settle($host);

  const $dialog = $host.querySelector('dialog')!;
  const viewport = window.visualViewport;
  const rect = $dialog.getBoundingClientRect();

  expect(rect.left).toBeCloseTo(viewport?.offsetLeft ?? 0, 0);
  expect(rect.top).toBeCloseTo(viewport?.offsetTop ?? 0, 0);
  expect(rect.width).toBeCloseTo(viewport?.width ?? window.innerWidth, 0);
  expect(rect.height).toBeCloseTo(viewport?.height ?? window.innerHeight, 0);
  expect(getComputedStyle($dialog).borderRadius).toBe('0px');

  $dialog.close();
});

test('Material fields preserve label separation with increased text metrics', async () => {
  const $scope = document.createElement('div');

  $scope.className = 'rc-theme-material';
  $scope.style.setProperty('--md-sys-typescale-body-small-size', '24px');
  $scope.style.setProperty('--md-sys-typescale-body-small-line-height', '32px');
  $scope.style.setProperty('--md-sys-typescale-body-large-size', '32px');
  $scope.style.setProperty('--md-sys-typescale-body-large-line-height', '48px');

  $scope.innerHTML = `
    <rc-field>
      <label slot="label">Recipe title</label>
      <input value="Soup">
    </rc-field>
    <rc-field>
      <label slot="label">Amount per serving</label>
      <input type="number">
    </rc-field>
  `;

  document.body.append($scope);
  await settle($scope);

  const [$populated, $empty] = $scope.querySelectorAll('rc-field');
  const $populatedSurface = $populated.shadowRoot!.querySelector<HTMLElement>('[part="field"]')!;
  const $populatedLabel = $populated.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
  const $populatedControl = $populated.querySelector('input')!;
  const $emptySurface = $empty.shadowRoot!.querySelector<HTMLElement>('[part="field"]')!;
  const $emptyLabel = $empty.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
  const $emptyControl = $empty.querySelector('input')!;
  const emptySurfaceBox = $emptySurface.getBoundingClientRect();
  const restingLabelBox = $emptyLabel.getBoundingClientRect();

  expect($populatedSurface.getBoundingClientRect().height).toBeGreaterThanOrEqual(80);

  expect($populatedLabel.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    $populatedControl.getBoundingClientRect().top,
  );

  expect(
    Math.abs(
      restingLabelBox.top +
        restingLabelBox.height / 2 -
        (emptySurfaceBox.top + emptySurfaceBox.height / 2),
    ),
  ).toBeLessThanOrEqual(0.5);

  $emptyControl.focus();
  await settle($empty);

  await expect
    .poll(() => $emptyLabel.getBoundingClientRect().bottom)
    .toBeLessThanOrEqual($emptyControl.getBoundingClientRect().top);
});

test('segmented Material list rows render with 16px inline content padding', async () => {
  const scope = document.createElement('div');
  const list = document.createElement('rc-list');
  const iconList = document.createElement('rc-list');
  const item = document.createElement('rc-list-item');
  const iconItem = document.createElement('rc-list-item');
  const leading = document.createElement('span');

  scope.className = 'rc-theme-material';
  list.setAttribute('variant', 'segmented');
  iconList.setAttribute('variant', 'segmented');
  item.textContent = 'Padded setting';
  leading.slot = 'leading';
  leading.dataset.rcListLeading = '';
  leading.textContent = '★';
  iconItem.textContent = 'Icon setting';
  iconItem.prepend(leading);
  list.append(item);
  iconList.append(iconItem);
  scope.append(list, iconList);
  document.body.append(scope);
  await settle(scope);

  const content = item.shadowRoot?.querySelector<HTMLElement>('[part="content"]');

  expect(content).not.toBeNull();

  const insets = logicalInsets(item, content!);

  expect(insets.inlineStart).toBe(16);
  expect(insets.inlineEnd).toBe(16);
  expect(leading.getBoundingClientRect().width).toBe(24);
  expect(leading.getBoundingClientRect().height).toBe(24);
  expect(getComputedStyle(leading).fontSize).toBe('24px');
});

test('adaptive menu actions fit their container without unexpected overflow', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <div style="inline-size: 184px">
      <rc-adaptive-menu max-shown="3" data-testid="adaptive-menu">
        <rc-button icon-only class="rc-icon-button--standard" data-priority="30">
          <button type="button" aria-label="Favorite">
            <span data-rc-menu-leading aria-hidden="true">★</span>
            <span data-rc-menu-label>Favorite</span>
          </button>
        </rc-button>
        <rc-button icon-only class="rc-icon-button--standard" data-priority="20">
          <button type="button" aria-label="Edit">
            <span data-rc-menu-leading aria-hidden="true">✎</span>
            <span data-rc-menu-label>Edit</span>
          </button>
        </rc-button>
        <rc-button icon-only class="rc-icon-button--standard" data-priority="10">
          <button type="button" aria-label="Share">
            <span data-rc-menu-leading aria-hidden="true">↗</span>
            <span data-rc-menu-label>Share</span>
          </button>
        </rc-button>
      </rc-adaptive-menu>
    </div>
  `;

  document.body.append(scope);
  await settle(scope);

  const menu = scope.querySelector('rc-adaptive-menu');

  expect(menu).not.toBeNull();

  expect(
    unexpectedOverflow(menu!, {
      // Each icon-only rc-button's touch-target hit-slop is an invisible,
      // absolutely-positioned pseudo-element that intentionally extends past
      // its own visible box up to the accessible 48dp tap target (see
      // rc-button's own touch-target docs) — real DOM geometry with no
      // visible paint. That geometry is what rc-adaptive-menu's own
      // scrollWidth picks up for its edge-most promoted buttons, the same
      // way it already does for the buttons themselves, so the host needs
      // the same exemption.
      ignore: (element) =>
        element.matches(
          'rc-adaptive-menu, rc-button[icon-only], rc-button[icon-only] *, [data-rc-menu-label]',
        ),
    }),
  ).toEqual([]);

  expect(menu!.querySelectorAll('[data-rc-action-promoted]')).toHaveLength(3);
});

test('adaptive overflow labels use Material menu-item typography', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-adaptive-menu>
      <rc-button icon-only class="rc-icon-button--standard" slot="overflow">
        <button type="button" aria-label="Settings">
          <span data-rc-menu-leading aria-hidden="true">⚙</span>
          <span data-rc-menu-label>Settings</span>
        </button>
      </rc-button>
      <rc-menu-button icon-only slot="overflow">
        <button type="button" slot="trigger" aria-label="View">
          <span data-rc-menu-leading aria-hidden="true">☷</span>
          <span data-rc-menu-label>View</span>
        </button>
        <span slot="indicator" aria-hidden="true">›</span>
        <rc-menu label="View">
          <button type="button" role="menuitem">Cards</button>
        </rc-menu>
      </rc-menu-button>
    </rc-adaptive-menu>
  `;

  document.body.append(scope);
  await settle(scope);

  const menu = scope.querySelector('rc-adaptive-menu');

  expect(menu).not.toBeNull();
  menu!.openMenu();
  await settle(scope);

  const labels = scope.querySelectorAll<HTMLElement>('[data-rc-menu-label]');
  const icons = scope.querySelectorAll<HTMLElement>('[data-rc-menu-leading]');
  const overflowTrigger = menu!.shadowRoot?.querySelector<HTMLElement>('#overflow-trigger');
  const overflowTarget = menu!.shadowRoot?.querySelector<HTMLElement>('#overflow-trigger-target');

  expect(labels).toHaveLength(2);
  expect(icons).toHaveLength(2);
  expect(Math.round(overflowTrigger!.getBoundingClientRect().width)).toBe(32);
  expect(Math.round(overflowTrigger!.getBoundingClientRect().height)).toBe(40);
  expect(Math.round(overflowTarget!.getBoundingClientRect().width)).toBe(48);
  expect(Math.round(overflowTarget!.getBoundingClientRect().height)).toBe(48);

  for (const label of labels) {
    const style = getComputedStyle(label);

    expect(style.fontSize).toBe('16px');
    expect(style.fontWeight).toBe('400');
    expect(style.lineHeight).toBe('24px');
    expect(style.letterSpacing).toBe('0.5px');
  }

  for (const icon of icons) {
    const style = getComputedStyle(icon);

    expect(style.fontSize).toBe('24px');
    expect(style.lineHeight).toBe('24px');
  }

  const submenu = scope.querySelector('rc-menu-button');
  const submenuTrigger = submenu?.querySelector<HTMLButtonElement>('[slot="trigger"]');

  expect(submenu).not.toBeNull();
  expect(submenu).toHaveAttribute('orientation', 'vertical');

  const indicator = submenu!.shadowRoot?.querySelector<HTMLElement>('slot[name="indicator"]');
  const triggerWrap = submenu!.shadowRoot?.querySelector<HTMLElement>('#trigger-wrap');
  const submenuRect = submenu!.getBoundingClientRect();
  const indicatorRect = indicator!.getBoundingClientRect();
  const triggerWrapRect = triggerWrap!.getBoundingClientRect();

  expect(Math.round(triggerWrapRect.right - indicatorRect.right)).toBe(12);
  expect(submenuRect.width - triggerWrapRect.width).toBeLessThanOrEqual(20);

  submenuTrigger!.click();
  await settle(scope);

  expect(submenu!.open).toBe(true);
  expect(menu!.shadowRoot?.querySelector('#popup')?.matches(':popover-open')).toBe(true);
});

const isChromium = navigator.userAgent.includes('Chrome');

test.runIf(isChromium).each(['light', 'dark'] as const)(
  'Material adaptive overflow visual baseline in %s mode',
  async (mode) => {
    document.documentElement.style.colorScheme = mode;

    const scope = document.createElement('section');

    scope.className = 'rc-theme-material';
    scope.dataset.testid = 'adaptive-menu-contract';

    scope.style.cssText = [
      'box-sizing:border-box',
      'display:grid',
      'justify-items:end',
      'align-items:start',
      'inline-size:300px',
      'block-size:220px',
      'padding:16px',
      'background:var(--md-sys-color-surface)',
      'color:var(--md-sys-color-on-surface)',
    ].join(';');

    scope.style.colorScheme = mode;

    scope.innerHTML = `
      <rc-adaptive-menu>
        <rc-button icon-only class="rc-icon-button--standard" slot="overflow">
          <button type="button" aria-label="Settings">
            <span data-rc-menu-leading aria-hidden="true">⚙</span>
            <span data-rc-menu-label>Settings</span>
          </button>
        </rc-button>
        <rc-menu-button icon-only slot="overflow">
          <button type="button" slot="trigger" aria-label="View">
            <span data-rc-menu-leading aria-hidden="true">☷</span>
            <span data-rc-menu-label>View</span>
          </button>
          <span slot="indicator" aria-hidden="true">›</span>
          <rc-menu label="View">
            <button type="button" role="menuitem">Cards</button>
          </rc-menu>
        </rc-menu-button>
      </rc-adaptive-menu>
    `;

    document.body.append(scope);
    await settle(scope);

    const menu = scope.querySelector('rc-adaptive-menu');

    expect(menu).not.toBeNull();
    menu!.openMenu();
    await settle(scope);

    await expect(page.getByTestId('adaptive-menu-contract')).toMatchScreenshot(
      `adaptive-menu-contract-${mode}`,
      SCREENSHOT_OPTIONS,
    );
  },
);

test.runIf(isChromium).each(['light', 'dark'] as const)(
  'Material component contract visual baseline in %s mode',
  async (mode) => {
    document.documentElement.style.colorScheme = mode;

    const scope = document.createElement('section');

    scope.className = 'rc-theme-material';
    scope.dataset.testid = 'material-contract';

    scope.style.cssText = [
      'box-sizing:border-box',
      'display:grid',
      'gap:16px',
      'inline-size:420px',
      'padding:16px',
      'background:var(--md-sys-color-surface)',
      'color:var(--md-sys-color-on-surface)',
      'font:var(--md-sys-typescale-body-medium)',
    ].join(';');

    scope.style.colorScheme = mode;

    scope.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <rc-button class="rc-button--filled"><button type="button">Filled</button></rc-button>
        <rc-button class="rc-button--tonal"><button type="button">Tonal</button></rc-button>
        <rc-button class="rc-button--outlined"><button type="button">Outlined</button></rc-button>
        <rc-button class="rc-button--text"><button type="button">Text</button></rc-button>
      </div>
      <rc-list variant="segmented">
        <rc-list-item>
          <span data-rc-list-headline>Theme</span>
          <small data-rc-list-supporting>Use device setting</small>
        </rc-list-item>
        <rc-list-item>
          <span data-rc-list-headline>Sync</span>
          <small data-rc-list-supporting>Connected to cloud storage</small>
        </rc-list-item>
      </rc-list>
      <div style="inline-size:184px;justify-self:end">
        <rc-adaptive-menu max-shown="2">
          <rc-button icon-only class="rc-icon-button--standard" data-priority="20">
            <button type="button" aria-label="Favorite">
              <span data-rc-menu-leading aria-hidden="true">★</span>
              <span data-rc-menu-label>Favorite</span>
            </button>
          </rc-button>
          <rc-button icon-only class="rc-icon-button--standard" data-priority="10">
            <button type="button" aria-label="Edit">
              <span data-rc-menu-leading aria-hidden="true">✎</span>
              <span data-rc-menu-label>Edit</span>
            </button>
          </rc-button>
          <rc-button icon-only class="rc-icon-button--standard" slot="overflow">
            <button type="button" aria-label="Delete">
              <span data-rc-menu-leading aria-hidden="true">×</span>
              <span data-rc-menu-label>Delete</span>
            </button>
          </rc-button>
        </rc-adaptive-menu>
      </div>
    `;

    document.body.append(scope);
    await settle(scope);

    await expect(page.getByTestId('material-contract')).toMatchScreenshot(
      `material-contract-${mode}`,
      SCREENSHOT_OPTIONS,
    );
  },
);
