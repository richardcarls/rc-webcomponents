import type { CSSProperties, RefObject } from 'react';
import type * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  RCAppBarRef,
  RCDialogRef,
  RCDisclosureRef,
  RCListboxRef,
  RCMenuRef,
  RCRangeSliderRef,
  RCSearchBarRef,
  RCSliderRef,
  RCTransferListChangeDetail,
  RCTransferListRef,
  RCVirtualCanvasRef,
  RCVirtualCanvasRenderDetail,
  RCVirtualCanvasPointerDetail,
} from '@rcarls/rc-webcomponents/react';

import hljs from 'highlight.js/lib/core';
import rust from 'highlight.js/lib/languages/rust';
hljs.registerLanguage('rust', rust);

import { createMarkdownPlugin } from '@rcarls/rc-textarea-plugin-markdown';

import { DemoFrame } from './DemoFrame';

type DetailEvent<T> = CustomEvent<T>;
type EventLogTarget = RefObject<HTMLElement | null> | HTMLElement | null;

function getEventLogTarget(target: EventLogTarget): HTMLElement | null {
  if (!target) {
    return null;
  }

  if ('addEventListener' in target) {
    return target;
  }

  return target.current;
}

function useEventLog<T>(
  target: EventLogTarget,
  eventName: string,
  format: (detail: T) => string,
) {
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const $element = getEventLogTarget(target);
    if (!$element) {
      return;
    }

    const handleEvent = (event: Event) => {
      setLog((current) => [
        format((event as DetailEvent<T>).detail),
        ...current,
      ].slice(0, 8));
    };

    $element.addEventListener(eventName, handleEvent);

    return () => {
      $element.removeEventListener(eventName, handleEvent);
    };
  }, [eventName, format, target]);

  return log;
}

function EventLog({ entries, placeholder = 'Events will appear here...' }: {
  entries: string[];
  placeholder?: string;
}) {
  return (
    <div className="demo-event-log">
      {entries.length
        ? entries.map((entry, i) => <p key={i}>{entry}</p>)
        : <p className="demo-placeholder">{placeholder}</p>}
    </div>
  );
}

export function AppBarDemo() {
  const barRef = useRef<RCAppBarRef>(null);

  return (
    <DemoFrame>
      <div style={{ border: '1px solid ButtonBorder' }}>
        <rc-app-bar ref={barRef} variant="expanded" scroll-behavior="collapse">
          <button slot="leading" type="button" aria-label="Back">
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          </button>
          <div>
            <strong>Recipes</strong>
            <small style={{ display: 'block' }}>Summer collection</small>
          </div>
          <rc-search-bar slot="center">
            <input type="search" aria-label="Search recipes" />
          </rc-search-bar>
          <button slot="trailing" type="button" aria-label="Edit">
            <span className="material-symbols-outlined" aria-hidden="true">edit</span>
          </button>
        </rc-app-bar>
      </div>
      <p>
        <button type="button" onClick={() => { if (barRef.current) barRef.current.scrolled = true; }}>
          Compact endpoint
        </button>{' '}
        <button type="button" onClick={() => { if (barRef.current) barRef.current.scrolled = false; }}>
          Expanded endpoint
        </button>
      </p>
    </DemoFrame>
  );
}

export function ComboboxDemo() {
  const [comboEl, setComboEl] = useState<HTMLElement | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!comboEl) return;

    const handleChange = (event: Event) => {
      const { value } = (event as CustomEvent<{ value: string | string[] }>).detail;
      const display = Array.isArray(value) ? value.join(', ') : value;
      setLog((current) => [`rc-select-change -> ${display}`, ...current].slice(0, 8));
    };

    comboEl.addEventListener('rc-select-change', handleChange);
    return () => comboEl.removeEventListener('rc-select-change', handleChange);
  }, [comboEl]);

  return (
    <DemoFrame>
      <div className="demo-row">
        <label className="demo-col">
          <span>Ingredient</span>
          <rc-combobox ref={(el) => setComboEl(el as HTMLElement | null)} placeholder="Choose or create">
            <select name="ingredient">
              <option value="carrot">Carrot</option>
              <option value="ginger">Ginger</option>
              <option value="garlic">Garlic</option>
              <option value="onion">Onion</option>
            </select>
          </rc-combobox>
        </label>
        <label className="demo-col">
          <span>Multiple</span>
          <rc-combobox placeholder="Add tags" allow-create>
            <select name="tags" multiple>
              <option value="vegetarian">Vegetarian</option>
              <option value="quick">Quick</option>
              <option value="dinner">Dinner</option>
            </select>
          </rc-combobox>
        </label>
      </div>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function DialogDemo() {
  const [dialogEl, setDialogEl] = useState<RCDialogRef | null>(null);
  const [confirmEl, setConfirmEl] = useState<RCDialogRef | null>(null);
  const log = useEventLog<{ returnValue: string }>(
    dialogEl,
    'rc-dialog-close',
    ({ returnValue }) => `rc-dialog-close -> ${returnValue || '(empty)'}`,
  );
  const confirmLog = useEventLog<{ returnValue: string }>(
    confirmEl,
    'rc-dialog-close',
    ({ returnValue }) => `rc-dialog-close (confirm) -> ${returnValue || '(empty)'}`,
  );

  return (
    <DemoFrame>
      <p style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: 0 }}>
        <button type="button" onClick={() => dialogEl?.showModal()}>Open draggable dialog</button>
        <button type="button" onClick={() => confirmEl?.showModal()}>Open confirm dialog</button>
      </p>
      <rc-dialog ref={(el) => setDialogEl(el as RCDialogRef | null)} movable move-handle="[data-titlebar]" resize="both">
        <dialog aria-labelledby="dialog-demo-title">
          <div data-titlebar style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <strong id="dialog-demo-title" style={{ flex: 1 }}>Native dialog</strong>
            <button
              type="button"
              aria-label="Close"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.125rem' }}
              onClick={() => dialogEl?.close('dismiss')}
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '1rem' }}>close</span>
            </button>
          </div>
          <p>Drag the titlebar, resize the edges, or press Escape.</p>
          <button type="button" style={{ display: 'block', marginInlineStart: 'auto' }} onClick={() => dialogEl?.close('ok')}>OK</button>
        </dialog>
      </rc-dialog>
      <rc-dialog ref={(el) => setConfirmEl(el as RCDialogRef | null)}>
        <dialog aria-label="Confirm delete" style={{ maxInlineSize: '24rem' }}>
          <p style={{ marginBlockStart: 0 }}>
            This will permanently delete the recipe. Continue?
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => confirmEl?.close('cancel')}>Cancel</button>
            <button type="button" onClick={() => confirmEl?.close('delete')}>Delete</button>
          </div>
        </dialog>
      </rc-dialog>
      <EventLog entries={[...log, ...confirmLog]} />
    </DemoFrame>
  );
}

export function DisclosureDemo() {
  const disclosureRef = useRef<RCDisclosureRef>(null);

  return (
    <DemoFrame>
      <rc-disclosure ref={disclosureRef}>
        <details>
          <summary>Shipping details</summary>
          <p>Content remains in the native details element.</p>
        </details>
      </rc-disclosure>
      <p>
        <button type="button" onClick={() => { if (disclosureRef.current) disclosureRef.current.open = true; }}>
          Open
        </button>{' '}
        <button type="button" onClick={() => { if (disclosureRef.current) disclosureRef.current.open = false; }}>
          Close
        </button>
      </p>
    </DemoFrame>
  );
}

export function FabDemo() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  return (
    <DemoFrame>
      <div
        ref={scrollerRef}
        style={{
          position: 'relative',
          blockSize: '18rem',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Tall inner content to enable scrolling */}
        <div
          style={{
            blockSize: '54rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>
            ↓ Scroll down to reveal the back-to-top button
          </p>
        </div>

        {/*
         * Zero-height sticky trap. Sticks at bottom:0 of the scroll viewport so
         * absolutely-positioned FABs inside it stay visually pinned to the
         * container's bottom corner while remaining inside the scroll container
         * (which is required for scroll(nearest block) and _findScrollTarget()).
         */}
        <div style={{ position: 'sticky', bottom: 0, blockSize: 0 }}>
          {/* Back-to-top FAB — hidden until 100 px into the demo scroll */}
          <rc-fab
            scroll-reveal
            style={{
              '--rc-fab-position': 'absolute',
              '--rc-fab-scroll-threshold': '100px',
              '--rc-fab-scroll-timeline': 'scroll(nearest block)',
            } as CSSProperties}
          >
            <button
              type="button"
              aria-label="Back to top"
              onClick={() => scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              ↑
            </button>
          </rc-fab>

          {/* Extended FAB — always visible */}
          <rc-fab
            position="bottom-start"
            style={{ '--rc-fab-position': 'absolute' } as CSSProperties}
          >
            <button type="button">
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              Create
            </button>
          </rc-fab>
        </div>
      </div>
    </DemoFrame>
  );
}

export function ListboxDemo() {
  const [listboxEl, setListboxEl] = useState<RCListboxRef | null>(null);
  const seedListbox = useCallback((listbox: RCListboxRef | null) => {
    setListboxEl(listbox);
    if (!listbox) return;

    async function applyOptions() {
      if (typeof customElements !== 'undefined') {
        await customElements.whenDefined('rc-listbox');
      }

      if (!listbox.isConnected) return;

      listbox.options = [
        { value: 'apples', label: 'Apples' },
        { value: 'berries', label: 'Berries' },
        { value: 'citrus', label: 'Citrus' },
        { value: 'dates', label: 'Dates', disabled: true },
        { value: 'elderflower', label: 'Elderflower' },
        { value: 'figs', label: 'Figs' },
        { value: 'grapes', label: 'Grapes' },
      ];
      listbox.setSelectedValues(['berries']);
    }

    void applyOptions();
  }, []);
  const log = useEventLog<{
    optionValue: string;
    selected: boolean;
    selectedValues: string[];
  }>(
    listboxEl,
    'rc-listbox-change',
    ({ optionValue, selected, selectedValues }) =>
      `${selected ? 'Selected' : 'Deselected'} ${optionValue}; current: ${selectedValues.join(', ') || '(none)'}`,
  );

  return (
    <DemoFrame>
      <label className="demo-col" style={{ marginBlockEnd: '0.5rem' }}>
        <span>Filter</span>
        <input
          type="search"
          placeholder="Type to filter…"
          aria-label="Filter fruit options"
          onChange={(e) => {
            const text = e.currentTarget.value;
            if (!listboxEl) return;
            text ? listboxEl.filterOptions(text) : listboxEl.clearFilter();
          }}
        />
      </label>
      <rc-listbox
        ref={seedListbox}
        multiple
        checkmark
        tabIndex={0}
        aria-label="Fruit choices"
        style={{ maxHeight: '12rem', border: '1px solid ButtonBorder' }}
      ></rc-listbox>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

const MARKDOWN_EDITOR_DEMO_CONTENT = `\
# Getting Started

A **rich** and *source* Markdown editor backed by a native \`<textarea>\`. Toggle modes with the toolbar's source button or \`Ctrl+Shift+S\`.

## Inline Formatting

Use **bold**, *italic*, ~~strikethrough~~, and \`inline code\`. Links like [Markdown Guide](https://markdownguide.org) are clickable in rich mode. Underline uses <u>HTML passthrough</u>.

## Lists

- Unordered item
- Another item

1. First step
2. Second step

## Code Block

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

> Switch to source mode to see the markdown highlighted in color.
`;

export function MarkdownEditorDemo() {
  const [editorEl, setEditorEl] = useState<HTMLElement | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!editorEl) return;

    const handleChange = (e: Event) => {
      const { value = '' } = (e as CustomEvent<{ value?: string }>).detail;
      const preview = value.slice(0, 40).replace(/\n/g, '↵');
      setLog((prev) => [`rc-change -> ${preview}`, ...prev].slice(0, 8));
    };

    const handleModeChange = (e: Event) => {
      const { mode } = (e as CustomEvent<{ mode: string }>).detail;
      setLog((prev) => [`rc-mode-change -> ${mode}`, ...prev].slice(0, 8));
    };

    editorEl.addEventListener('rc-change', handleChange);
    editorEl.addEventListener('rc-mode-change', handleModeChange);

    return () => {
      editorEl.removeEventListener('rc-change', handleChange);
      editorEl.removeEventListener('rc-mode-change', handleModeChange);
    };
  }, [editorEl]);

  return (
    <DemoFrame>
      <rc-markdown-editor ref={(el) => setEditorEl(el as HTMLElement | null)}>
        <textarea defaultValue={MARKDOWN_EDITOR_DEMO_CONTENT} />
      </rc-markdown-editor>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function MenuDemo() {
  const menuRef = useRef<RCMenuRef>(null);
  const log = useEventLog<{ value?: string }>(
    menuRef,
    'rc-menu-activate',
    ({ value }) => `rc-menu-activate -> ${value ?? '(no value)'}`,
  );

  return (
    <DemoFrame>
      <rc-menu ref={menuRef} label="Example menu">
        <button type="button" value="new">New recipe</button>
        <button type="button" value="duplicate">Duplicate</button>
        <button type="button" value="delete" disabled>Delete</button>
      </rc-menu>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function MenuButtonDemo() {
  const [menuButtonEl, setMenuButtonEl] = useState<HTMLElement | null>(null);
  const setMenuButtonRef = useCallback((element: HTMLElement | null) => {
    setMenuButtonEl(element);
  }, []);
  const toggleLog = useEventLog<{ open: boolean }>(
    menuButtonEl,
    'rc-menu-button-toggle',
    ({ open }) => `rc-menu-button-toggle -> ${open ? 'open' : 'closed'}`,
  );
  const activateLog = useEventLog<{ value?: string; checked?: string }>(
    menuButtonEl,
    'rc-menu-activate',
    ({ checked, value }) =>
      `rc-menu-activate -> ${value ?? '(no value)'}${checked ? ` (${checked})` : ''}`,
  );

  return (
    <DemoFrame>
      <rc-menu-button ref={setMenuButtonRef}>
        <button slot="trigger" type="button">Actions</button>
        <rc-menu label="Actions">
          <button type="button" value="edit">
            <span>Edit</span>
            <span data-menu-shortcut>Ctrl+E</span>
          </button>
          <button type="button" value="share">Share</button>
          <hr />
          <button type="button" role="menuitemcheckbox" aria-checked="true" value="show-details">
            Show details
          </button>
          <button type="button" value="more" aria-haspopup="menu">More actions</button>
          <button type="button" disabled>Archive</button>
        </rc-menu>
      </rc-menu-button>
      <EventLog entries={[...activateLog, ...toggleLog]} />
    </DemoFrame>
  );
}

export function MenubarDemo() {
  const [menubarEl, setMenubarEl] = useState<HTMLElement | null>(null);
  const setMenubarRef = useCallback((element: HTMLElement | null) => {
    setMenubarEl(element);
  }, []);
  const log = useEventLog<{ value?: string; checked?: string }>(
    menubarEl,
    'rc-menu-activate',
    ({ checked, value }) =>
      `rc-menu-activate -> ${value ?? '(no value)'}${checked ? ` (${checked})` : ''}`,
  );

  return (
    <DemoFrame>
      <rc-menubar ref={setMenubarRef} label="Recipe menu">
        <rc-menu-button>
          <button slot="trigger" type="button">File</button>
          <rc-menu label="File">
            <button type="button" value="new">
              <span>New</span>
              <span data-menu-shortcut>Ctrl+N</span>
            </button>
            <button type="button" value="open">
              <span>Open</span>
              <span data-menu-shortcut>Ctrl+O</span>
            </button>
            <hr />
            <button type="button" value="close" disabled>Close</button>
          </rc-menu>
        </rc-menu-button>
        <rc-menu-button>
          <button slot="trigger" type="button">Edit</button>
          <rc-menu label="Edit">
            <button type="button" value="undo">
              <span>Undo</span>
              <span data-menu-shortcut>Ctrl+Z</span>
            </button>
            <button type="button" value="redo">
              <span>Redo</span>
              <span data-menu-shortcut>Ctrl+Y</span>
            </button>
          </rc-menu>
        </rc-menu-button>
        <rc-menu-button>
          <button slot="trigger" type="button">View</button>
          <rc-menu label="View">
            <button type="button" role="menuitemcheckbox" aria-checked="true" value="show-notes">
              Show notes
            </button>
            <button type="button" role="menuitemcheckbox" aria-checked="false" value="compact-layout">
              Compact layout
            </button>
            <div role="group" aria-label="Sort order">
              <div data-group-label>Sort order</div>
              <button type="button" role="menuitemradio" aria-checked="true" value="sort-recent">
                Recent
              </button>
              <button type="button" role="menuitemradio" aria-checked="false" value="sort-name">
                Name
              </button>
            </div>
          </rc-menu>
        </rc-menu-button>
      </rc-menubar>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function RangeSliderDemo() {
  const sliderRef = useRef<RCRangeSliderRef>(null);
  const log = useEventLog<{ value: [number, number] }>(
    sliderRef,
    'rc-range-slider-change',
    ({ value }) => `rc-range-slider-change -> ${value.join(' - ')}`,
  );

  return (
    <DemoFrame>
      <rc-range-slider ref={sliderRef} display="inline-end">
        <input type="range" min="0" max="100" defaultValue="20" aria-label="Minimum price" />
        <input type="range" min="0" max="100" defaultValue="80" aria-label="Maximum price" />
      </rc-range-slider>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function SearchBarDemo() {
  const [searchEl, setSearchEl] = useState<RCSearchBarRef | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!searchEl) return;

    const onInput = (e: Event) => {
      const { value } = (e as CustomEvent<{ value: string }>).detail;
      setLog((prev) => [`rc-search-bar-input -> ${value}`, ...prev].slice(0, 8));
    };

    const onClear = () => {
      setLog((prev) => ['rc-search-bar-clear', ...prev].slice(0, 8));
    };

    searchEl.addEventListener('rc-search-bar-input', onInput);
    searchEl.addEventListener('rc-search-bar-clear', onClear);

    return () => {
      searchEl.removeEventListener('rc-search-bar-input', onInput);
      searchEl.removeEventListener('rc-search-bar-clear', onClear);
    };
  }, [searchEl]);

  return (
    <DemoFrame>
      <rc-search-bar ref={setSearchEl}>
        <span slot="leading" aria-hidden="true" className="material-symbols-outlined">search</span>
        <input type="search" name="q" defaultValue="tomato" aria-label="Search recipes" />
      </rc-search-bar>
      <p>
        <button type="button" onClick={() => { if (searchEl) searchEl.value = 'pasta'; }}>
          Set pasta
        </button>{' '}
        <button type="button" onClick={() => { if (searchEl) searchEl.value = ''; }}>
          Clear
        </button>
      </p>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function SliderDemo() {
  const sliderRef = useRef<RCSliderRef>(null);
  const log = useEventLog<{ value: number }>(
    sliderRef,
    'rc-slider-change',
    ({ value }) => `rc-slider-change -> ${value}`,
  );

  return (
    <DemoFrame>
      <rc-slider ref={sliderRef} display="inline-end">
        <input type="range" min="0" max="100" defaultValue="64" aria-label="Priority" />
      </rc-slider>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function SplitterDemo() {
  return (
    <DemoFrame>
      <rc-splitter label="Preview panes" style={{ blockSize: '12rem', border: '1px solid ButtonBorder' }}>
        <div style={{ padding: '0.75rem' }}>Recipe</div>
        <div slot="secondary" style={{ padding: '0.75rem' }}>Notes</div>
      </rc-splitter>
    </DemoFrame>
  );
}

export function TextareaDemo() {
  return (
    <DemoFrame>
      <rc-textarea label="Notes" line-numbers>
        <textarea defaultValue={'TODO: test seasoning\nSimmer until tender.'} />
      </rc-textarea>
    </DemoFrame>
  );
}

// ── rc-textarea feature demos ─────────────────────────────────────────────────

export function TextareaBasicDemo() {
  return (
    <DemoFrame>
      <rc-textarea auto-grow>
        <textarea
          rows={4}
          aria-label="Text editor"
          defaultValue={
            'The woods are lovely, dark and deep,\n' +
            'But I have promises to keep,\n' +
            'And miles to go before I sleep.\n\n' +
            '— Robert Frost'
          }
        />
      </rc-textarea>
    </DemoFrame>
  );
}

const MARKDOWN_SEED = '# Shopping list\n\n- **Carrots** — 1 bunch\n- *Ginger* — 2 cm piece\n- Garlic — 4 cloves\n\n> Buy organic where possible.';

export function TextareaMarkdownDemo() {
  const [editor, setEditor] = useState<any>(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!editor) return;

    const plugin = createMarkdownPlugin();
    editor.usePlugin(plugin);
    setPreview(plugin.getPreviewHtml(MARKDOWN_SEED));

    const onchange = (e: Event) => {
      const value = (e as CustomEvent<{ value: string }>).detail.value;
      setPreview(plugin.getPreviewHtml(value));
    };

    editor.addEventListener('rc-textarea-change', onchange);
    return () => editor.removeEventListener('rc-textarea-change', onchange);
  }, [editor]);

  return (
    <DemoFrame>
      <rc-textarea ref={setEditor} line-numbers auto-grow>
        <textarea rows={7} aria-label="Markdown editor" defaultValue={MARKDOWN_SEED} />
      </rc-textarea>
      {preview && (
        <div
          style={{ padding: '0.75em 1em', borderTop: '1px solid ButtonBorder' }}
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      )}
    </DemoFrame>
  );
}

const RUST_SNIPPET = `struct Matrix {
    data: Vec<Vec<f64>>,
    rows: usize,
    cols: usize,
}

impl Matrix {
    fn new(rows: usize, cols: usize) -> Self {
        Matrix {
            data: vec![vec![0.0; cols]; rows],
            rows,
            cols,
        }
    }

    fn get(&self, row: usize, col: usize) -> f64 {
        self.data[row][col]
    }
}

fn main() {
    let m = Matrix::new(3, 3);
    // Access element at (1, 1)
    println!("m[1][1] = {}", m.get(1, 1));
}`;

const HLJS_DARK_CSS = `
  .hljs-keyword, .hljs-type { color: #cba6f7; }
  .hljs-string { color: #a6e3a1; }
  .hljs-number { color: #fab387; }
  .hljs-comment { color: #6c7086; font-style: italic; }
  .hljs-title, .hljs-title.function_ { color: #89b4fa; font-weight: bold; }
  .hljs-built_in { color: #89dceb; }
  .hljs-literal { color: #f5c2e7; }
  .hljs-variable, .hljs-punctuation { color: #cdd6f4; }
  .hljs-operator { color: #89dceb; }
`;

export function TextareaHljsDemo() {
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    if (!editor) return;

    editor.usePlugin({
      mount(api: any) {
        api.adoptStyleSheet(HLJS_DARK_CSS);
      },
      highlight(value: string) {
        return hljs.highlight(value, { language: 'rust' }).value;
      },
    });
  }, [editor]);

  return (
    <DemoFrame>
      <rc-textarea
        ref={setEditor}
        line-numbers
        auto-grow
        style={{
          '--rc-textarea-font-family': "'Fira Code', 'Cascadia Code', monospace",
          '--rc-textarea-font-size': '13px',
          '--rc-textarea-background': '#1e1e2e',
          '--rc-textarea-color': '#cdd6f4',
          '--rc-textarea-caret-color': '#89b4fa',
          '--rc-textarea-border': '1px solid #313244',
          '--rc-textarea-active-line-bg': 'rgba(255, 255, 255, 0.04)',
          '--rc-textarea-gutter-bg': '#181825',
          '--rc-textarea-gutter-color': '#6c7086',
          '--rc-textarea-gutter-border': '1px solid #313244',
        } as CSSProperties}
      >
        <textarea rows={12} aria-label="Rust code editor" defaultValue={RUST_SNIPPET} />
      </rc-textarea>
    </DemoFrame>
  );
}

export function ToolbarDemo() {
  const [clicked, setClicked] = useState('Nothing clicked yet.');

  return (
    <DemoFrame>
      <rc-toolbar label="Formatting">
        <button type="button" aria-label="Bold" onClick={() => setClicked('Bold')}>
          <span className="material-symbols-outlined" aria-hidden="true">format_bold</span>
        </button>
        <button type="button" aria-label="Italic" onClick={() => setClicked('Italic')}>
          <span className="material-symbols-outlined" aria-hidden="true">format_italic</span>
        </button>
        <hr />
        <button type="button" aria-label="Link" onClick={() => setClicked('Link')}>
          <span className="material-symbols-outlined" aria-hidden="true">link</span>
        </button>
      </rc-toolbar>
      <p>{clicked}</p>
    </DemoFrame>
  );
}

export function TransferListDemo() {
  const transferRef = useRef<RCTransferListRef>(null);
  const [compact, setCompact] = useState(false);
  const log = useEventLog<RCTransferListChangeDetail>(
    transferRef,
    'rc-transfer-list-change',
    ({ selected }) =>
      `rc-transfer-list-change -> ${selected.map(({ label }) => label).join(', ') || '(none)'}`,
  );

  return (
    <DemoFrame>
      <label>
        <input
          type="checkbox"
          checked={compact}
          onChange={(event) => setCompact(event.currentTarget.checked)}
        />{' '}
        Compact layout
      </label>
      <rc-transfer-list ref={transferRef} multiple compact={compact ? true : undefined}>
        <select multiple aria-label="Available sections">
          <option value="breakfast">Breakfast</option>
          <option value="dinner" selected>Dinner</option>
          <option value="dessert">Dessert</option>
        </select>
      </rc-transfer-list>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

const VC_CONTENT_W = 4000;
const VC_CONTENT_H = 3000;
const VC_MINOR = 100;
const VC_MAJOR = 500;

export function VirtualCanvasDemo() {
  const [vcEl, setVcEl] = useState<Element | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLSpanElement | null>(null);
  const dotsRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    if (!vcEl) return;

    const vc = vcEl as RCVirtualCanvasRef;
    vc.contentWidth = VC_CONTENT_W;
    vc.contentHeight = VC_CONTENT_H;

    function drawGrid(e: Event) {
      const { viewRect } = (e as CustomEvent<RCVirtualCanvasRenderDetail>).detail;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleX = vc.canvasScaleX;
      const scaleY = vc.canvasScaleY;
      const viewW = viewRect.width / scaleX;
      const viewH = viewRect.height / scaleY;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scaleX, scaleY);

      // Minor grid lines
      ctx.beginPath();
      ctx.strokeStyle = '#dde1e7';
      ctx.lineWidth = 1;
      const minorX0 = Math.floor(viewRect.x / VC_MINOR) * VC_MINOR;
      const minorY0 = Math.floor(viewRect.y / VC_MINOR) * VC_MINOR;
      for (let x = minorX0; x <= viewRect.x + viewW + VC_MINOR; x += VC_MINOR) {
        ctx.moveTo(x - viewRect.x, 0);
        ctx.lineTo(x - viewRect.x, viewH);
      }
      for (let y = minorY0; y <= viewRect.y + viewH + VC_MINOR; y += VC_MINOR) {
        ctx.moveTo(0, y - viewRect.y);
        ctx.lineTo(viewW, y - viewRect.y);
      }
      ctx.stroke();

      // Major grid lines
      ctx.beginPath();
      ctx.strokeStyle = '#a8b0bc';
      ctx.lineWidth = 2;
      const majorX0 = Math.floor(viewRect.x / VC_MAJOR) * VC_MAJOR;
      const majorY0 = Math.floor(viewRect.y / VC_MAJOR) * VC_MAJOR;
      for (let x = majorX0; x <= viewRect.x + viewW + VC_MAJOR; x += VC_MAJOR) {
        ctx.moveTo(x - viewRect.x, 0);
        ctx.lineTo(x - viewRect.x, viewH);
      }
      for (let y = majorY0; y <= viewRect.y + viewH + VC_MAJOR; y += VC_MAJOR) {
        ctx.moveTo(0, y - viewRect.y);
        ctx.lineTo(viewW, y - viewRect.y);
      }
      ctx.stroke();

      // Coordinate labels at major intersections
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      for (let x = majorX0; x <= viewRect.x + viewW + VC_MAJOR; x += VC_MAJOR) {
        for (let y = majorY0; y <= viewRect.y + viewH + VC_MAJOR; y += VC_MAJOR) {
          ctx.fillText(`${x},${y}`, x - viewRect.x + 4, y - viewRect.y + 4);
        }
      }

      // Dots placed via clicks
      ctx.fillStyle = '#e53935';
      for (const dot of dotsRef.current) {
        const px = dot.x - viewRect.x;
        const py = dot.y - viewRect.y;
        if (px >= -8 && px <= viewW + 8 && py >= -8 && py <= viewH + 8) {
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    function handlePointer(e: Event) {
      const { type, contentX, contentY } = (e as CustomEvent<RCVirtualCanvasPointerDetail>).detail;
      if (overlayRef.current) {
        overlayRef.current.textContent = `${Math.round(contentX)}, ${Math.round(contentY)}`;
      }
      if (type === 'click') {
        dotsRef.current.push({ x: contentX, y: contentY });
        vc.requestRender();
      }
    }

    vcEl.addEventListener('rc-virtual-canvas-render', drawGrid);
    vcEl.addEventListener('rc-virtual-canvas-pointer', handlePointer);

    return () => {
      vcEl.removeEventListener('rc-virtual-canvas-render', drawGrid);
      vcEl.removeEventListener('rc-virtual-canvas-pointer', handlePointer);
    };
  }, [vcEl]);

  return (
    <DemoFrame>
      <rc-virtual-canvas
        ref={(el) => setVcEl(el)}
        render-mode="viewport-change"
        style={{ display: 'block', blockSize: '14rem', inlineSize: '100%' }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
        <span
          ref={overlayRef}
          slot="overlay"
          style={{
            display: 'inline-block',
            margin: '6px',
            padding: '2px 6px',
            background: 'Canvas',
            color: 'CanvasText',
            border: '1px solid ButtonBorder',
            borderRadius: '3px',
            font: '11px/1.4 monospace',
            pointerEvents: 'none',
          } as CSSProperties}
        >
          0, 0
        </span>
      </rc-virtual-canvas>
    </DemoFrame>
  );
}

export function FormDataDemo() {
  const [output, setOutput] = useState('Submit to inspect FormData.');

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const lines = Array.from(data.entries()).map(([key, value]) => `${key}: ${value}`);

    setOutput(lines.join('\n') || '(empty)');
  };

  return (
    <DemoFrame>
      <form onSubmit={handleSubmit}>
        <label className="demo-col">
          <span>Status</span>
          <rc-select>
            <select name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </rc-select>
        </label>
        <button type="submit">Submit</button>
      </form>
      <pre className="demo-form-output">{output}</pre>
    </DemoFrame>
  );
}
