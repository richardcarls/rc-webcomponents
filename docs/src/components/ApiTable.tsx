import type { ReactNode } from 'react';
import Heading from '@theme/Heading';

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
  const params =
    method.parameters
      ?.map((param) => {
        const optional = param.optional ? '?' : '';

        return `${param.name}${optional}: ${typeText(param.type)}`;
      })
      .join(', ') ?? '';
  const returnType = method.return?.text ? `: ${method.return.text}` : '';

  return `${method.name}(${params})${returnType}`;
}

function findDeclaration(tag: string) {
  const data = cemData as CemData;

  for (const mod of data.modules ?? []) {
    for (const declaration of mod.declarations ?? []) {
      if (declaration.tagName === tag) {
        return declaration;
      }
    }
  }

  return null;
}

interface ApiSection {
  id: string;
  title: string;
  entries: ApiEntry[];
}

interface ApiEntry {
  key: string;
  name: ReactNode;
  description: string;
  details?: Array<{ label: string; value: ReactNode }>;
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

  const publicFields =
    declaration.members?.filter(
      (member) =>
        member.kind === 'field' &&
        member.privacy !== 'private' &&
        member.privacy !== 'protected' &&
        !member.static,
    ) ?? [];
  const publicMethods =
    declaration.members?.filter(
      (member) =>
        member.kind === 'method' &&
        member.privacy !== 'private' &&
        member.privacy !== 'protected' &&
        !member.static,
    ) ?? [];
  const events = declaration.events ?? [];
  const slots = declaration.slots ?? [];
  const cssProperties = declaration.cssProperties ?? [];
  const cssParts = declaration.cssParts ?? [];

  // Ids carry an `api-` prefix so they never collide with a page heading such as `## Events`.
  const sections: ApiSection[] = [];

  if (publicFields.length) {
    sections.push({
      id: 'api-properties',
      title: 'Properties',
      entries: publicFields.map((member) => ({
        key: member.name,
        name: <code>{member.name}</code>,
        description: member.description ?? 'No description provided.',
        details: [
          {
            label: 'Markup',
            value: member.attribute ? (
              <code>{member.attribute}</code>
            ) : (
              <span className={styles.na}>JS property only</span>
            ),
          },
          {
            label: 'Type',
            value: member.type?.text ? (
              <code className={styles.type}>{member.type.text}</code>
            ) : (
              <span className={styles.na}>Unknown</span>
            ),
          },
          {
            label: 'Default',
            value:
              member.default !== undefined ? (
                <code>{member.default}</code>
              ) : (
                <span className={styles.na}>Not specified</span>
              ),
          },
        ],
      })),
    });
  }

  if (publicMethods.length) {
    sections.push({
      id: 'api-methods',
      title: 'Methods',
      entries: publicMethods.map((member) => ({
        key: member.name,
        name: <code>{methodSignature(member)}</code>,
        description: member.description ?? 'No description provided.',
      })),
    });
  }

  if (events.length) {
    sections.push({
      id: 'api-events',
      title: 'Events',
      entries: events.map((event) => ({
        key: event.name,
        name: <code>{event.name}</code>,
        description: event.description ?? 'No description provided.',
        details: [
          {
            label: 'Detail type',
            value: event.type?.text ? (
              <code className={styles.type}>{event.type.text}</code>
            ) : (
              <span className={styles.na}>No detail type documented</span>
            ),
          },
        ],
      })),
    });
  }

  if (slots.length) {
    sections.push({
      id: 'api-slots',
      title: 'Slots',
      entries: slots.map((slot) => ({
        key: slot.name,
        name: <code>{slot.name || '(default)'}</code>,
        description: slot.description ?? 'No description provided.',
      })),
    });
  }

  if (cssProperties.length) {
    sections.push({
      id: 'api-css-custom-properties',
      title: 'CSS Custom Properties',
      entries: cssProperties.map((prop) => ({
        key: prop.name,
        name: <code>{prop.name}</code>,
        description: prop.description ?? 'No description provided.',
        details: [
          {
            label: 'Default',
            value: prop.default ? (
              <code>{prop.default}</code>
            ) : (
              <span className={styles.na}>Not specified</span>
            ),
          },
        ],
      })),
    });
  }

  if (cssParts.length) {
    sections.push({
      id: 'api-css-parts',
      title: 'CSS Parts',
      entries: cssParts.map((part) => ({
        key: part.name,
        name: <code>{part.name}</code>,
        description: part.description ?? 'No description provided.',
      })),
    });
  }

  if (!sections.length) {
    return (
      <p className={styles.empty}>
        <code>{tag}</code> documents no properties, methods, events, slots, or styling hooks in the
        custom elements manifest.
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      {sections.length > 1 && (
        <nav className={styles.jumpLinks} aria-label={`${tag} API sections`}>
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>
      )}
      {sections.map((section) => (
        <section key={section.id} className={styles.section}>
          <Heading as="h3" id={section.id}>
            {section.title}
          </Heading>
          <dl className={styles.entries}>
            {section.entries.map((entry) => (
              <div key={entry.key} className={styles.entry}>
                <dt className={styles.name}>{entry.name}</dt>
                <dd className={styles.description}>
                  <p>{entry.description}</p>
                  {entry.details && (
                    <dl className={styles.details}>
                      {entry.details.map((detail) => (
                        <div key={detail.label}>
                          <dt>{detail.label}</dt>
                          <dd>{detail.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
