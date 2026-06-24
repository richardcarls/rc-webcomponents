import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { DemoFrame } from './DemoFrame';

type ComboboxCreateEvent = CustomEvent<{ text: string }>;
type ComboboxChangeEvent = CustomEvent<{ value: string | string[] }>;
type ComboboxElement = HTMLElement & { value: string | string[] | undefined };

function StateView({ rows }: { rows: [label: string, value: string][] }) {
  return (
    <div
      style={{
        marginTop: '0.6rem',
        padding: '0.4rem 0.6rem',
        fontSize: '0.8rem',
        fontFamily: 'monospace',
        background: 'Canvas',
        border: '1px solid ButtonBorder',
        borderRadius: '4px',
        lineHeight: 1.7,
      }}
    >
      {rows.map(([label, value]) => (
        <div key={label}>
          <span style={{ opacity: 0.55 }}>{label}: </span>
          {value}
        </div>
      ))}
    </div>
  );
}

/**
 * Validation demo — call preventDefault() only when the new text is invalid.
 * The default behavior (insert + select) runs for valid entries.
 */
export function ComboboxAllowCreateValidationDemo() {
  const [comboEl, setComboEl] = useState<ComboboxElement | null>(null);
  const [error, setError] = useState('');
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!comboEl) return;

    const handleCreate = (e: Event) => {
      const { text } = (e as ComboboxCreateEvent).detail;

      if (text.trim().length < 2) {
        e.preventDefault();
        setError(`"${text}" is too short — minimum 2 characters.`);
        return;
      }

      setError('');
      setLog((prev) => [`rc-combobox-create → "${text}"`, ...prev].slice(0, 6));
    };

    comboEl.addEventListener('rc-combobox-create', handleCreate);
    return () => comboEl.removeEventListener('rc-combobox-create', handleCreate);
  }, [comboEl]);

  return (
    <DemoFrame>
      <label className="demo-col">
        <span>Tags</span>
        <rc-combobox
          ref={(el) => setComboEl(el as ComboboxElement | null)}
          allow-create
          placeholder="Add a tag…"
        >
          <select name="tags" multiple>
            <option value="design">Design</option>
            <option value="engineering">Engineering</option>
            <option value="product">Product</option>
          </select>
        </rc-combobox>
      </label>
      {error && (
        <p style={{ color: 'red', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{error}</p>
      )}
      <div className="demo-event-log">
        {log.length
          ? log.map((entry) => <p key={entry}>{entry}</p>)
          : <p className="demo-placeholder">Create events will appear here…</p>}
      </div>
    </DemoFrame>
  );
}

const INITIAL_FRAMEWORKS = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
];

/**
 * React state demo — React owns the option list.
 * preventDefault() stops the component's default insertion. After React renders
 * the new <option>, a useEffect sets the selection programmatically.
 */
export function ComboboxCreateReactDemo() {
  const [comboEl, setComboEl] = useState<ComboboxElement | null>(null);
  const [options, setOptions] = useState(INITIAL_FRAMEWORKS);
  const [selection, setSelection] = useState<string[]>([]);
  // Holds the value to select after the next render; cleared in the post-render effect.
  const pendingValue = useRef<string | null>(null);

  useEffect(() => {
    if (!comboEl) return;

    const handleCreate = (e: Event) => {
      e.preventDefault(); // React manages options — block component insertion.
      const { text } = (e as ComboboxCreateEvent).detail;
      const value = text.trim().toLowerCase().replace(/\s+/g, '-');
      setOptions((prev) => [...prev, { value, label: text.trim() }]);
      pendingValue.current = value;
    };

    const handleChange = (e: Event) => {
      const { value } = (e as ComboboxChangeEvent).detail;
      setSelection(Array.isArray(value) ? value : value ? [value] : []);
    };

    comboEl.addEventListener('rc-combobox-create', handleCreate);
    comboEl.addEventListener('rc-select-change', handleChange);
    return () => {
      comboEl.removeEventListener('rc-combobox-create', handleCreate);
      comboEl.removeEventListener('rc-select-change', handleChange);
    };
  }, [comboEl]);

  // Runs after React renders the new <option> into the DOM, by which point
  // the combobox has processed slotchange and registered the option.
  useEffect(() => {
    const value = pendingValue.current;
    if (!value || !comboEl) return;
    pendingValue.current = null;

    const current = Array.isArray(comboEl.value) ? comboEl.value : comboEl.value ? [comboEl.value] : [];
    if (!current.includes(value)) {
      const next = [...current, value];
      comboEl.value = next;
      setSelection(next);
    }
  }, [options, comboEl]);

  return (
    <DemoFrame>
      <label className="demo-col">
        <span>Frameworks</span>
        <rc-combobox
          ref={(el) => setComboEl(el as ComboboxElement | null)}
          allow-create
          placeholder="Add a framework…"
        >
          <select name="frameworks" multiple>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </rc-combobox>
      </label>
      <StateView
        rows={[
          ['options', `[${options.map((o) => o.label).join(', ')}]`],
          ['selection', selection.length ? `[${selection.join(', ')}]` : '[]'],
        ]}
      />
    </DemoFrame>
  );
}

const INITIAL_LABELS = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'docs', label: 'Documentation' },
];

type LabelOption = { value: string; label: string };

/**
 * Form demo — options and pendingOptions are kept as separate lists.
 * Only persisted options live in `options`; session-created ones are in
 * `pendingOptions` and rendered separately. On submit, selected new options
 * are committed to `options` via setOptions and pending is cleared.
 * Reset discards pending options without committing them.
 */
export function ComboboxCreateFormDemo() {
  const [comboEl, setComboEl] = useState<ComboboxElement | null>(null);
  const [options, setOptions] = useState<LabelOption[]>(INITIAL_LABELS);       // permanent
  const [pendingOptions, setPendingOptions] = useState<LabelOption[]>([]);      // session-only
  const [output, setOutput] = useState('');
  const pendingValue = useRef<string | null>(null);

  useEffect(() => {
    if (!comboEl) return;

    const handleCreate = (e: Event) => {
      e.preventDefault(); // React renders all <option> elements — block component insertion.
      const { text } = (e as ComboboxCreateEvent).detail;
      const value = text.trim().toLowerCase().replace(/\s+/g, '-');
      setPendingOptions((prev) => [...prev, { value, label: text.trim() }]);
      pendingValue.current = value;
    };

    comboEl.addEventListener('rc-combobox-create', handleCreate);
    return () => comboEl.removeEventListener('rc-combobox-create', handleCreate);
  }, [comboEl]);

  // Runs after React renders the new pending <option>; selects it programmatically.
  useEffect(() => {
    const value = pendingValue.current;
    if (!value || !comboEl) return;
    pendingValue.current = null;

    const current = Array.isArray(comboEl.value) ? comboEl.value : comboEl.value ? [comboEl.value] : [];
    if (!current.includes(value)) {
      comboEl.value = [...current, value];
    }
  }, [pendingOptions, comboEl]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const selected = data.getAll('labels') as string[];
    const newlyCreated = pendingOptions.filter((o) => selected.includes(o.value));

    // Commit selected new options to permanent state:
    setOptions((prev) => [...prev, ...newlyCreated]);
    setPendingOptions([]);
    setOutput(selected.join(', ') || '(none)');
    if (comboEl) comboEl.value = [];
  };

  // Reset discards pending options without committing them.
  const handleReset = () => {
    setPendingOptions([]);
    setOutput('');
    if (comboEl) comboEl.value = [];
  };

  return (
    <DemoFrame>
      <form onSubmit={handleSubmit}>
        <label className="demo-col">
          <span>Labels</span>
          <rc-combobox
            ref={(el) => setComboEl(el as ComboboxElement | null)}
            allow-create
            placeholder="Choose or create…"
          >
            <select name="labels" multiple>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              {pendingOptions.map((opt) => (
                <option key={`p-${opt.value}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </rc-combobox>
        </label>
        <StateView
          rows={[
            ['options', `[${options.map((o) => o.label).join(', ')}]`],
            [
              'pending',
              pendingOptions.length
                ? `[${pendingOptions.map((o) => o.label).join(', ')}]  ← committed on submit`
                : '[]',
            ],
          ]}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button type="submit">Submit</button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
      {output && <pre className="demo-form-output">submitted: {output}</pre>}
    </DemoFrame>
  );
}
