/**
 * Generates the aggregate's Blazor event bindings from the built element
 * typings (`yarn build` writes each package's `dist` declarations).
 *
 * Blazor delegates DOM events from the document and only passes the event
 * arguments a JavaScript initializer registers for each custom event name.
 * This script reads every `rc-*` entry of `HTMLElementEventMap` with the
 * TypeScript checker and writes two files:
 *
 * - `blazor/rc-webcomponents.lib.module.js`, a JS initializer that registers
 *   each event with `Blazor.registerCustomEventType` and passes its `detail`;
 * - `blazor/RcWebComponents.Events.cs`, an `EventArgs` class for each event and
 *   the `[EventHandler]` attributes that make `@onrc-select-change` typed.
 *
 * Detail values that cannot cross into .NET, such as elements and DOM events,
 * are left out on both sides.
 *
 *   node scripts/generate-blazor-bindings.mjs          write the files
 *   node scripts/generate-blazor-bindings.mjs --check  fail if they are stale
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'packages', 'rc-webcomponents', 'blazor');
const NAMESPACE = 'RcWebComponents';

/** Element packages whose declarations may add `rc-*` events. */
function elementPackages() {
  const aggregate = JSON.parse(
    readFileSync(join(ROOT, 'packages', 'rc-webcomponents', 'package.json'), 'utf8'),
  );

  return Object.keys(aggregate.dependencies ?? {})
    .filter((name) => name.startsWith('@rcarls/rc-'))
    .sort();
}

/**
 * Builds a program over every element package and returns the checker, the
 * detail type of each `rc-*` event, and the DOM types details may not carry.
 */
function loadEvents(packages) {
  const file = join(ROOT, '__rc-blazor-events.ts');
  const source = `${packages.map((name) => `import '${name}';`).join('\n')}
type Details = {
  [Name in Extract<keyof HTMLElementEventMap, \`rc-\${string}\`>]: HTMLElementEventMap[Name] extends CustomEvent<infer Detail> ? Detail : never;
};
export declare const details: Details;
export declare const node: Node;
export declare const event: Event;
`;
  const options = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
    types: [],
    skipLibCheck: true,
    noEmit: true,
    strict: true,
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  const fileExists = host.fileExists.bind(host);

  host.getSourceFile = (name, version, ...rest) =>
    name === file
      ? ts.createSourceFile(name, source, version)
      : getSourceFile(name, version, ...rest);

  host.fileExists = (name) => name === file || fileExists(name);

  const program = ts.createProgram([file], options, host);
  const errors = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);

  if (errors.length > 0) {
    throw new Error(
      ts.formatDiagnostics(errors, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: () => ROOT,
        getNewLine: () => '\n',
      }),
    );
  }

  const checker = program.getTypeChecker();
  const statements = program.getSourceFile(file).statements.slice(-3);
  const [details, node, event] = statements.map((statement) =>
    checker.getTypeAtLocation(statement.declarationList.declarations[0]),
  );

  return {
    checker,
    events: details
      .getProperties()
      .map((symbol) => ({ name: symbol.name, type: checker.getTypeOfSymbol(symbol) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    domTypes: [node, event],
  };
}

const pascalCase = (name) =>
  name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');

/** `rc-select-change` becomes `RcSelectChangeEventArgs`. */
export const eventArgsName = (event) => `${pascalCase(event)}EventArgs`;

const ANONYMOUS = new Set(['__type', '__object', 'Readonly', 'Partial', 'Required', 'Record']);

/**
 * Maps detail types to C#. A model is `{ classes, describe(type) }`, where
 * describe returns a C# type (`{ cs, nullable }`) or `undefined` for a value
 * that cannot be serialized.
 */
function createModel(checker, domTypes) {
  /** Named and structural classes, keyed by C# name. */
  const classes = new Map();
  const shapes = new Map();

  const isDom = (type) =>
    domTypes.some((domType) => checker.isTypeAssignableTo(type, domType)) ||
    type.getCallSignatures().length > 0;

  const is = (type, flag) => (type.flags & flag) !== 0;

  const aliasOf = (type) => {
    const symbol = type.aliasSymbol ?? type.getSymbol();

    return symbol && !ANONYMOUS.has(symbol.name) ? symbol.name : undefined;
  };

  const csName = (name) => `Rc${pascalCase(name.replace(/^RC/, ''))}`;
  const expand = (types) => [
    ...new Set(types.flatMap((type) => (type.isUnion() ? type.types : [type]))),
  ];
  const isObject = (type) =>
    is(type, ts.TypeFlags.Object | ts.TypeFlags.Intersection) && !checker.isArrayLikeType(type);

  /**
   * Describes an object type, or a union of object types, as one class. Nested
   * classes with the same fields are shared; an event's own class never is.
   */
  function objectClass(members, name, shared) {
    const properties = new Map();

    for (const member of members) {
      for (const symbol of checker.getPropertiesOfType(member)) {
        const optional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
        const entry = properties.get(symbol.name) ?? { types: [], optional: false, count: 0 };

        entry.types.push(checker.getTypeOfSymbol(symbol));
        entry.optional ||= optional;
        entry.count += 1;
        properties.set(symbol.name, entry);
      }
    }

    const fields = [];

    for (const [property, entry] of [...properties].sort(([a], [b]) => a.localeCompare(b))) {
      const distinct = [...new Set(entry.types)];
      const type = describeUnion(expand(distinct), property, {
        alias: distinct.length === 1 && distinct[0].isUnion() ? aliasOf(distinct[0]) : undefined,
      });

      if (!type) {
        continue;
      }

      fields.push({
        name: property,
        cs: type.cs,
        nullable: type.nullable || entry.optional || entry.count < members.length,
      });
    }

    const key = JSON.stringify(fields);

    if (shared && shapes.has(key)) {
      return shapes.get(key);
    }

    let unique = name;

    for (let index = 2; classes.has(unique); index += 1) {
      unique = `${name}${index}`;
    }

    classes.set(unique, fields);

    if (shared) {
      shapes.set(key, unique);
    }

    return unique;
  }

  function describeUnion(types, hint, { named, alias } = {}) {
    const empty = ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void;
    const nullable = types.some((type) => is(type, empty));
    const values = types.filter((type) => !is(type, empty));
    const serializable = values.filter((type) => !isDom(type));

    if (serializable.length === 0) {
      return undefined;
    }

    // A value that is sometimes an element still carries its other shapes.
    const optional = nullable || serializable.length < values.length;
    const every = (flag) => serializable.every((type) => is(type, flag));

    if (every(ts.TypeFlags.StringLike)) {
      return { cs: 'string', nullable: optional };
    }

    if (every(ts.TypeFlags.NumberLike)) {
      return { cs: 'double', nullable: optional };
    }

    if (every(ts.TypeFlags.BooleanLike)) {
      return { cs: 'bool', nullable: optional };
    }

    if (serializable.every((type) => checker.isArrayLikeType(type))) {
      const elements = serializable.flatMap((array) =>
        checker.isTupleType(array)
          ? checker.getTypeArguments(array)
          : [checker.getIndexTypeOfType(array, ts.IndexKind.Number)],
      );
      const distinct = [...new Set(elements)];
      const element = describeUnion(expand(distinct), hint, {
        alias: distinct.length === 1 && distinct[0].isUnion() ? aliasOf(distinct[0]) : undefined,
      });

      return element && { cs: `${element.cs}[]`, nullable: optional };
    }

    if (serializable.every(isObject)) {
      const single = serializable.length === 1 ? aliasOf(serializable[0]) : undefined;
      const name = named ?? csName(alias ?? single ?? hint);

      return { cs: objectClass(serializable, name, !named), nullable: optional };
    }

    // Mixed shapes, such as `string | string[]`, stay raw JSON.
    return { cs: 'System.Text.Json.JsonElement', nullable: optional };
  }

  return {
    classes,
    describe(type, named) {
      return describeUnion(expand([type]), named, { named });
    },
  };
}

/** Collects each event's C# arguments class, or `EventArgs` when its detail carries nothing. */
export function describeEvents({ checker, events, domTypes }) {
  const model = createModel(checker, domTypes);
  const described = events.map(({ name, type }) => {
    const empty =
      type.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void) ||
      checker.getPropertiesOfType(type).length === 0;
    const args = empty ? undefined : model.describe(type, eventArgsName(name));

    return { name, args: args && model.classes.get(args.cs)?.length ? args.cs : undefined };
  });

  return { events: described, classes: model.classes };
}

const CS_DEFAULTS = new Map([
  ['string', ' = "";'],
  ['bool', ''],
  ['double', ''],
  ['System.Text.Json.JsonElement', ''],
]);

function csProperty({ name, cs, nullable }) {
  const type = nullable ? `${cs}?` : cs;
  const initializer = nullable
    ? ''
    : (CS_DEFAULTS.get(cs) ?? (cs.endsWith('[]') ? ' = [];' : ' = new();'));

  return `    public ${type} ${pascalCase(name)} { get; set; }${initializer}`;
}

export function csharpBindings({ events, classes }) {
  const eventClasses = new Set(events.map((event) => event.args).filter(Boolean));
  const blocks = [...classes]
    .filter(([name, fields]) => fields.length > 0 || eventClasses.has(name))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, fields]) => {
      const base = eventClasses.has(name) ? ' : EventArgs' : '';

      return `public class ${name}${base}
{
${fields.map(csProperty).join('\n')}
}`;
    });
  const handlers = events.map(
    ({ name, args }) =>
      `[EventHandler("on${name}", typeof(${args ?? 'EventArgs'}), enableStopPropagation: true, enablePreventDefault: true)]`,
  );

  return `// Blazor event bindings for rc-webcomponents.
//
// Generated by \`yarn codegen:blazor\` from the element typings. Do not edit by
// hand: change the component source instead.
//
// Pair this file with rc-webcomponents.lib.module.js, which registers the
// same events in the browser. Element references and DOM events in a detail
// are not passed to .NET.

#nullable enable

using System;
using Microsoft.AspNetCore.Components;

namespace ${NAMESPACE};

${handlers.join('\n')}
// Razor discovers event attributes only on a class named EventHandlers.
public static class EventHandlers
{
}

${blocks.join('\n\n')}
`;
}

export function javascriptBindings({ events }) {
  return `/**
 * Blazor JavaScript initializer for rc-webcomponents events.
 *
 * Generated by \`yarn codegen:blazor\` from the element typings. Do not edit by
 * hand: change the component source instead.
 *
 * Copy it to your app's wwwroot as \`{AssemblyName}.lib.module.js\`, or call
 * \`registerRcEvents(blazor)\` from your own initializer. Pair it with
 * RcWebComponents.Events.cs.
 */

/** Every \`rc-*\` event the elements dispatch. All bubble and are composed. */
export const RC_EVENTS = [
${events.map(({ name }) => `  '${name}',`).join('\n')}
];

/** A JSON copy of an event detail without elements, DOM events, functions, or cycles. */
export function toEventArgs(value, seen = new WeakSet()) {
  const { Event, Node } = globalThis;

  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' ? undefined : value;
  }

  if (
    (typeof Node !== 'undefined' && value instanceof Node) ||
    (typeof Event !== 'undefined' && value instanceof Event) ||
    seen.has(value)
  ) {
    return undefined;
  }

  // Only the current path, so a value shared by two fields is kept in both.
  seen.add(value);

  try {
    if (Array.isArray(value)) {
      return value.map((item) => toEventArgs(item, seen) ?? null);
    }

    const args = {};

    for (const [key, item] of Object.entries(value)) {
      const converted = toEventArgs(item, seen);

      if (converted !== undefined) {
        args[key] = converted;
      }
    }

    return args;
  } finally {
    seen.delete(value);
  }
}

const registered = new WeakSet();

/**
 * Registers each \`rc-*\` event, passing its detail as the event arguments.
 * Blazor throws on a second registration, so later calls do nothing.
 */
export function registerRcEvents(blazor) {
  if (registered.has(blazor)) {
    return;
  }

  registered.add(blazor);

  for (const name of RC_EVENTS) {
    blazor.registerCustomEventType(name, {
      createEventArgs: (event) => toEventArgs(event.detail) ?? {},
    });
  }
}

/** Blazor Web App initializer. */
export function afterWebStarted(blazor) {
  registerRcEvents(blazor);
}

/** Blazor Server and WebAssembly initializer. */
export function afterStarted(blazor) {
  registerRcEvents(blazor);
}
`;
}

async function format(path, source) {
  const options = (await prettier.resolveConfig(path)) ?? {};

  return prettier.format(source, { ...options, filepath: path });
}

export async function generateBlazorBindings({ check = false } = {}) {
  const described = describeEvents(loadEvents(elementPackages()));
  const script = join(OUTPUT, 'rc-webcomponents.lib.module.js');
  const files = new Map([
    [script, await format(script, javascriptBindings(described))],
    [join(OUTPUT, 'RcWebComponents.Events.cs'), csharpBindings(described)],
  ]);
  const stale = [];

  for (const [path, contents] of files) {
    let current;

    try {
      current = readFileSync(path, 'utf8');
    } catch {
      current = undefined;
    }

    if (current !== contents) {
      stale.push(path);

      if (!check) {
        writeFileSync(path, contents);
      }
    }
  }

  return { eventCount: described.events.length, stale };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const check = process.argv.includes('--check');
  const { eventCount, stale } = await generateBlazorBindings({ check });

  if (check && stale.length > 0) {
    console.error(
      ['Blazor bindings are out of date. Run `yarn codegen:blazor`.', ...stale].join('\n'),
    );

    process.exitCode = 1;
  } else {
    console.log(
      `Blazor bindings cover ${eventCount} events (${stale.length} file(s) ${check ? 'stale' : 'written'}).`,
    );
  }
}
