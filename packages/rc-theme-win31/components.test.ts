import { afterEach, expect, test } from 'vitest';

// Component styles read the --win31-* tokens directly, so they load over the
// token layers exactly as theme.css composes them. See bridge.test.ts.
import './defaults.css';
import './bridge.css';
import './components.css';

const scrollerCss = await import('./components/scroller.css?raw').then(
  (module) => module.default as string,
);

afterEach(() => {
  document.body.replaceChildren();
});

function renderScope(): HTMLElement {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-win31';
  document.body.append(scope);

  return scope;
}

/**
 * Builds a host with an open shadow root exposing one named part, so part-based
 * theme rules can be asserted without depending on the component packages.
 */
function renderPart(scope: HTMLElement, tagName: string, partName: string): HTMLElement {
  const host = document.createElement(tagName);
  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  const part = document.createElement('div');

  part.setAttribute('part', partName);
  shadowRoot.append(part);
  scope.append(host);

  return part;
}

test('push buttons are beveled, square, and motionless', () => {
  const scope = renderScope();
  const host = document.createElement('rc-button');
  const button = document.createElement('button');

  host.append(button);
  scope.append(host);

  const styles = getComputedStyle(button);

  expect(styles.minBlockSize).toBe('22px');
  expect(styles.borderRadius).toBe('0px');
  expect(styles.boxShadow).not.toBe('none');
  expect(styles.transitionDuration).toBe('0s');
  expect(styles.cursor).toBe('default');
});

test('a disabled button is embossed rather than faded', () => {
  const scope = renderScope();
  const host = document.createElement('rc-button');
  const button = document.createElement('button');

  button.disabled = true;
  host.append(button);
  scope.append(host);

  const styles = getComputedStyle(button);

  expect(styles.opacity).toBe('1');
  expect(styles.textShadow).not.toBe('none');
});

test('listboxes are sunken wells with 17px rows and no selection checkmark', () => {
  const scope = renderScope();
  const listbox = document.createElement('rc-listbox');

  scope.append(listbox);

  const styles = getComputedStyle(listbox);

  expect(styles.display).toBe('block');
  expect(styles.borderRadius).toBe('0px');

  // An unregistered custom property computes to its substituted token stream
  // rather than to a length, so the row height is measured through a property
  // that actually resolves one.
  const probe = document.createElement('div');

  listbox.append(probe);
  probe.style.setProperty('block-size', 'var(--rc-listbox-option-min-block-size)');

  expect(getComputedStyle(probe).blockSize).toBe('17px');

  const checkmark = renderPart(scope, 'rc-listbox', 'option-checkmark');

  expect(getComputedStyle(checkmark).display).toBe('none');
});

test('the select toggle is a beveled arrow button at the scrollbar size', () => {
  const scope = renderScope();
  const indicator = renderPart(scope, 'rc-select', 'toggle-indicator');
  const styles = getComputedStyle(indicator);

  expect(styles.inlineSize).toBe('16px');
  expect(styles.backgroundImage).toContain('data:image/svg+xml');
  expect(styles.boxShadow).not.toBe('none');
});

test('the dialog caption bar is a centered bold title on the active caption color', () => {
  const scope = renderScope();
  const host = document.createElement('rc-dialog');
  const dialog = document.createElement('dialog');
  const header = document.createElement('header');
  const title = document.createElement('h2');

  header.append(title);
  dialog.append(header);
  host.append(dialog);
  scope.append(host);

  const headerStyles = getComputedStyle(header);
  const titleStyles = getComputedStyle(title);

  expect(headerStyles.minBlockSize).toBe('24px');
  expect(headerStyles.backgroundColor).toBe('rgb(0, 0, 128)');
  expect(headerStyles.color).toBe('rgb(255, 255, 255)');
  expect(headerStyles.userSelect).toBe('none');
  expect(titleStyles.textAlign).toBe('center');
  expect(titleStyles.fontWeight).toBe('700');
});

test('the system-menu box is drawn rather than lettered', () => {
  const scope = renderScope();
  const host = document.createElement('rc-dialog');
  const dialog = document.createElement('dialog');
  const header = document.createElement('header');
  const sysmenu = document.createElement('button');

  header.append(sysmenu);
  dialog.append(header);
  host.append(dialog);
  scope.append(host);

  expect(getComputedStyle(sysmenu).fontSize).toBe('0px');
  expect(getComputedStyle(sysmenu, '::before').content).not.toBe('none');
});

test('the disclosure header carries a beveled triangle box that flips when open', () => {
  const scope = renderScope();
  const host = document.createElement('rc-disclosure');
  const details = document.createElement('details');
  const summary = document.createElement('summary');

  details.append(summary);
  host.append(details);
  scope.append(host);

  const closed = getComputedStyle(summary, '::after').backgroundImage;

  details.open = true;

  const open = getComputedStyle(summary, '::after').backgroundImage;

  expect(closed).toContain('data:image/svg+xml');
  expect(open).toContain('data:image/svg+xml');
  expect(open).not.toBe(closed);
  expect(getComputedStyle(summary).textAlign).toBe('center');
});

test('scrollbars fall back to the standard properties for browsers without the pseudo-elements', () => {
  const styles = getComputedStyle(renderScope());

  // Firefox exposes no ::-webkit-scrollbar tree, so the two-color fallback is
  // the only thing it can render. Vitest's browser shell may suppress its own
  // scrollbars with an unlayered rule, so assert the theme's layered width
  // declaration directly and the rendered color independently.
  expect(scrollerCss).toMatch(/scrollbar-width:\s*auto/);
  expect(styles.scrollbarColor).toBe('rgb(192, 192, 192) rgb(128, 128, 128)');
});

test('progress fills in discrete blocks rather than a continuous bar', () => {
  const scope = renderScope();
  const fill = renderPart(scope, 'rc-progress', 'fill');
  const styles = getComputedStyle(fill);

  expect(styles.backgroundImage).toContain('repeating-linear-gradient');
  expect(styles.transitionDuration).toBe('0s');
});

test('a latched toolbar button inverts its bevel and takes the dithered face', () => {
  const scope = renderScope();
  const toolbar = document.createElement('rc-toolbar');
  const resting = document.createElement('button');
  const latched = document.createElement('button');

  latched.setAttribute('aria-pressed', 'true');
  toolbar.append(resting, latched);
  scope.append(toolbar);

  const restingStyles = getComputedStyle(resting);
  const latchedStyles = getComputedStyle(latched);

  expect(restingStyles.inlineSize).toBe('27px');
  expect(restingStyles.backgroundImage).toBe('none');
  expect(latchedStyles.backgroundImage).toContain('data:image/svg+xml');
  expect(latchedStyles.boxShadow).not.toBe(restingStyles.boxShadow);
});

test('nothing in the theme is rounded or animated', () => {
  const scope = renderScope();

  scope.innerHTML = `
    <rc-button><button>OK</button></rc-button>
    <rc-listbox></rc-listbox>
    <rc-chip><button>Chip</button></rc-chip>
    <rc-toolbar><button></button></rc-toolbar>
    <rc-disclosure><details><summary>Pane</summary></details></rc-disclosure>
  `;

  for (const element of scope.querySelectorAll('*')) {
    const styles = getComputedStyle(element);

    expect(styles.borderRadius, element.tagName).toBe('0px');
    expect(styles.transitionDuration, element.tagName).toBe('0s');
  }

  const menuButton = document.createElement('rc-menu-button');

  scope.append(menuButton);

  expect(getComputedStyle(menuButton).getPropertyValue('--rc-menu-button-popup-duration').trim()).toBe(
    '0ms',
  );
});
