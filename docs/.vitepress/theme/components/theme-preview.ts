import noneCss from '../preview-themes/none.css?raw';
import materialCss from '@rcarls/rc-theme-material/theme.css?inline';

import {
  PREVIEW_MODE_STORAGE_KEY,
  PREVIEW_THEME_CHANGE_EVENT,
  PREVIEW_THEME_STORAGE_KEY,
  type PreviewMode,
  type PreviewState,
  type PreviewTheme,
} from '../preview-theme-controller';

const themeCss: Record<PreviewTheme, string[]> = {
  none: [noneCss],
  material: [noneCss, materialCss],
};

const themeLabels: Record<PreviewTheme, string> = {
  none: 'Default component appearance',
  material: 'Material 3 package theme',
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
  return value === 'none' || value === 'material';
}

function isPreviewMode(value: string | null): value is PreviewMode {
  return value === 'auto' || value === 'light' || value === 'dark';
}

function storedTheme(): PreviewTheme {
  try {
    const stored = localStorage.getItem(PREVIEW_THEME_STORAGE_KEY);
    if (isPreviewTheme(stored)) return stored;
  } catch {
    // Storage can be unavailable in embedded contexts.
  }

  return 'none';
}

function storedMode(): PreviewMode {
  try {
    const stored = localStorage.getItem(PREVIEW_MODE_STORAGE_KEY);
    if (isPreviewMode(stored)) return stored;
  } catch {
    // Storage can be unavailable in embedded contexts.
  }

  return 'auto';
}

function applyPreviewMode($scope: HTMLElement, mode: PreviewMode) {
  if (mode === 'auto') {
    delete $scope.dataset.rcPreviewMode;
    $scope.style.colorScheme = '';

    return;
  }

  $scope.dataset.rcPreviewMode = mode;
  $scope.style.colorScheme = mode;
}

export class ThemePreview extends HTMLElement {
  private readonly _root = this.attachShadow({ mode: 'open' });

  private _theme: PreviewTheme = 'none';

  private _mode: PreviewMode = 'auto';

  connectedCallback() {
    const theme = this.getAttribute('theme');
    const mode = this.getAttribute('mode');

    this._theme = isPreviewTheme(theme) ? theme : storedTheme();
    this._mode = isPreviewMode(mode) ? mode : storedMode();

    this._render();
    this._applyTheme();
    window.addEventListener(PREVIEW_THEME_CHANGE_EVENT, this._onPreviewChange as EventListener);
    window.addEventListener('storage', this._onStorage);
  }

  disconnectedCallback() {
    window.removeEventListener(PREVIEW_THEME_CHANGE_EVENT, this._onPreviewChange as EventListener);
    window.removeEventListener('storage', this._onStorage);
  }

  private readonly _onPreviewChange = (event: CustomEvent<Partial<PreviewState>>) => {
    const theme = event.detail?.theme;
    const mode = event.detail?.mode;

    this._setPreviewState({
      theme: isPreviewTheme(theme ?? null) ? theme : this._theme,
      mode: isPreviewMode(mode ?? null) ? mode : this._mode,
    });
  };

  private readonly _onStorage = (event: StorageEvent) => {
    if (event.key === PREVIEW_THEME_STORAGE_KEY && isPreviewTheme(event.newValue)) {
      this._setPreviewState({ theme: event.newValue, mode: this._mode });
    }

    if (event.key === PREVIEW_MODE_STORAGE_KEY && isPreviewMode(event.newValue)) {
      this._setPreviewState({ theme: this._theme, mode: event.newValue });
    }
  };

  private _setPreviewState(state: PreviewState) {
    if (state.theme === this._theme && state.mode === this._mode) return;

    this._theme = state.theme;
    this._mode = state.mode;
    this._applyTheme();

    const $label = this._root.querySelector('[data-preview-label]');
    if ($label) $label.textContent = themeLabels[this._theme];
  }

  private _applyTheme() {
    this.classList.toggle('rc-theme-material', this._theme === 'material');
    applyPreviewMode(this, this._mode);

    const cssTexts = themeCss[this._theme];

    if (supportsAdoptedStyleSheets()) {
      this._root.adoptedStyleSheets = cssTexts.map(sheetFor);

      return;
    }

    const $fallback = this._root.querySelector<HTMLStyleElement>('style[data-preview-fallback]');
    if ($fallback) $fallback.textContent = cssTexts.join('\n');
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

          <label class="preview-field">
            <span class="preview-label">Search</span>
            <rc-search-bar>
              <input type="search" value="Seasonal soup" aria-label="Search recipes">
            </rc-search-bar>
          </label>

          <label class="preview-field">
            <span class="preview-label">Ingredients</span>
            <rc-combobox placeholder="Add ingredient">
              <select slot="select" multiple aria-label="Ingredients">
                <option selected>Carrot</option>
                <option selected>Ginger</option>
                <option>Garlic</option>
              </select>
            </rc-combobox>
          </label>
        </div>

        <section class="preview-gallery" aria-label="Material component state gallery">
          <rc-app-bar data-scrolled>
            <button slot="leading" type="button" aria-label="Back">‹</button>
            <strong slot="title">Recipe Tome</strong>
            <button slot="trailing" type="button" aria-label="Favorite">♡</button>
          </rc-app-bar>

          <div class="preview-grid">
            <div class="preview-field">
              <span class="preview-label">Menu and menubar</span>
              <rc-menubar label="Recipe actions">
                <rc-menu-button>
                  <button slot="trigger" type="button">File</button>
                  <rc-menu label="File">
                    <button type="button">New recipe</button>
                    <button type="button" disabled>Import</button>
                  </rc-menu>
                </rc-menu-button>
              </rc-menubar>
              <rc-menu label="Example menu">
                <button type="button">Edit</button>
                <button type="button" aria-current="true">Preview</button>
                <button type="button" disabled>Publish</button>
              </rc-menu>
            </div>

            <div class="preview-field">
              <span class="preview-label">Disclosure and accordion</span>
              <rc-accordion>
                <rc-disclosure open>
                  <details open><summary>Details</summary><p>Material surface content.</p></details>
                </rc-disclosure>
                <rc-disclosure>
                  <details><summary>Nutrition</summary><p>Nutrition details.</p></details>
                </rc-disclosure>
              </rc-accordion>
            </div>

            <div class="preview-field">
              <span class="preview-label">Textarea</span>
              <rc-textarea label="Notes" line-numbers>
                <textarea>Simmer until tender.</textarea>
              </rc-textarea>
            </div>

            <div class="preview-field preview-field-wide">
              <span class="preview-label">Markdown editor</span>
              <rc-markdown-editor label="Recipe description">
                <textarea># Carrot soup</textarea>
              </rc-markdown-editor>
            </div>

            <div class="preview-field preview-field-wide">
              <span class="preview-label">Transfer list</span>
              <rc-transfer-list multiple>
                <select multiple aria-label="Recipe sections">
                  <option>Breakfast</option>
                  <option selected>Dinner</option>
                  <option>Dessert</option>
                </select>
              </rc-transfer-list>
            </div>

            <div class="preview-field">
              <span class="preview-label">Splitter</span>
              <rc-splitter class="preview-splitter" label="Preview panes">
                <div>Recipe</div>
                <div slot="secondary">Notes</div>
              </rc-splitter>
            </div>

            <div class="preview-field">
              <span class="preview-label">Virtual canvas</span>
              <rc-virtual-canvas class="preview-canvas">
                <canvas width="320" height="160"></canvas>
                <span slot="overlay">Scrollable surface</span>
              </rc-virtual-canvas>
            </div>
          </div>

          <rc-dialog>
            <dialog open aria-label="Material dialog preview">
              <h3>Save recipe?</h3>
              <p>This light-DOM dialog demonstrates the Material container treatment.</p>
              <button type="button">Cancel</button>
              <button type="button">Save</button>
            </dialog>
          </rc-dialog>
        </section>
      </div>
    `;
  }
}

export function defineThemePreview() {
  if (!customElements.get('theme-preview')) {
    customElements.define('theme-preview', ThemePreview);
  }
}
