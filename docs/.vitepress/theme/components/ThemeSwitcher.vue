<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

import {
  getActivePreviewState,
  PREVIEW_MODES,
  PREVIEW_THEMES,
  PREVIEW_THEME_CHANGE_EVENT,
  type PreviewMode,
  type PreviewState,
  type PreviewTheme,
} from '../preview-theme-controller';

const activeTheme = ref<PreviewTheme>('none');
const activeMode = ref<PreviewMode>('auto');

function syncActiveState(event: Event) {
  const state = (event as CustomEvent<PreviewState>).detail;
  activeTheme.value = state.theme;
  activeMode.value = state.mode;
}

onMounted(() => {
  const state = getActivePreviewState();
  activeTheme.value = state.theme;
  activeMode.value = state.mode;
  window.addEventListener(PREVIEW_THEME_CHANGE_EVENT, syncActiveState);
});

onBeforeUnmount(() => {
  window.removeEventListener(PREVIEW_THEME_CHANGE_EVENT, syncActiveState);
});
</script>

<template>
  <div class="rc-theme-switcher">
    <label class="rc-theme-label" for="rc-preview-theme-select">Preview theme</label>
    <select
      id="rc-preview-theme-select"
      class="rc-theme-select"
      data-rc-preview-theme-select
      :value="activeTheme"
      aria-label="Preview theme"
    >
      <option v-for="theme in PREVIEW_THEMES" :key="theme.id" :value="theme.id">
        {{ theme.label }}
      </option>
    </select>

    <label class="rc-theme-label" for="rc-preview-mode-select">Preview mode</label>
    <select
      id="rc-preview-mode-select"
      class="rc-theme-select rc-theme-mode-select"
      data-rc-preview-mode-select
      :value="activeMode"
      aria-label="Preview color mode"
    >
      <option v-for="mode in PREVIEW_MODES" :key="mode.id" :value="mode.id">
        {{ mode.label }}
      </option>
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
  inline-size: clamp(6rem, 18vw, 7.75rem);
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

.rc-theme-mode-select {
  inline-size: clamp(5.25rem, 16vw, 6.25rem);
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
