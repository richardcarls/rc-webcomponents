<script setup lang="ts">
withDefaults(defineProps<{
  label?: string;
}>(), {
  label: 'Live demo',
});
</script>

<template>
  <section class="demo-section demo-frame" :aria-label="label">
    <slot />
  </section>
</template>

<style scoped>
.demo-frame {
  background: var(--rc-surface, var(--vp-c-bg));
}
</style>
