import baseCss from '../preview-themes/base.css?raw';
import materialCss from '../preview-themes/material.css?raw';
import iosCss from '../preview-themes/ios.css?raw';
import fluentCss from '../preview-themes/fluent.css?raw';
import carbonCss from '../preview-themes/carbon.css?raw';

type PreviewTheme = 'material' | 'ios' | 'fluent' | 'carbon';

const STORAGE_KEY = 'rc-preview-theme';
const CHANGE_EVENT = 'rc-preview-theme-change';

const themeCss: Record<PreviewTheme, string> = {
  material: materialCss,
  ios: iosCss,
  fluent: fluentCss,
  carbon: carbonCss,
};

const themeLabels: Record<PreviewTheme, string> = {
  material: 'Material-inspired',
  ios: 'iOS-inspired',
  fluent: 'Fluent-inspired',
  carbon: 'Carbon-inspired',
};

const sheetCache = new Map<string, CSSStyleSheet>();

function supportsAdoptedStyleSheets() {
  return 'adoptedStyleSheets' in Document.prototype && 'adoptedStyleSheets' in ShadowRoot.prototype;
}

function sheetFor(cssText: string) {
  let sheet = sheetCache.get(cssText);
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    sheetCache.set(cssText, sheet);
  }
  return sheet;
}

function isPreviewTheme(value: string | null): value is PreviewTheme {
  return value === 'material' || value === 'ios' || value === 'fluent' || value === 'carbon';
}

function storedTheme(): PreviewTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isPreviewTheme(stored)) return stored;
  } catch {
    // Storage can be unavailable in embedded contexts.
  }
  return 'material';
}

export class ThemePreview extends HTMLElement {
  private readonly _root = this.attachShadow({ mode: 'open' });
  private _theme: PreviewTheme = 'material';

  connectedCallback() {
    this._theme = isPreviewTheme(this.getAttribute('theme'))
      ? this.getAttribute('theme') as PreviewTheme
      : storedTheme();
    this._render();
    this._applySheets();
    window.addEventListener(CHANGE_EVENT, this._onThemeChange as EventListener);
    window.addEventListener('storage', this._onStorage);
  }

  disconnectedCallback() {
    window.removeEventListener(CHANGE_EVENT, this._onThemeChange as EventListener);
    window.removeEventListener('storage', this._onStorage);
  }

  private readonly _onThemeChange = (event: CustomEvent<{ theme?: PreviewTheme }>) => {
    if (isPreviewTheme(event.detail?.theme ?? null)) {
      this._setTheme(event.detail.theme);
    }
  };

  private readonly _onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && isPreviewTheme(event.newValue)) {
      this._setTheme(event.newValue);
    }
  };

  private _setTheme(theme: PreviewTheme) {
    if (theme === this._theme) return;
    this._theme = theme;
    this._applySheets();
    const label = this._root.querySelector('[data-preview-label]');
    if (label) label.textContent = themeLabels[theme];
  }

  private _applySheets() {
    const cssTexts = [baseCss, themeCss[this._theme]];
    if (supportsAdoptedStyleSheets()) {
      this._root.adoptedStyleSheets = cssTexts.map(sheetFor);
      return;
    }

    const fallback = this._root.querySelector<HTMLStyleElement>('style[data-preview-fallback]');
    if (fallback) fallback.textContent = cssTexts.join('\n');
  }

  private _render() {
    this._root.innerHTML = `
      <style data-preview-fallback></style>
      <div class="preview-shell">
        <header class="preview-header">
          <div>
            <p class="preview-title">Component theme preview</p>
            <p class="preview-kicker" data-preview-label>${themeLabels[this._theme]}</p>
          </div>
          <div class="button-row" aria-label="Example actions">
            <button type="button">Save</button>
            <button type="button">Cancel</button>
          </div>
        </header>
        <div class="preview-grid">
          <label class="preview-field">
            <span class="preview-label">Status</span>
            <rc-select placeholder="Choose status">
              <select slot="select" name="status">
                <option value="">Choose status</option>
                <option value="planned">Planned</option>
                <option value="active" selected>Active</option>
                <option value="paused">Paused</option>
              </select>
            </rc-select>
          </label>

          <label class="preview-field">
            <span class="preview-label">Priority</span>
            <rc-slider display="inline-end">
              <input type="range" min="0" max="100" value="64" aria-label="Priority">
            </rc-slider>
          </label>

          <fieldset class="preview-field">
            <legend class="preview-label">Budget range</legend>
            <rc-range-slider display="inline-end">
              <input type="range" min="0" max="100" value="20" aria-label="Minimum budget">
              <input type="range" min="0" max="100" value="80" aria-label="Maximum budget">
            </rc-range-slider>
          </fieldset>

          <div class="preview-field">
            <span class="preview-label">Toolbar</span>
            <rc-toolbar aria-label="Formatting">
              <button type="button">Bold</button>
              <button type="button">Italic</button>
              <hr>
              <button type="button">Link</button>
            </rc-toolbar>
          </div>
        </div>
      </div>
    `;
  }
}

export function defineThemePreview() {
  if (!customElements.get('theme-preview')) {
    customElements.define('theme-preview', ThemePreview);
  }
}
