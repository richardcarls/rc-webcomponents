<script setup lang="ts">
import { computed } from 'vue';

// Imported at build time; run `yarn cem:analyze` before starting the dev server.
// @ts-ignore — JSON import; Vite handles this natively
import cemData from '../../../../dist/custom-elements.json';

const props = defineProps<{ tag: string }>();

interface TypeRef { text: string }

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
    <template v-if="publicFields.length">
      <h3>Properties</h3>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Attribute</th>
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
              <span v-else class="na">—</span>
            </td>
            <td>
              <code v-if="m.type?.text" class="type">{{ m.type.text }}</code>
            </td>
            <td>
              <code v-if="m.default !== undefined">{{ m.default }}</code>
              <span v-else class="na">—</span>
            </td>
            <td>{{ m.description ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <!-- Methods -->
    <template v-if="publicMethods.length">
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
            <td><code>{{ m.name }}()</code></td>
            <td>{{ m.description ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <!-- Events -->
    <template v-if="decl.events?.length">
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
            </td>
            <td>{{ ev.description ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <!-- Slots -->
    <template v-if="decl.slots?.length">
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
            <td>{{ sl.description ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <!-- CSS Custom Properties -->
    <template v-if="decl.cssProperties?.length">
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
              <span v-else class="na">—</span>
            </td>
            <td>{{ cp.description ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <!-- CSS Parts -->
    <template v-if="decl.cssParts?.length">
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
            <td>{{ pt.description ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.api-table-wrapper :deep(h3) {
  font-size: 1rem;
  margin: 1.5rem 0 0.5rem;
  padding: 0;
  border: none;
}

.api-table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  font-size: 0.875rem;
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
}

code.type {
  color: var(--vp-c-brand-1);
}

.na {
  color: var(--vp-c-text-3);
}

.api-not-found {
  padding: 1rem;
  background: var(--vp-c-warning-soft);
  border-radius: 6px;
  font-size: 0.875rem;
}
</style>
