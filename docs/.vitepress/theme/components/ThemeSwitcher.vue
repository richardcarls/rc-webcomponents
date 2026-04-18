<script setup lang="ts">
import { ref, onMounted } from 'vue';

type RcTheme = 'zinc' | 'blue' | 'ua';

const STORAGE_KEY = 'rc-theme';

const themes: { id: RcTheme; label: string }[] = [
  { id: 'zinc', label: 'Zinc'                },
  { id: 'blue', label: 'Blue'                },
  { id: 'ua',   label: 'UA Style (Default)'  },
];

const active = ref<RcTheme>('zinc');

function applyTheme(theme: RcTheme) {
  active.value = theme;
  if (theme === 'ua') {
    document.documentElement.dataset.rcTheme = 'ua';
  } else {
    document.documentElement.dataset.rcTheme = theme;
  }
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage unavailable */ }
}

onMounted(() => {
  let saved: RcTheme = 'zinc';
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as RcTheme | null;
    if (stored && themes.some((t) => t.id === stored)) saved = stored;
  } catch { /* storage unavailable */ }
  applyTheme(saved);
});
</script>

<template>
  <div class="rc-theme-switcher">
    <span class="rc-theme-label">Theme</span>
    <div class="rc-theme-links">
      <button
        v-for="t in themes"
        :key="t.id"
        class="rc-theme-link"
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
