import { useRef } from 'react';

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

.theme-preview-app-title {
  display: grid;
  gap: 0.15rem;
}

.theme-preview-app-title small,
.theme-preview-muted {
  color: GrayText;
}

.theme-preview-main {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(min(18rem, 100%), 0.7fr);
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
}

.theme-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
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

.theme-preview-splitter {
  block-size: 13rem;
  border: 1px solid color-mix(in srgb, CanvasText 12%, transparent);
  border-radius: 0.75rem;
}

.theme-preview-pane {
  display: grid;
  gap: 0.75rem;
  align-content: start;
  padding: 0.75rem;
}

.theme-preview-canvas {
  display: block;
  inline-size: 100%;
  block-size: 9rem;
}

.theme-preview-fab {
  position: absolute;
  inset-block-end: 1rem;
  inset-inline-end: 1rem;
}

.theme-preview-editor textarea {
  min-block-size: 8rem;
}

@media (max-width: 760px) {
  .theme-preview-main,
  .theme-preview-grid {
    grid-template-columns: 1fr;
  }

  .theme-preview-fab {
    position: static;
    margin: 0 1rem 1rem auto;
  }
}
`;

export function ThemePreviewShowcase() {
  const dialogRef = useRef<
    HTMLElement & { showModal: () => void; close: (value?: string) => void }
  >(null);

  return (
    <DemoFrame defaultTheme="material" label="Theme preview showcase">
      <style>{SHOWCASE_CSS}</style>
      <div className="theme-preview-shell">
        <rc-app-bar variant="expanded" scroll-behavior="collapse">
          <button slot="leading" type="button" aria-label="Open navigation">
            Menu
          </button>
          <div className="theme-preview-app-title">
            <strong>Recipe Studio</strong>
            <small>Theme preview workspace</small>
          </div>
          <rc-search-bar slot="center">
            <input type="search" name="search" aria-label="Search recipes" defaultValue="summer" />
          </rc-search-bar>
          <rc-menu-button slot="trailing">
            <button slot="trigger" type="button">
              Actions
            </button>
            <rc-menu label="Recipe actions">
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
            <section className="theme-preview-panel" aria-labelledby="theme-preview-command-title">
              <h2 className="demo-section-heading" id="theme-preview-command-title">
                Command surface
              </h2>
              <rc-menubar label="Recipe workspace menu">
                <rc-menu-button>
                  <button slot="trigger" type="button">
                    File
                  </button>
                  <rc-menu label="File">
                    <button type="button">New</button>
                    <button type="button">Open</button>
                  </rc-menu>
                </rc-menu-button>
                <rc-menu-button>
                  <button slot="trigger" type="button">
                    Edit
                  </button>
                  <rc-menu label="Edit">
                    <button type="button">Undo</button>
                    <button type="button">Redo</button>
                  </rc-menu>
                </rc-menu-button>
              </rc-menubar>
              <div className="theme-preview-actions">
                <rc-toolbar label="Formatting">
                  <button type="button">Bold</button>
                  <button type="button">Italic</button>
                  <hr />
                  <button type="button">Link</button>
                </rc-toolbar>
                <button type="button" onClick={() => dialogRef.current?.showModal()}>
                  Open dialog
                </button>
              </div>
            </section>

            <section className="theme-preview-panel" aria-labelledby="theme-preview-editor-title">
              <h2 className="demo-section-heading" id="theme-preview-editor-title">
                Edit and preview
              </h2>
              <rc-splitter label="Recipe editor and preview" className="theme-preview-splitter">
                <div className="theme-preview-pane theme-preview-editor">
                  <rc-markdown-editor label="Recipe notes">
                    <textarea defaultValue={'# Tomato salad\n\nSeason, toss, and serve chilled.'} />
                  </rc-markdown-editor>
                </div>
                <div slot="secondary" className="theme-preview-pane">
                  <rc-virtual-canvas>
                    <canvas
                      className="theme-preview-canvas"
                      width="360"
                      height="180"
                      aria-label="Recipe activity preview canvas"
                    />
                    <span slot="overlay">Activity preview</span>
                  </rc-virtual-canvas>
                  <p className="theme-preview-muted">
                    Canvas and editor surfaces stay inside the same themed preview.
                  </p>
                </div>
              </rc-splitter>
            </section>
          </div>

          <aside className="theme-preview-stack" aria-label="Recipe settings and status">
            <section className="theme-preview-panel">
              <h2 className="demo-section-heading">Recipe settings</h2>
              <div className="theme-preview-grid">
                <label className="theme-preview-field">
                  <span>Status</span>
                  <rc-select placeholder="Choose status">
                    <select slot="select" name="status" defaultValue="draft">
                      <option value="">Choose status</option>
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                      <option value="published">Published</option>
                    </select>
                  </rc-select>
                </label>
                <label className="theme-preview-field">
                  <span>Ingredient</span>
                  <rc-combobox placeholder="Choose or create">
                    <select slot="select" name="ingredient" defaultValue="tomato">
                      <option value="tomato">Tomato</option>
                      <option value="basil">Basil</option>
                      <option value="olive-oil">Olive oil</option>
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

            <section className="theme-preview-panel">
              <h2 className="demo-section-heading">Structured content</h2>
              <rc-accordion name="theme-preview-accordion">
                <rc-disclosure>
                  <details open>
                    <summary>Prep notes</summary>
                    <div>
                      <p>Native details and summary remain the semantic source.</p>
                    </div>
                  </details>
                </rc-disclosure>
                <rc-disclosure>
                  <details>
                    <summary>Serving ideas</summary>
                    <div>
                      <p>Disclosure styling follows the selected preview theme.</p>
                    </div>
                  </details>
                </rc-disclosure>
              </rc-accordion>
            </section>

            <section className="theme-preview-panel">
              <h2 className="demo-section-heading">Publish checklist</h2>
              <rc-transfer-list multiple>
                <select multiple aria-label="Available checklist items">
                  <option value="ingredients">Ingredients</option>
                  <option value="photos" selected>
                    Photos
                  </option>
                  <option value="nutrition">Nutrition</option>
                  <option value="accessibility">Accessibility notes</option>
                </select>
              </rc-transfer-list>
            </section>
          </aside>
        </div>

        <rc-fab className="theme-preview-fab" extended>
          <span aria-hidden="true">+</span>
          <span>Recipe</span>
        </rc-fab>

        <rc-dialog ref={dialogRef}>
          <dialog aria-labelledby="theme-preview-dialog-title">
            <strong id="theme-preview-dialog-title">Publish recipe</strong>
            <p>Dialog behavior remains native while the preview theme styles its surface.</p>
            <button type="button" onClick={() => dialogRef.current?.close('publish')}>
              Publish
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
