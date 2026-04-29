<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from 'vue';

type PreviewTheme = 'material' | 'ios' | 'fluent' | 'carbon';

const STORAGE_KEY = 'rc-preview-theme';
const CHANGE_EVENT = 'rc-preview-theme-change';

const themes: { id: PreviewTheme; label: string }[] = [
  { id: 'material', label: 'Material' },
  { id: 'ios', label: 'iOS' },
  { id: 'fluent', label: 'Fluent' },
  { id: 'carbon', label: 'Carbon' },
];

const active = ref<PreviewTheme>('material');
let demoObserver: MutationObserver | null = null;

function applyThemeToDemoSections(theme: PreviewTheme) {
  document.body.dataset.rcPreviewTheme = theme;
  document.querySelectorAll<HTMLElement>('.demo-section').forEach((section) => {
    section.dataset.rcPreviewTheme = theme;
  });
}

function applyTheme(theme: PreviewTheme) {
  active.value = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage unavailable */ }
  applyThemeToDemoSections(theme);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { theme } }));
}

onMounted(() => {
  let saved: PreviewTheme = 'material';
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
    <span class="rc-theme-label">Preview theme</span>
    <div class="rc-theme-links">
      <button
        v-for="t in themes"
        :key="t.id"
        class="rc-theme-link"
        :data-rc-preview-theme-option="t.id"
        :class="{ 'is-active': active === t.id }"
        :aria-pressed="active === t.id"
        @click="applyTheme(t.id)"
      >{{ t.label }}</button>
    </div>
  </div>
</template>

<style scoped>
.rc-theme-switcher {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.rc-theme-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.rc-theme-links {
  display: flex;
  gap: 12px;
}

.rc-theme-link {
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}

.rc-theme-link.is-active {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.rc-theme-link:hover {
  color: var(--vp-c-text-1);
}

.rc-theme-link:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-radius: 2px;
}
</style>
