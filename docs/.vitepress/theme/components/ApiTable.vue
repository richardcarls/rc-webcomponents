<script setup lang="ts">
import { computed } from 'vue';

// Imported at build time; run `yarn cem:analyze` before starting the dev server.
// @ts-ignore — JSON import; Vite handles this natively
import cemData from '../../../../dist/custom-elements.json';

const props = defineProps<{ tag: string }>();

interface TypeRef { text: string }

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

const decl = computed<Declaration | null>(() => {
  const data = cemData as { modules?: Array<{ declarations?: Declaration[] }> };
  for (const mod of data.modules ?? []) {
    for (const d of mod.declarations ?? []) {
      if (d.tagName === props.tag) return d;
    }
  }
  return null;
});

const publicFields = computed(() =>
  decl.value?.members?.filter(
    (m) =>
      m.kind === 'field' &&
      m.privacy !== 'private' &&
      m.privacy !== 'protected' &&
      !m.static,
  ) ?? [],
);

const publicMethods = computed(() =>
  decl.value?.members?.filter(
    (m) =>
      m.kind === 'method' &&
      m.privacy !== 'private' &&
      m.privacy !== 'protected' &&
      !m.static,
  ) ?? [],
);

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
</script>

<template>
  <div v-if="!decl" class="api-not-found">
    <p>
      No API data found for <code>{{ tag }}</code>. Run
      <code>yarn cem:analyze</code> first.
    </p>
  </div>
  <div v-else class="api-table-wrapper">
    <!-- Properties -->
    <section class="api-section">
      <h3>Properties</h3>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Markup</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in publicFields" :key="m.name">
            <td><code>{{ m.name }}</code></td>
            <td>
              <code v-if="m.attribute">{{ m.attribute }}</code>
              <span v-else class="na">JS property only</span>
            </td>
            <td>
              <code v-if="m.type?.text" class="type">{{ m.type.text }}</code>
              <span v-else class="na">Unknown</span>
            </td>
            <td>
              <code v-if="m.default !== undefined">{{ m.default }}</code>
              <span v-else class="na">Not specified</span>
            </td>
            <td>{{ m.description ?? 'No description provided.' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!publicFields.length" class="api-empty">No public properties are documented in the custom elements manifest.</p>
    </section>

    <!-- Methods -->
    <section class="api-section">
      <h3>Methods</h3>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in publicMethods" :key="m.name">
            <td><code>{{ methodSignature(m) }}</code></td>
            <td>{{ m.description ?? 'No description provided.' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!publicMethods.length" class="api-empty">No public methods are documented in the custom elements manifest.</p>
    </section>

    <!-- Events -->
    <section class="api-section">
      <h3>Events</h3>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Detail type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ev in decl.events" :key="ev.name">
            <td><code>{{ ev.name }}</code></td>
            <td>
              <code v-if="ev.type?.text" class="type">{{ ev.type.text }}</code>
              <span v-else class="na">No detail type documented</span>
            </td>
            <td>{{ ev.description ?? 'No description provided.' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!decl.events?.length" class="api-empty">No custom events are documented in the custom elements manifest.</p>
    </section>

    <!-- Slots -->
    <section class="api-section">
      <h3>Slots</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sl in decl.slots" :key="sl.name">
            <td>
              <code>{{ sl.name || '(default)' }}</code>
            </td>
            <td>{{ sl.description ?? 'No description provided.' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!decl.slots?.length" class="api-empty">No slots are documented in the custom elements manifest.</p>
    </section>

    <!-- CSS Custom Properties -->
    <section class="api-section">
      <h3>CSS Custom Properties</h3>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cp in decl.cssProperties" :key="cp.name">
            <td><code>{{ cp.name }}</code></td>
            <td>
              <code v-if="cp.default">{{ cp.default }}</code>
              <span v-else class="na">Not specified</span>
            </td>
            <td>{{ cp.description ?? 'No description provided.' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!decl.cssProperties?.length" class="api-empty">No CSS custom properties are documented in the custom elements manifest.</p>
    </section>

    <!-- CSS Parts -->
    <section class="api-section">
      <h3>CSS Parts</h3>
      <table>
        <thead>
          <tr>
            <th>Part</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pt in decl.cssParts" :key="pt.name">
            <td><code>{{ pt.name }}</code></td>
            <td>{{ pt.description ?? 'No description provided.' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!decl.cssParts?.length" class="api-empty">No CSS parts are documented in the custom elements manifest.</p>
    </section>
  </div>
</template>

<style scoped>
.api-table-wrapper {
  max-width: 100%;
}

.api-table-wrapper :deep(h3) {
  font-size: 1rem;
  margin: 1.5rem 0 0.5rem;
  padding: 0;
  border: none;
}

.api-section {
  max-width: 100%;
  overflow-x: auto;
}

.api-table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.api-section:not(:has(tbody tr)) table {
  display: none;
}

.api-table-wrapper th,
.api-table-wrapper td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: 1px solid var(--vp-c-divider);
  vertical-align: top;
}

.api-table-wrapper th {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
  white-space: nowrap;
}

.api-table-wrapper code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8125rem;
  background: var(--vp-c-mute);
  padding: 0.1em 0.35em;
  border-radius: 3px;
  white-space: nowrap;
}

code.type {
  color: var(--vp-c-brand-1);
}

.na {
  color: var(--vp-c-text-3);
}

.api-empty {
  margin: 0 0 1rem;
  padding: 0.75rem;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

.api-not-found {
  padding: 1rem;
  background: var(--vp-c-warning-soft);
  border-radius: 6px;
  font-size: 0.875rem;
}
</style>
