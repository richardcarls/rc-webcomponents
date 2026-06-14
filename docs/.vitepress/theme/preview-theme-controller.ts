export type PreviewTheme = 'none' | 'material' | 'ios' | 'fluent' | 'carbon';

export const PREVIEW_THEME_STORAGE_KEY = 'rc-preview-theme';
export const PREVIEW_THEME_CHANGE_EVENT = 'rc-preview-theme-change';
export const PREVIEW_THEMES: ReadonlyArray<{ id: PreviewTheme; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'material', label: 'Material' },
  { id: 'ios', label: 'iOS' },
  { id: 'fluent', label: 'Fluent' },
  { id: 'carbon', label: 'Carbon' },
];

let activeTheme: PreviewTheme = 'none';
let observer: MutationObserver | null = null;
let installed = false;

function isPreviewTheme(value: string | null): value is PreviewTheme {
  return Boolean(value && PREVIEW_THEMES.some(({ id }) => id === value));
}

function readStoredTheme(): PreviewTheme {
  try {
    const stored = localStorage.getItem(PREVIEW_THEME_STORAGE_KEY);
    if (isPreviewTheme(stored)) return stored;
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
  return 'none';
}

function syncDemoSections(theme: PreviewTheme) {
  if (theme === 'none') delete document.body.dataset.rcPreviewTheme;
  else document.body.dataset.rcPreviewTheme = theme;

  document.querySelectorAll<HTMLElement>('.demo-section').forEach((section) => {
    if (theme === 'none') delete section.dataset.rcPreviewTheme;
    else section.dataset.rcPreviewTheme = theme;
    section.classList.toggle('rc-theme-material', theme === 'material');
  });
}

function syncSwitcher(theme: PreviewTheme) {
  document.querySelectorAll<HTMLButtonElement>('[data-rc-preview-theme-option]').forEach((button) => {
    const selected = button.dataset.rcPreviewThemeOption === theme;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });

  document.querySelectorAll<HTMLSelectElement>('[data-rc-preview-theme-select]').forEach((select) => {
    select.value = theme;
  });
}

export function applyPreviewTheme(theme: PreviewTheme, dispatch = true, syncControls = true) {
  activeTheme = theme;
  try {
    localStorage.setItem(PREVIEW_THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
  syncDemoSections(theme);
  if (syncControls) syncSwitcher(theme);
  if (dispatch) {
    window.dispatchEvent(new CustomEvent(PREVIEW_THEME_CHANGE_EVENT, { detail: { theme } }));
  }
}

export function getActivePreviewTheme(): PreviewTheme {
  return activeTheme;
}

export function installPreviewThemeController() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  activeTheme = readStoredTheme();
  applyPreviewTheme(activeTheme, true, false);

  observer = new MutationObserver(() => {
    syncDemoSections(activeTheme);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-rc-preview-theme-option]');
    const theme = button?.dataset.rcPreviewThemeOption ?? null;
    if (!isPreviewTheme(theme)) return;
    applyPreviewTheme(theme);
  });

  document.addEventListener('change', (event) => {
    const select = (event.target as Element | null)?.closest<HTMLSelectElement>('[data-rc-preview-theme-select]');
    const theme = select?.value ?? null;
    if (!isPreviewTheme(theme)) return;
    applyPreviewTheme(theme);
  });

  window.addEventListener('storage', (event) => {
    if (event.key === PREVIEW_THEME_STORAGE_KEY && isPreviewTheme(event.newValue)) {
      applyPreviewTheme(event.newValue, true);
    }
  });
}
