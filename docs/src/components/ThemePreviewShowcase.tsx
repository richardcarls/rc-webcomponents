import { useCallback, useRef } from 'react';

import { markdownPlugin } from '@rcarls/rc-textarea-plugin-markdown';

import type { RCDialogRef, RCTextareaRef } from '@rcarls/rc-webcomponents/react';

import { DemoFrame } from './DemoFrame';

const SHOWCASE_CSS = `
.theme-preview-shell {
  position: relative;
  overflow: clip;
  border: 1px solid color-mix(in srgb, CanvasText 14%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, Canvas 94%, CanvasText 6%);
}

.theme-preview-shell rc-app-bar {
  --rc-app-bar-scroll-divider: 1px solid color-mix(in srgb, CanvasText 14%, transparent);
}

.theme-preview-muted {
  color: GrayText;
}

.theme-preview-main {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.theme-preview-panel {
  min-inline-size: 0;
  border: 1px solid color-mix(in srgb, CanvasText 12%, transparent);
  border-radius: 0.75rem;
  padding: 1rem;
  background: Canvas;
}

.theme-preview-stack {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.theme-preview-field {
  display: grid;
  min-inline-size: 0;
  gap: 0.4rem;
}

.theme-preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.theme-preview-toolbar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem 1rem;
}

@media (max-width: 520px) {
  .theme-preview-main {
    grid-template-columns: 1fr;
  }
}
`;

const NOTES_MD = `## Overview
A *brief* summary with **key** points.

- Item one
- \`inline code\` example
- [Link text](url)`;

export function ThemePreviewShowcase() {
  const dialogRef = useRef<RCDialogRef>(null);
  const textareaRef = useCallback((el: RCTextareaRef | null) => {
    if (el) el.plugin = markdownPlugin;
  }, []);

  return (
    <DemoFrame defaultTheme="substrate" label="Theme preview showcase">
      <style>{SHOWCASE_CSS}</style>
      <div className="theme-preview-shell">
        <rc-app-bar>
          <button slot="leading" type="button" aria-label="Open navigation">
            <span className="material-symbols-outlined" aria-hidden="true">menu</span>
          </button>
          <strong>Component Sampler</strong>
          <rc-menu-button slot="trailing" placement="bottom-end">
            <button slot="trigger" type="button" aria-label="More actions">
              <span className="material-symbols-outlined" aria-hidden="true">more_vert</span>
            </button>
            <rc-menu label="Actions">
              <button type="button" value="duplicate">
                Duplicate
              </button>
              <button type="button" value="share">
                Share
              </button>
              <button type="button" value="archive" disabled>
                Archive
              </button>
            </rc-menu>
          </rc-menu-button>
        </rc-app-bar>

        <div className="theme-preview-main">
          <div className="theme-preview-stack">
            <section className="theme-preview-panel" aria-labelledby="theme-preview-filters-title">
              <h2 className="demo-section-heading" id="theme-preview-filters-title">
                Filters
              </h2>
              <div className="theme-preview-stack">
                <label className="theme-preview-field">
                  <span>Status</span>
                  <rc-select placeholder="Choose status">
                    <select name="status" defaultValue="active">
                      <option value="">Choose status</option>
                      <option value="active">Active</option>
                      <option value="on-hold">On hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </rc-select>
                </label>
                <label className="theme-preview-field">
                  <span>Label</span>
                  <rc-combobox placeholder="Choose or create">
                    <select name="label" defaultValue="feature">
                      <option value="bug">Bug</option>
                      <option value="feature">Feature</option>
                      <option value="enhancement">Enhancement</option>
                      <option value="docs">Documentation</option>
                    </select>
                  </rc-combobox>
                </label>
                <label className="theme-preview-field">
                  <span>Priority</span>
                  <rc-slider display="inline-end">
                    <input type="range" min="0" max="100" defaultValue="64" aria-label="Priority" />
                  </rc-slider>
                </label>
                <fieldset className="theme-preview-field">
                  <legend>Budget range</legend>
                  <rc-range-slider display="inline-end">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="20"
                      aria-label="Minimum budget"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="80"
                      aria-label="Maximum budget"
                    />
                  </rc-range-slider>
                </fieldset>
              </div>
            </section>
          </div>

          <aside className="theme-preview-stack" aria-label="Details and active columns">
            <section className="theme-preview-panel">
              <h2 className="demo-section-heading">Details</h2>
              <rc-accordion name="theme-preview-accordion">
                <rc-disclosure>
                  <details open>
                    <summary>Overview</summary>
                    <div>
                      <p>Native details and summary remain the semantic source.</p>
                    </div>
                  </details>
                </rc-disclosure>
                <rc-disclosure>
                  <details>
                    <summary>Notes</summary>
                    <div>
                      <p>Disclosure styling follows the selected preview theme.</p>
                    </div>
                  </details>
                </rc-disclosure>
              </rc-accordion>
            </section>

            <section className="theme-preview-panel">
              <h2 className="demo-section-heading">Notes</h2>
              <rc-textarea ref={textareaRef} label="Notes" line-numbers>
                <textarea defaultValue={NOTES_MD} />
              </rc-textarea>
            </section>
          </aside>
        </div>

        <div className="theme-preview-toolbar-row">
          <div className="theme-preview-actions">
            <rc-toolbar label="Formatting">
              <button type="button" aria-label="Bold">
                <span className="material-symbols-outlined" aria-hidden="true">format_bold</span>
              </button>
              <button type="button" aria-label="Italic">
                <span className="material-symbols-outlined" aria-hidden="true">format_italic</span>
              </button>
              <hr />
              <button type="button" aria-label="Link">
                <span className="material-symbols-outlined" aria-hidden="true">link</span>
              </button>
            </rc-toolbar>
            <button type="button" onClick={() => dialogRef.current?.showModal()}>
              Open dialog
            </button>
          </div>
          <rc-fab>
            <button type="button">
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              New
            </button>
          </rc-fab>
        </div>

        <rc-dialog ref={dialogRef}>
          <dialog aria-labelledby="theme-preview-dialog-title">
            <strong id="theme-preview-dialog-title">Save changes</strong>
            <p>Dialog behavior remains native while the preview theme styles its surface.</p>
            <button type="button" onClick={() => dialogRef.current?.close('save')}>
              Save
            </button>
            <button type="button" onClick={() => dialogRef.current?.close('cancel')}>
              Cancel
            </button>
          </dialog>
        </rc-dialog>
      </div>
    </DemoFrame>
  );
}
