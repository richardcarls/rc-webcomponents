<script setup lang="ts">
withDefaults(defineProps<{
  label?: string;
}>(), {
  label: 'Live demo',
});
</script>

<template>
  <section class="demo-frame" :aria-label="label">
    <slot />
  </section>
</template>

<style scoped>
.demo-frame {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.25rem 0;
  background: var(--rc-surface, Canvas);
}
</style>
