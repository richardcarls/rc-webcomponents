import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { userEvent } from 'vitest/browser';

import { keyNavigation } from './KeyboardNavigationDirective';


// ─── Axis auto-detection ──────────────────────────────────────────────────────

test('keyNavigation: role=menu uses vertical axis (ArrowDown → next)', async () => {
  const cb = vi.fn();
  const screen = render(html`<div role="menu" tabindex="0" ${keyNavigation(cb)}></div>`);
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{ArrowDown}');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('next');
});

test('keyNavigation: role=menu uses vertical axis (ArrowUp → prev)', async () => {
  const cb = vi.fn();
  const screen = render(html`<div role="menu" tabindex="0" ${keyNavigation(cb)}></div>`);
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{ArrowUp}');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('prev');
});

test('keyNavigation: role=toolbar uses horizontal axis (ArrowRight → next)', async () => {
  const cb = vi.fn();
  const screen = render(html`<div role="toolbar" tabindex="0" ${keyNavigation(cb)}></div>`);
  const el = screen.getByRole('toolbar');

  (await el.element()).focus();
  await userEvent.keyboard('{ArrowRight}');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('next');
});

test('keyNavigation: role=toolbar uses horizontal axis (ArrowLeft → prev)', async () => {
  const cb = vi.fn();
  const screen = render(html`<div role="toolbar" tabindex="0" ${keyNavigation(cb)}></div>`);
  const el = screen.getByRole('toolbar');

  (await el.element()).focus();
  await userEvent.keyboard('{ArrowLeft}');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('prev');
});

test('keyNavigation: role=menubar uses horizontal axis (ArrowRight → next)', async () => {
  const cb = vi.fn();
  const screen = render(html`<div role="menubar" tabindex="0" ${keyNavigation(cb)}></div>`);
  const el = screen.getByRole('menubar');

  (await el.element()).focus();
  await userEvent.keyboard('{ArrowRight}');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('next');
});


// ─── navigationAxis option override ──────────────────────────────────────────

test('keyNavigation: navigationAxis option overrides role-based detection', async () => {
  const cb = vi.fn();
  // role=menu would normally be vertical, but we override to horizontal
  const screen = render(
    html`<div role="menu" tabindex="0" ${keyNavigation(cb, { navigationAxis: 'horizontal' })}></div>`
  );
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{ArrowRight}');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('next');
});


// ─── Home / End ───────────────────────────────────────────────────────────────

test('keyNavigation: Home → start', async () => {
  const cb = vi.fn();
  const screen = render(html`<div role="menu" tabindex="0" ${keyNavigation(cb)}></div>`);
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{Home}');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('start');
});

test('keyNavigation: End → end', async () => {
  const cb = vi.fn();
  const screen = render(html`<div role="menu" tabindex="0" ${keyNavigation(cb)}></div>`);
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{End}');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('end');
});


// ─── Escape handling ──────────────────────────────────────────────────────────

test('keyNavigation: Escape does nothing without handleEscape', async () => {
  const cb = vi.fn();
  const screen = render(html`<div role="menu" tabindex="0" ${keyNavigation(cb)}></div>`);
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{Escape}');

  expect(cb).not.toHaveBeenCalled();
});

test('keyNavigation: handleEscape dispatches escape action', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div role="menu" tabindex="0" ${keyNavigation(cb, { handleEscape: true })}></div>`
  );
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{Escape}');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('escape');
});


// ─── Activate handling ────────────────────────────────────────────────────────

test('keyNavigation: Enter dispatches toggle without handleActivate', async () => {
  const cb = vi.fn();
  const screen = render(html`<div role="menu" tabindex="0" ${keyNavigation(cb)}></div>`);
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{Enter}');
  expect(cb).toHaveBeenNthCalledWith(1, 'toggle');

  await userEvent.keyboard('{Enter}');
  expect(cb).toHaveBeenNthCalledWith(2, 'toggle');
});

test('keyNavigation: handleActivate maps Enter → activate', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div role="menu" tabindex="0" ${keyNavigation(cb, { handleActivate: true })}></div>`
  );
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{Enter}');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('activate');
});

test('keyNavigation: handleActivate maps Space → activate', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div role="menu" tabindex="0" ${keyNavigation(cb, { handleActivate: true })}></div>`
  );
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard(' ');

  expect(cb).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledWith('activate');
});

test('keyNavigation: Space does nothing without handleActivate', async () => {
  const cb = vi.fn();
  const screen = render(html`<div role="menu" tabindex="0" ${keyNavigation(cb)}></div>`);
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard(' ');

  expect(cb).not.toHaveBeenCalled();
});


// ─── handleNavAxis / handleOpenAxis ──────────────────────────────────────────

test('keyNavigation: handleNavAxis=false suppresses next/prev/start/end', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div role="menu" tabindex="0" ${keyNavigation(cb, { handleNavAxis: false })}></div>`
  );
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{ArrowUp}');
  await userEvent.keyboard('{Home}');
  await userEvent.keyboard('{End}');

  expect(cb).not.toHaveBeenCalled();
});

test('keyNavigation: handleOpenAxis dispatches open-to-first and open-to-last', async () => {
  const cb = vi.fn();
  // role=menu is vertical; open axis is horizontal (ArrowRight/ArrowLeft)
  const screen = render(
    html`<div role="menu" tabindex="0" ${keyNavigation(cb, { handleNavAxis: false, handleOpenAxis: true })}></div>`
  );
  const el = screen.getByRole('menu');

  (await el.element()).focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(cb).toHaveBeenNthCalledWith(1, 'open-to-first');

  await userEvent.keyboard('{ArrowLeft}');
  expect(cb).toHaveBeenNthCalledWith(2, 'open-to-last');
});

test('keyNavigation: horizontal open axis maps ArrowDown → open-to-first', async () => {
  const cb = vi.fn();
  // role=toolbar is horizontal; open axis is vertical (ArrowDown/ArrowUp)
  const screen = render(
    html`<div role="toolbar" tabindex="0" ${keyNavigation(cb, { handleNavAxis: false, handleOpenAxis: true })}></div>`
  );
  const el = screen.getByRole('toolbar');

  (await el.element()).focus();
  await userEvent.keyboard('{ArrowDown}');
  expect(cb).toHaveBeenCalledWith('open-to-first');

  await userEvent.keyboard('{ArrowUp}');
  expect(cb).toHaveBeenCalledWith('open-to-last');
});

