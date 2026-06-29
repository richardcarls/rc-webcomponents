import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from '@docusaurus/router';
import { createPortal } from 'react-dom';

import { ClientOnly } from './ClientOnly';
import styles from './DemoFrame.module.css';

export type DemoFrameMode = 'auto' | 'light' | 'dark';

export type DemoFrameTheme = 'none' | 'substrate' | 'material';

export type DemoFrameControls = 'mode' | 'theme' | 'all';

export interface DemoFrameProps {
  children: ReactNode;
  controls?: DemoFrameControls;
  defaultMode?: DemoFrameMode;
  defaultTheme?: DemoFrameTheme;
  label?: string;
}

interface ShadowDemoSurfaceProps {
  children: ReactNode;
  label: string;
  mode: DemoFrameMode;
  theme: DemoFrameTheme;
}

interface DocusaurusRuntimeWindow extends Window {
  __docusaurus?: {
    siteConfig?: {
      baseUrl?: string;
    };
  };
}

interface DemoFramePreviewState {
  mode: DemoFrameMode;
  theme: DemoFrameTheme;
}

interface DemoFramePreviewStore {
  pathname: string;
  state: DemoFramePreviewState;
}

const STRUCTURAL_CSS = `
:host {
  display: block;
  color-scheme: inherit;
}

.demo-surface {
  all: initial;
  box-sizing: border-box;
  color: CanvasText;
  background: Canvas;
  color-scheme: inherit;
  display: block;
  min-inline-size: 0;
  padding-block: 1rem;
}

.demo-surface *, .demo-surface *::before, .demo-surface *::after {
  box-sizing: border-box;
}

.demo-surface[data-mode='light'] {
  color-scheme: light;
}

.demo-surface[data-mode='dark'] {
  color-scheme: dark;
}

.demo-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: flex-start;
}

.demo-col {
  display: flex;
  min-width: min(16rem, 100%);
  flex: 1 1 16rem;
  flex-direction: column;
  gap: 0.5rem;
}

.demo-event-log {
  min-height: 2.5em;
  max-height: 8em;
  margin-top: 1rem;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem;
}

.demo-event-log p {
  margin: 0.1em 0;
}

.demo-placeholder {
  color: GrayText;
}

.demo-form-output {
  margin-top: 0.75rem;
  overflow: auto;
  font-size: 0.85rem;
}

.demo-section-heading {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 1.5rem;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  white-space: nowrap;
  -webkit-font-smoothing: antialiased;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
`;

let structuralSheet: CSSStyleSheet | undefined;
let materialSheetPromise: Promise<CSSStyleSheet> | undefined;
let materialCssPromise: Promise<string> | undefined;
let substrateSheetPromise: Promise<CSSStyleSheet> | undefined;
let substrateCssPromise: Promise<string> | undefined;
let symbolFontInjected = false;
let robotoFontInjected = false;
let previewSnapshot: DemoFramePreviewStore = {
  pathname: '',
  state: {
    mode: 'auto',
    theme: 'none',
  },
};

const previewListeners = new Set<() => void>();

function getPreviewSnapshot(): DemoFramePreviewStore {
  return previewSnapshot;
}

function subscribePreviewState(listener: () => void): () => void {
  previewListeners.add(listener);

  return () => {
    previewListeners.delete(listener);
  };
}

function emitPreviewStateChange(): void {
  previewListeners.forEach((listener) => listener());
}

function ensurePreviewState(pathname: string, state: DemoFramePreviewState): void {
  if (previewSnapshot.pathname === pathname) {
    return;
  }

  previewSnapshot = { pathname, state };
}

function setPreviewState(next: Partial<DemoFramePreviewState>): void {
  const state = {
    ...previewSnapshot.state,
    ...next,
  };

  if (state.mode === previewSnapshot.state.mode && state.theme === previewSnapshot.state.theme) {
    return;
  }

  previewSnapshot = {
    ...previewSnapshot,
    state,
  };
  emitPreviewStateChange();
}

function supportsConstructableStylesheets(shadowRoot: ShadowRoot): boolean {
  return 'adoptedStyleSheets' in shadowRoot && 'replaceSync' in CSSStyleSheet.prototype;
}

function createStylesheet(cssText: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);

  return sheet;
}

function getStructuralSheet(): CSSStyleSheet {
  structuralSheet ??= createStylesheet(STRUCTURAL_CSS);

  return structuralSheet;
}

function normalizeBaseUrl(baseUrl: string | undefined): string {
  const value = baseUrl || '/rc-webcomponents/';
  return value.endsWith('/') ? value : `${value}/`;
}

function docsAssetUrl(path: string): string {
  const runtimeWindow = window as DocusaurusRuntimeWindow;
  return `${normalizeBaseUrl(runtimeWindow.__docusaurus?.siteConfig?.baseUrl)}${path}`;
}

function injectSymbolFont(): void {
  if (symbolFontInjected) return;
  symbolFontInjected = true;
  const $link = document.createElement('link');
  $link.rel = 'stylesheet';
  $link.href =
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
  document.head.append($link);
}

function injectMaterialFonts(): void {
  injectSymbolFont();
  if (robotoFontInjected) return;
  robotoFontInjected = true;
  const $link = document.createElement('link');
  $link.rel = 'stylesheet';
  $link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
  document.head.append($link);
}

async function loadMaterialCss(): Promise<string> {
  materialCssPromise ??= fetch(docsAssetUrl('rc-theme-material/theme.css')).then((response) => {
    if (!response.ok) {
      throw new Error(`Unable to load Material theme CSS: ${response.status}`);
    }

    return response.text();
  });

  return materialCssPromise;
}

async function loadMaterialSheet(): Promise<CSSStyleSheet> {
  materialSheetPromise ??= loadMaterialCss().then(createStylesheet);

  return materialSheetPromise;
}

async function loadSubstrateCss(): Promise<string> {
  substrateCssPromise ??= fetch(docsAssetUrl('rc-theme-substrate/theme.css')).then((response) => {
    if (!response.ok) {
      throw new Error(`Unable to load Substrate theme CSS: ${response.status}`);
    }

    return response.text();
  });

  return substrateCssPromise;
}

async function loadSubstrateSheet(): Promise<CSSStyleSheet> {
  substrateSheetPromise ??= loadSubstrateCss().then(createStylesheet);

  return substrateSheetPromise;
}

function themeClassName(theme: DemoFrameTheme): string {
  if (theme === 'material') return 'rc-theme-material';
  if (theme === 'substrate') return 'rc-theme-substrate';

  return '';
}

function loadThemeCss(theme: DemoFrameTheme): Promise<string> | undefined {
  if (theme === 'material') return loadMaterialCss();
  if (theme === 'substrate') return loadSubstrateCss();

  return undefined;
}

function loadThemeSheet(theme: DemoFrameTheme): Promise<CSSStyleSheet> | undefined {
  if (theme === 'material') return loadMaterialSheet();
  if (theme === 'substrate') return loadSubstrateSheet();

  return undefined;
}

function upsertFallbackStyle(shadowRoot: ShadowRoot, name: string, cssText: string): void {
  let $style = shadowRoot.querySelector<HTMLStyleElement>(`style[data-demo-frame="${name}"]`);
  if (!$style) {
    $style = document.createElement('style');
    $style.dataset.demoFrame = name;
    shadowRoot.prepend($style);
  }

  $style.textContent = cssText;
}

function removeFallbackStyle(shadowRoot: ShadowRoot, name: string): void {
  shadowRoot.querySelector<HTMLStyleElement>(`style[data-demo-frame="${name}"]`)?.remove();
}

function ShadowDemoSurface({ children, label, mode, theme }: ShadowDemoSurfaceProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    const $host = hostRef.current;
    if (!$host) {
      return;
    }

    setShadowRoot($host.shadowRoot ?? $host.attachShadow({ mode: 'open' }));
  }, []);

  useEffect(() => {
    if (!shadowRoot) {
      return;
    }

    injectSymbolFont();
    const themeSheetPromise = loadThemeSheet(theme);
    const themeCssPromise = loadThemeCss(theme);

    if (supportsConstructableStylesheets(shadowRoot)) {
      const structural = getStructuralSheet();
      shadowRoot.adoptedStyleSheets = [structural];
      removeFallbackStyle(shadowRoot, 'structural');
      removeFallbackStyle(shadowRoot, 'theme');

      if (theme !== 'none') {
        if (theme === 'material') {
          injectMaterialFonts();
        }

        if (!themeSheetPromise) {
          return;
        }

        let active = true;

        void themeSheetPromise.then((themeSheet) => {
          if (active) {
            shadowRoot.adoptedStyleSheets = [structural, themeSheet];
          }
        });

        return () => {
          active = false;
        };
      }

      return;
    }

    upsertFallbackStyle(shadowRoot, 'structural', STRUCTURAL_CSS);

    if (theme !== 'none') {
      if (theme === 'material') {
        injectMaterialFonts();
      }

      if (!themeCssPromise) {
        return;
      }

      let active = true;

      void themeCssPromise.then((cssText) => {
        if (active) {
          upsertFallbackStyle(shadowRoot, 'theme', cssText);
        }
      });

      return () => {
        active = false;
      };
    }

    removeFallbackStyle(shadowRoot, 'theme');
  }, [shadowRoot, theme]);

  const themeClass = themeClassName(theme);

  return (
    <div ref={hostRef} className={styles.surfaceHost}>
      {shadowRoot &&
        createPortal(
          <section
            className={themeClass ? `demo-surface ${themeClass}` : 'demo-surface'}
            data-mode={mode === 'auto' ? undefined : mode}
            aria-label={label}
          >
            {children}
          </section>,
          shadowRoot,
        )}
    </div>
  );
}

function controlId(label: string, frameId: string, suffix: string) {
  const baseId = `${label}-${frameId}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return `${baseId}-${suffix}`;
}

export function DemoFrame({
  children,
  controls = 'all',
  defaultMode = 'auto',
  defaultTheme = 'none',
  label = 'Live demo',
}: DemoFrameProps) {
  const { pathname } = useLocation();
  ensurePreviewState(pathname, { mode: defaultMode, theme: defaultTheme });

  const {
    state: { mode, theme },
  } = useSyncExternalStore(subscribePreviewState, getPreviewSnapshot, getPreviewSnapshot);
  const showMode = controls === 'mode' || controls === 'all';
  const showTheme = controls === 'theme' || controls === 'all';
  const frameId = useId();
  const modeId = controlId(label, frameId, 'mode');
  const themeId = controlId(label, frameId, 'theme');

  return (
    <ClientOnly fallback={<section className={styles.root} aria-label={label} />}>
      <figure className={styles.root}>
        {(showMode || showTheme) && (
          <figcaption className={styles.toolbar}>
            {showTheme && (
              <label className={styles.control} htmlFor={themeId}>
                <span>Theme</span>
                <select
                  id={themeId}
                  value={theme}
                  onChange={(event) => {
                    setPreviewState({
                      theme: event.currentTarget.value as DemoFrameTheme,
                    });
                  }}
                >
                  <option value="none">None</option>
                  <option value="substrate">Substrate</option>
                  <option value="material">Material</option>
                </select>
              </label>
            )}

            {showMode && (
              <label className={styles.control} htmlFor={modeId}>
                <span>Mode</span>
                <select
                  id={modeId}
                  value={mode}
                  onChange={(event) => {
                    setPreviewState({
                      mode: event.currentTarget.value as DemoFrameMode,
                    });
                  }}
                >
                  <option value="auto">Auto</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            )}
          </figcaption>
        )}

        <ShadowDemoSurface label={label} mode={mode} theme={theme}>
          {children}
        </ShadowDemoSurface>
      </figure>
    </ClientOnly>
  );
}
