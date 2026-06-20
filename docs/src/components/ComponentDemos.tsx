import type { FormEvent, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { DemoFrame } from './DemoFrame';

type DetailEvent<T> = CustomEvent<T>;

function useEventLog<T>(
  ref: RefObject<HTMLElement | null>,
  eventName: string,
  format: (detail: T) => string,
) {
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const $element = ref.current;
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
  }, [eventName, format, ref]);

  return log;
}

function EventLog({ entries, placeholder = 'Events will appear here...' }: {
  entries: string[];
  placeholder?: string;
}) {
  return (
    <div className="demo-event-log">
      {entries.length
        ? entries.map((entry) => <p key={entry}>{entry}</p>)
        : <p className="demo-placeholder">{placeholder}</p>}
    </div>
  );
}

export function AppBarDemo() {
  const barRef = useRef<HTMLElement & { scrolled?: boolean }>(null);

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
  const comboRef = useRef<HTMLElement | null>(null);
  const log = useEventLog<{ value: string | string[] }>(
    comboRef,
    'rc-select-change',
    ({ value }) => `rc-select-change -> ${Array.isArray(value) ? value.join(', ') : value}`,
  );

  return (
    <DemoFrame>
      <div className="demo-row">
        <label className="demo-col">
          <span>Ingredient</span>
          <rc-combobox ref={comboRef} placeholder="Choose or create">
            <select slot="select" name="ingredient">
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
            <select slot="select" name="tags" multiple>
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
  const dialogRef = useRef<HTMLElement & { showModal: () => void; close: (value?: string) => void }>(null);
  const log = useEventLog<{ returnValue: string }>(
    dialogRef,
    'rc-dialog-close',
    ({ returnValue }) => `rc-dialog-close -> ${returnValue || '(empty)'}`,
  );

  return (
    <DemoFrame>
      <button type="button" onClick={() => dialogRef.current?.showModal()}>Open dialog</button>
      <rc-dialog ref={dialogRef} movable move-handle="[data-titlebar]" resize="both">
        <dialog aria-labelledby="dialog-demo-title">
          <div data-titlebar style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <strong id="dialog-demo-title" style={{ flex: 1 }}>Native dialog</strong>
            <button type="button" aria-label="Close" onClick={() => dialogRef.current?.close('dismiss')}>
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <p>Drag the titlebar, resize the edges, or press Escape.</p>
          <button type="button" onClick={() => dialogRef.current?.close('ok')}>OK</button>
        </dialog>
      </rc-dialog>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function DisclosureDemo() {
  const disclosureRef = useRef<HTMLElement & { open?: boolean }>(null);

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
  return (
    <DemoFrame>
      <div className="demo-row">
        <rc-fab aria-label="Create">
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
        </rc-fab>
        <rc-fab extended>
          <span className="material-symbols-outlined" aria-hidden="true">edit</span>
          <span>Compose</span>
        </rc-fab>
      </div>
    </DemoFrame>
  );
}

export function MarkdownEditorDemo() {
  const editorRef = useRef<HTMLElement | null>(null);
  const log = useEventLog<{ value?: string }>(
    editorRef,
    'rc-change',
    ({ value }) => `rc-change -> ${(value ?? '').slice(0, 32)}`,
  );

  return (
    <DemoFrame>
      <rc-markdown-editor ref={editorRef} label="Recipe notes">
        <textarea defaultValue={'# Carrot soup\n\nSimmer until tender.'} />
      </rc-markdown-editor>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function MenuDemo() {
  const menuRef = useRef<HTMLElement | null>(null);
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
  return (
    <DemoFrame>
      <rc-menu-button>
        <button slot="trigger" type="button">Actions</button>
        <rc-menu label="Actions">
          <button type="button">Edit</button>
          <button type="button">Share</button>
          <button type="button" disabled>Archive</button>
        </rc-menu>
      </rc-menu-button>
    </DemoFrame>
  );
}

export function MenubarDemo() {
  return (
    <DemoFrame>
      <rc-menubar label="Recipe menu">
        <rc-menu-button>
          <button slot="trigger" type="button">File</button>
          <rc-menu label="File">
            <button type="button">New</button>
            <button type="button">Open</button>
          </rc-menu>
        </rc-menu-button>
        <rc-menu-button>
          <button slot="trigger" type="button">Edit</button>
          <rc-menu label="Edit">
            <button type="button">Undo</button>
            <button type="button">Redo</button>
          </rc-menu>
        </rc-menu-button>
      </rc-menubar>
    </DemoFrame>
  );
}

export function RangeSliderDemo() {
  const sliderRef = useRef<HTMLElement | null>(null);
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
  const searchRef = useRef<HTMLElement & { value?: string }>(null);
  const log = useEventLog<{ value: string }>(
    searchRef,
    'rc-search-bar-input',
    ({ value }) => `rc-search-bar-input -> ${value}`,
  );

  return (
    <DemoFrame>
      <rc-search-bar ref={searchRef}>
        <input type="search" name="q" defaultValue="tomato" aria-label="Search recipes" />
      </rc-search-bar>
      <p>
        <button type="button" onClick={() => { if (searchRef.current) searchRef.current.value = 'pasta'; }}>
          Set pasta
        </button>{' '}
        <button type="button" onClick={() => { if (searchRef.current) searchRef.current.value = ''; }}>
          Clear
        </button>
      </p>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function SliderDemo() {
  const sliderRef = useRef<HTMLElement | null>(null);
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
  const transferRef = useRef<HTMLElement | null>(null);
  const log = useEventLog<{ selected: string[] }>(
    transferRef,
    'rc-transfer-list-change',
    ({ selected }) => `rc-transfer-list-change -> ${selected.join(', ')}`,
  );

  return (
    <DemoFrame>
      <rc-transfer-list ref={transferRef} multiple>
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

export function VirtualCanvasDemo() {
  return (
    <DemoFrame>
      <rc-virtual-canvas style={{ blockSize: '12rem', inlineSize: '100%' }}>
        <canvas width="640" height="320" />
        <span slot="overlay">Scrollable canvas surface</span>
      </rc-virtual-canvas>
    </DemoFrame>
  );
}

export function FormDataDemo() {
  const [output, setOutput] = useState('Submit to inspect FormData.');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
            <select slot="select" name="status">
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
