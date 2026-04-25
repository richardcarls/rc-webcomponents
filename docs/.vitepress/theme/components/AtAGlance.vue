<script setup lang="ts">
interface LinkItem {
  label: string;
  href: string;
}

const props = withDefaults(defineProps<{
  packageName: string;
  tag: string;
  native?: string;
  state?: string;
  events?: string[];
  related?: LinkItem[];
}>(), {
  native: 'No required native child',
  state: 'Uncontrolled by default',
  events: () => [],
  related: () => [],
});
</script>

<template>
  <dl class="at-a-glance" aria-label="Component summary">
    <div>
      <dt>Package</dt>
      <dd><code>{{ props.packageName }}</code></dd>
    </div>
    <div>
      <dt>Element</dt>
      <dd><code>&lt;{{ props.tag }}&gt;</code></dd>
    </div>
    <div>
      <dt>Native dependency</dt>
      <dd>{{ props.native }}</dd>
    </div>
    <div>
      <dt>State model</dt>
      <dd>{{ props.state }}</dd>
    </div>
    <div>
      <dt>Main events</dt>
      <dd>
        <template v-if="props.events.length">
          <code v-for="eventName in props.events" :key="eventName">{{ eventName }}</code>
        </template>
        <span v-else>None</span>
      </dd>
    </div>
    <div v-if="props.related.length">
      <dt>Related</dt>
      <dd>
        <a v-for="item in props.related" :key="item.href" :href="item.href">{{ item.label }}</a>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.at-a-glance {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0;
  margin: 1.25rem 0 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.at-a-glance > div {
  padding: 0.75rem 1rem;
  border-inline-end: 1px solid var(--vp-c-divider);
  border-block-end: 1px solid var(--vp-c-divider);
}

.at-a-glance dt {
  margin: 0 0 0.25rem;
  color: var(--vp-c-text-3);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.at-a-glance dd {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
}

.at-a-glance code {
  font-size: 0.8125rem;
}
</style>
