<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from 'vue';

type PreviewTheme = 'none' | 'material' | 'ios' | 'fluent' | 'carbon';

const STORAGE_KEY = 'rc-preview-theme';
const CHANGE_EVENT = 'rc-preview-theme-change';

const themes: { id: PreviewTheme; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'material', label: 'Material' },
  { id: 'ios', label: 'iOS' },
  { id: 'fluent', label: 'Fluent' },
  { id: 'carbon', label: 'Carbon' },
];

const active = ref<PreviewTheme>('none');
let demoObserver: MutationObserver | null = null;

function applyThemeToDemoSections(theme: PreviewTheme) {
  if (theme === 'none') delete document.body.dataset.rcPreviewTheme;
  else document.body.dataset.rcPreviewTheme = theme;

  document.querySelectorAll<HTMLElement>('.demo-section').forEach((section) => {
    if (theme === 'none') delete section.dataset.rcPreviewTheme;
    else section.dataset.rcPreviewTheme = theme;
  });
}

function applyTheme(theme: PreviewTheme) {
  active.value = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage unavailable */ }
  applyThemeToDemoSections(theme);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { theme } }));
}

onMounted(() => {
  let saved: PreviewTheme = 'none';
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as PreviewTheme | null;
    if (stored && themes.some((t) => t.id === stored)) saved = stored;
  } catch { /* storage unavailable */ }
  applyTheme(saved);

  demoObserver = new MutationObserver(() => applyThemeToDemoSections(active.value));
  demoObserver.observe(document.body, { childList: true, subtree: true });
});

onBeforeUnmount(() => {
  demoObserver?.disconnect();
  demoObserver = null;
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
      @change="applyTheme(($event.target as HTMLSelectElement).value as PreviewTheme)"
    >
      <option
        v-for="t in themes"
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
