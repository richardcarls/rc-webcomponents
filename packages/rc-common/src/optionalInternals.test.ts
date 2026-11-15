import { LitElement, html } from 'lit';
import { expect, test } from 'vitest';

import { optionalInternals } from './optionalInternals.js';

class LegacyRoleElement extends LitElement {
  constructor() {
    super();
    optionalInternals(this, 'group');
  }

  override attachInternals(): ElementInternals {
    throw new Error('ElementInternals is unavailable');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

customElements.define('rc-legacy-role-test', LegacyRoleElement);

test('an element still upgrades and gets its default role without ElementInternals', async () => {
  const element = document.createElement('rc-legacy-role-test');

  document.body.append(element);
  await Promise.resolve();

  expect(element.getAttribute('role')).toBe('group');
  expect(element.shadowRoot).not.toBeNull();

  element.remove();
});

test('the role fallback preserves an author-provided role', async () => {
  const element = document.createElement('rc-legacy-role-test');

  element.setAttribute('role', 'region');
  document.body.append(element);
  await Promise.resolve();

  expect(element.getAttribute('role')).toBe('region');

  element.remove();
});
