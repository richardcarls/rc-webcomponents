import cemData from '../../../dist/custom-elements.json';
import styles from './ApiTable.module.css';

interface TypeRef {
  text: string;
}

interface Parameter {
  name: string;
  type?: TypeRef;
  optional?: boolean;
}

interface Member {
  kind: string;
  name: string;
  type?: TypeRef;
  default?: string;
  description?: string;
  attribute?: string;
  privacy?: string;
  readonly?: boolean;
  static?: boolean;
  parameters?: Parameter[];
  return?: TypeRef;
}

interface CemEvent {
  name: string;
  description?: string;
  type?: TypeRef;
}

interface Slot {
  name: string;
  description?: string;
}

interface CssProp {
  name: string;
  description?: string;
  default?: string;
}

interface CssPart {
  name: string;
  description?: string;
}

interface Declaration {
  kind: string;
  tagName?: string;
  name: string;
  description?: string;
  members?: Member[];
  events?: CemEvent[];
  slots?: Slot[];
  cssProperties?: CssProp[];
  cssParts?: CssPart[];
}

interface CemData {
  modules?: Array<{ declarations?: Declaration[] }>;
}

export interface ApiTableProps {
  tag: string;
}

function typeText(type?: TypeRef) {
  return type?.text || 'unknown';
}

function methodSignature(method: Member) {
  const params = method.parameters?.map((param) => {
    const optional = param.optional ? '?' : '';
    return `${param.name}${optional}: ${typeText(param.type)}`;
  }).join(', ') ?? '';
  const returnType = method.return?.text ? `: ${method.return.text}` : '';
  return `${method.name}(${params})${returnType}`;
}

function findDeclaration(tag: string) {
  const data = cemData as CemData;
  for (const mod of data.modules ?? []) {
    for (const declaration of mod.declarations ?? []) {
      if (declaration.tagName === tag) return declaration;
    }
  }
  return null;
}

function Empty({ children }: { children: string }) {
  return <p className={styles.empty}>{children}</p>;
}

export function ApiTable({ tag }: ApiTableProps) {
  const declaration = findDeclaration(tag);

  if (!declaration) {
    return (
      <div className={styles.notFound}>
        No API data found for <code>{tag}</code>. Run <code>yarn.cmd cem:analyze</code> first.
      </div>
    );
  }

  const publicFields = declaration.members?.filter(
    (member) =>
      member.kind === 'field' &&
      member.privacy !== 'private' &&
      member.privacy !== 'protected' &&
      !member.static,
  ) ?? [];
  const publicMethods = declaration.members?.filter(
    (member) =>
      member.kind === 'method' &&
      member.privacy !== 'private' &&
      member.privacy !== 'protected' &&
      !member.static,
  ) ?? [];

  return (
    <div className={styles.wrapper}>
      <section className={styles.section}>
        <h3>Properties</h3>
        {publicFields.length ? (
          <table>
            <thead>
              <tr><th>Property</th><th>Markup</th><th>Type</th><th>Default</th><th>Description</th></tr>
            </thead>
            <tbody>
              {publicFields.map((member) => (
                <tr key={member.name}>
                  <td><code>{member.name}</code></td>
                  <td>{member.attribute ? <code>{member.attribute}</code> : <span className={styles.na}>JS property only</span>}</td>
                  <td>{member.type?.text ? <code className={styles.type}>{member.type.text}</code> : <span className={styles.na}>Unknown</span>}</td>
                  <td>{member.default !== undefined ? <code>{member.default}</code> : <span className={styles.na}>Not specified</span>}</td>
                  <td>{member.description ?? 'No description provided.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>No public properties are documented in the custom elements manifest.</Empty>}
      </section>

      <section className={styles.section}>
        <h3>Methods</h3>
        {publicMethods.length ? (
          <table>
            <thead>
              <tr><th>Method</th><th>Description</th></tr>
            </thead>
            <tbody>
              {publicMethods.map((member) => (
                <tr key={member.name}>
                  <td><code>{methodSignature(member)}</code></td>
                  <td>{member.description ?? 'No description provided.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>No public methods are documented in the custom elements manifest.</Empty>}
      </section>

      <section className={styles.section}>
        <h3>Events</h3>
        {declaration.events?.length ? (
          <table>
            <thead>
              <tr><th>Event</th><th>Detail type</th><th>Description</th></tr>
            </thead>
            <tbody>
              {declaration.events.map((event) => (
                <tr key={event.name}>
                  <td><code>{event.name}</code></td>
                  <td>{event.type?.text ? <code className={styles.type}>{event.type.text}</code> : <span className={styles.na}>No detail type documented</span>}</td>
                  <td>{event.description ?? 'No description provided.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>No custom events are documented in the custom elements manifest.</Empty>}
      </section>

      <section className={styles.section}>
        <h3>Slots</h3>
        {declaration.slots?.length ? (
          <table>
            <thead>
              <tr><th>Name</th><th>Description</th></tr>
            </thead>
            <tbody>
              {declaration.slots.map((slot) => (
                <tr key={slot.name}>
                  <td><code>{slot.name || '(default)'}</code></td>
                  <td>{slot.description ?? 'No description provided.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>No slots are documented in the custom elements manifest.</Empty>}
      </section>

      <section className={styles.section}>
        <h3>CSS Custom Properties</h3>
        {declaration.cssProperties?.length ? (
          <table>
            <thead>
              <tr><th>Property</th><th>Default</th><th>Description</th></tr>
            </thead>
            <tbody>
              {declaration.cssProperties.map((prop) => (
                <tr key={prop.name}>
                  <td><code>{prop.name}</code></td>
                  <td>{prop.default ? <code>{prop.default}</code> : <span className={styles.na}>Not specified</span>}</td>
                  <td>{prop.description ?? 'No description provided.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>No CSS custom properties are documented in the custom elements manifest.</Empty>}
      </section>

      <section className={styles.section}>
        <h3>CSS Parts</h3>
        {declaration.cssParts?.length ? (
          <table>
            <thead>
              <tr><th>Part</th><th>Description</th></tr>
            </thead>
            <tbody>
              {declaration.cssParts.map((part) => (
                <tr key={part.name}>
                  <td><code>{part.name}</code></td>
                  <td>{part.description ?? 'No description provided.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>No CSS parts are documented in the custom elements manifest.</Empty>}
      </section>
    </div>
  );
}
