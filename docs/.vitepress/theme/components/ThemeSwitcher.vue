<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from 'vue';

import {
  getActivePreviewTheme,
  PREVIEW_THEME_CHANGE_EVENT,
  PREVIEW_THEMES,
  type PreviewTheme,
} from '../preview-theme-controller';

const active = ref<PreviewTheme>('none');

function syncActiveTheme(event: Event) {
  active.value = (event as CustomEvent<{ theme: PreviewTheme }>).detail.theme;
}

onMounted(() => {
  active.value = getActivePreviewTheme();
  window.addEventListener(PREVIEW_THEME_CHANGE_EVENT, syncActiveTheme);
});

onBeforeUnmount(() => {
  window.removeEventListener(PREVIEW_THEME_CHANGE_EVENT, syncActiveTheme);
});
</script>

<template>
  <div class="rc-theme-switcher">
    <label class="rc-theme-label" for="rc-preview-theme-select">Preview theme</label>
    <select
      id="rc-preview-theme-select"
      class="rc-theme-select"
      data-rc-preview-theme-select
      :value="active"
      aria-label="Preview theme"
    >
      <option
        v-for="t in PREVIEW_THEMES"
        :key="t.id"
        :value="t.id"
      >{{ t.label }}</option>
    </select>
  </div>
</template>

<style scoped>
.rc-theme-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid var(--vp-c-divider);
}

.rc-theme-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  line-height: 1;
}

.rc-theme-select {
  inline-size: clamp(6.75rem, 24vw, 8.25rem);
  height: 32px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font: inherit;
  font-size: 0.8125rem;
  line-height: 32px;
  cursor: pointer;
}

.rc-theme-select:hover {
  border-color: var(--vp-c-brand-3);
  color: var(--vp-c-text-1);
}

.rc-theme-select:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

@media (max-width: 959px) {
  .rc-theme-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}

@media (min-width: 768px) {
  .rc-theme-switcher {
    margin-left: 16px;
    padding-left: 16px;
  }
}
</style>
