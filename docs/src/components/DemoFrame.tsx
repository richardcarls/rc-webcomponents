import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import materialThemeCss from '../../../packages/rc-theme-material/theme.css?raw';

import { ClientOnly } from './ClientOnly';
import styles from './DemoFrame.module.css';

export type DemoFrameMode = 'auto' | 'light' | 'dark';

export type DemoFrameTheme = 'none' | 'material';

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

const STRUCTURAL_CSS = `
:host {
  display: block;
  color-scheme: inherit;
}

*, *::before, *::after {
  box-sizing: border-box;
}

.demo-surface {
  display: block;
  min-inline-size: 0;
  padding-block: 1rem;
}

.demo-surface[data-mode='light'] {
  color-scheme: light;
}

.demo-surface[data-mode='dark'] {
  color-scheme: dark;
}
`;

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

    const cssText = theme === 'material'
      ? `${STRUCTURAL_CSS}\n${materialThemeCss}`
      : STRUCTURAL_CSS;

    let $style = shadowRoot.querySelector<HTMLStyleElement>('style[data-demo-frame]');
    if (!$style) {
      $style = document.createElement('style');
      $style.dataset.demoFrame = '';
      shadowRoot.prepend($style);
    }

    $style.textContent = cssText;
  }, [shadowRoot, theme]);

  return (
    <div ref={hostRef} className={styles.surfaceHost}>
      {shadowRoot && createPortal(
        <section
          className={clsx('demo-surface', theme === 'material' && 'rc-theme-material')}
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

function controlId(label: string, suffix: string) {
  return `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${suffix}`;
}

export function DemoFrame({
  children,
  controls = 'all',
  defaultMode = 'auto',
  defaultTheme = 'none',
  label = 'Live demo',
}: DemoFrameProps) {
  const [mode, setMode] = useState<DemoFrameMode>(defaultMode);
  const [theme, setTheme] = useState<DemoFrameTheme>(defaultTheme);
  const showMode = controls === 'mode' || controls === 'all';
  const showTheme = controls === 'theme' || controls === 'all';
  const modeId = controlId(label, 'mode');
  const themeId = controlId(label, 'theme');

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
                  onChange={(event) => setTheme(event.currentTarget.value as DemoFrameTheme)}
                >
                  <option value="none">None</option>
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
                  onChange={(event) => setMode(event.currentTarget.value as DemoFrameMode)}
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
