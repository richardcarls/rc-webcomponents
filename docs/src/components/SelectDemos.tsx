import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { RCSelectRef, RCSelectChangeDetail } from '@rcarls/rc-webcomponents/react';
import { DemoFrame } from './DemoFrame';

function addLogLine(setter: (next: string[]) => void, lines: string[], line: string) {
  setter([line, ...lines].slice(0, 20));
}

export function SingleSelectDemo() {
  const [selectEl, setSelectEl] = useState<HTMLElement | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!selectEl) return;

    const handleChange = (event: Event) => {
      const { value } = (event as CustomEvent<RCSelectChangeDetail>).detail;
      setLog((current) => [`rc-select-change -> value: "${value}"`, ...current].slice(0, 20));
    };

    selectEl.addEventListener('rc-select-change', handleChange);
    return () => selectEl.removeEventListener('rc-select-change', handleChange);
  }, [selectEl]);

  return (
    <DemoFrame>
      <div className="demo-row">
        <div className="demo-col">
          <label>Country</label>
          <rc-select ref={(el) => setSelectEl(el as HTMLElement | null)} placeholder="Choose a country...">
            <select name="country">
              <option value="">Choose a country...</option>
              <option value="us">United States</option>
              <option value="ca">Canada</option>
              <option value="mx">Mexico</option>
              <option value="gb">United Kingdom</option>
              <option value="fr">France</option>
              <option value="de">Germany</option>
              <option value="jp">Japan</option>
              <option value="au">Australia</option>
              <option value="br">Brazil</option>
              <option value="in">India</option>
            </select>
          </rc-select>
        </div>
        <div className="demo-col">
          <label>Priority</label>
          <rc-select placeholder="Select priority...">
            <select name="priority">
              <option value="">Select priority...</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical" disabled>Critical (unavailable)</option>
            </select>
          </rc-select>
        </div>
      </div>
      <div className="demo-event-log">
        {log.length ? log.map((message) => <p key={message}>{message}</p>) : <p className="demo-placeholder">Events will appear here...</p>}
      </div>
    </DemoFrame>
  );
}

export function MultiSelectDemo() {
  const [selectEl, setSelectEl] = useState<HTMLElement | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!selectEl) return;

    const handleChange = (event: Event) => {
      const { value } = (event as CustomEvent<RCSelectChangeDetail>).detail;
      const values = Array.isArray(value) ? value.join(', ') : value;
      setLog((current) => [`rc-select-change -> value: [${values}]`, ...current].slice(0, 20));
    };

    selectEl.addEventListener('rc-select-change', handleChange);
    return () => selectEl.removeEventListener('rc-select-change', handleChange);
  }, [selectEl]);

  return (
    <DemoFrame>
      <div className="demo-row">
        <div className="demo-col">
          <label>Tags</label>
          <rc-select ref={(el) => setSelectEl(el as HTMLElement | null)} placeholder="Add tags...">
            <select name="tags" multiple>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="docs">Documentation</option>
              <option value="design">Design</option>
              <option value="performance">Performance</option>
              <option value="security">Security</option>
              <option value="accessibility">Accessibility</option>
              <option value="testing">Testing</option>
            </select>
          </rc-select>
        </div>
      </div>
      <div className="demo-event-log">
        {log.length ? log.map((message) => <p key={message}>{message}</p>) : <p className="demo-placeholder">Events will appear here...</p>}
      </div>
    </DemoFrame>
  );
}

export function SelectFormDemo() {
  const [output, setOutput] = useState('FormData will appear here after submit.');

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lines: string[] = [];
    for (const [key, value] of data.entries()) lines.push(`${key}: ${value}`);
    setOutput(lines.join('\n') || '(empty)');
  };

  return (
    <DemoFrame>
      <form onSubmit={handleSubmit}>
        <div className="demo-row">
          <div className="demo-col">
            <label htmlFor="docusaurus-form-name">Name</label>
            <input id="docusaurus-form-name" type="text" name="name" placeholder="Your name" />
          </div>
          <div className="demo-col">
            <label>Role</label>
            <rc-select placeholder="Select a role...">
              <select name="role">
                <option value="">Select a role...</option>
                <option value="admin">Administrator</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </rc-select>
          </div>
        </div>
        <button type="submit">Submit</button>
      </form>
      <pre className="demo-form-output">{output}</pre>
    </DemoFrame>
  );
}

export function DynamicOptionsDemo() {
  const selectRef = useRef<RCSelectRef>(null);
  const countRef = useRef(2);

  const addDynamicOption = () => {
    const nativeSelect = selectRef.current?.querySelector('select');
    if (!nativeSelect) return;
    countRef.current += 1;
    const option = document.createElement('option');
    option.value = `item${countRef.current}`;
    option.text = `Item ${countRef.current}`;
    nativeSelect.add(option);
  };

  return (
    <DemoFrame>
      <div className="demo-row">
        <rc-select ref={selectRef} placeholder="Choose an item...">
          <select name="dynamic">
            <option value="">Choose an item...</option>
            <option value="item1">Item 1</option>
            <option value="item2">Item 2</option>
          </select>
        </rc-select>
        <button type="button" onClick={addDynamicOption}>Add option</button>
      </div>
    </DemoFrame>
  );
}
