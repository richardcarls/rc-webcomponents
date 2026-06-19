export type PreviewTheme = 'none' | 'material';

export type PreviewMode = 'auto' | 'light' | 'dark';

export interface PreviewState {
  theme: PreviewTheme;
  mode: PreviewMode;
}

export const PREVIEW_THEME_STORAGE_KEY = 'rc-preview-theme';
export const PREVIEW_MODE_STORAGE_KEY = 'rc-preview-mode';
export const PREVIEW_THEME_CHANGE_EVENT = 'rc-preview-theme-change';

export const PREVIEW_THEMES: ReadonlyArray<{ id: PreviewTheme; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'material', label: 'Material' },
];

export const PREVIEW_MODES: ReadonlyArray<{ id: PreviewMode; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

let activeTheme: PreviewTheme = 'none';
let activeMode: PreviewMode = 'auto';
let observer: MutationObserver | null = null;
let installed = false;

function isPreviewTheme(value: string | null): value is PreviewTheme {
  return Boolean(value && PREVIEW_THEMES.some(({ id }) => id === value));
}

function isPreviewMode(value: string | null): value is PreviewMode {
  return Boolean(value && PREVIEW_MODES.some(({ id }) => id === value));
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

function readStoredMode(): PreviewMode {
  try {
    const stored = localStorage.getItem(PREVIEW_MODE_STORAGE_KEY);
    if (isPreviewMode(stored)) return stored;
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }

  return 'auto';
}

function syncPreviewMode($scope: HTMLElement, mode: PreviewMode) {
  if (mode === 'auto') {
    delete $scope.dataset.rcPreviewMode;
    $scope.style.colorScheme = '';

    return;
  }

  $scope.dataset.rcPreviewMode = mode;
  $scope.style.colorScheme = mode;
}

function syncDemoSections(theme: PreviewTheme, mode: PreviewMode) {
  if (theme === 'none') delete document.body.dataset.rcPreviewTheme;
  else document.body.dataset.rcPreviewTheme = theme;

  if (mode === 'auto') delete document.body.dataset.rcPreviewMode;
  else document.body.dataset.rcPreviewMode = mode;

  document.querySelectorAll<HTMLElement>('.demo-section').forEach(($section) => {
    if (theme === 'none') delete $section.dataset.rcPreviewTheme;
    else $section.dataset.rcPreviewTheme = theme;

    $section.classList.toggle('rc-theme-material', theme === 'material');
    syncPreviewMode($section, mode);
  });
}

function syncSwitcher(theme: PreviewTheme, mode: PreviewMode) {
  document
    .querySelectorAll<HTMLButtonElement>('[data-rc-preview-theme-option]')
    .forEach(($button) => {
      const selected = $button.dataset.rcPreviewThemeOption === theme;
      $button.classList.toggle('is-active', selected);
      $button.setAttribute('aria-pressed', String(selected));
    });

  document
    .querySelectorAll<HTMLSelectElement>('[data-rc-preview-theme-select]')
    .forEach(($select) => {
      $select.value = theme;
    });

  document
    .querySelectorAll<HTMLButtonElement>('[data-rc-preview-mode-option]')
    .forEach(($button) => {
      const selected = $button.dataset.rcPreviewModeOption === mode;
      $button.classList.toggle('is-active', selected);
      $button.setAttribute('aria-pressed', String(selected));
    });

  document
    .querySelectorAll<HTMLSelectElement>('[data-rc-preview-mode-select]')
    .forEach(($select) => {
      $select.value = mode;
    });
}

function dispatchPreviewChange() {
  window.dispatchEvent(
    new CustomEvent<PreviewState>(PREVIEW_THEME_CHANGE_EVENT, {
      detail: getActivePreviewState(),
    }),
  );
}

export function applyPreviewState(
  state: Partial<PreviewState>,
  dispatch = true,
  syncControls = true,
) {
  activeTheme = state.theme ?? activeTheme;
  activeMode = state.mode ?? activeMode;

  try {
    localStorage.setItem(PREVIEW_THEME_STORAGE_KEY, activeTheme);
    localStorage.setItem(PREVIEW_MODE_STORAGE_KEY, activeMode);
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }

  syncDemoSections(activeTheme, activeMode);

  if (syncControls) syncSwitcher(activeTheme, activeMode);

  if (dispatch) dispatchPreviewChange();
}

export function applyPreviewTheme(theme: PreviewTheme, dispatch = true, syncControls = true) {
  applyPreviewState({ theme }, dispatch, syncControls);
}

export function applyPreviewMode(mode: PreviewMode, dispatch = true, syncControls = true) {
  applyPreviewState({ mode }, dispatch, syncControls);
}

export function getActivePreviewTheme(): PreviewTheme {
  return activeTheme;
}

export function getActivePreviewMode(): PreviewMode {
  return activeMode;
}

export function getActivePreviewState(): PreviewState {
  return {
    theme: activeTheme,
    mode: activeMode,
  };
}

export function installPreviewThemeController() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  activeTheme = readStoredTheme();
  activeMode = readStoredMode();
  applyPreviewState({ theme: activeTheme, mode: activeMode }, true, false);

  observer = new MutationObserver(() => {
    syncDemoSections(activeTheme, activeMode);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', (event) => {
    const $button = (event.target as Element | null)?.closest<HTMLButtonElement>(
      '[data-rc-preview-theme-option]',
    );
    const theme = $button?.dataset.rcPreviewThemeOption ?? null;
    if (!isPreviewTheme(theme)) return;

    applyPreviewTheme(theme);
  });

  document.addEventListener('click', (event) => {
    const $button = (event.target as Element | null)?.closest<HTMLButtonElement>(
      '[data-rc-preview-mode-option]',
    );
    const mode = $button?.dataset.rcPreviewModeOption ?? null;
    if (!isPreviewMode(mode)) return;

    applyPreviewMode(mode);
  });

  document.addEventListener('change', (event) => {
    const $select = (event.target as Element | null)?.closest<HTMLSelectElement>(
      '[data-rc-preview-theme-select]',
    );
    const theme = $select?.value ?? null;
    if (!isPreviewTheme(theme)) return;

    applyPreviewTheme(theme);
  });

  document.addEventListener('change', (event) => {
    const $select = (event.target as Element | null)?.closest<HTMLSelectElement>(
      '[data-rc-preview-mode-select]',
    );
    const mode = $select?.value ?? null;
    if (!isPreviewMode(mode)) return;

    applyPreviewMode(mode);
  });

  window.addEventListener('storage', (event) => {
    if (event.key === PREVIEW_THEME_STORAGE_KEY && isPreviewTheme(event.newValue)) {
      applyPreviewTheme(event.newValue, true);
    }

    if (event.key === PREVIEW_MODE_STORAGE_KEY && isPreviewMode(event.newValue)) {
      applyPreviewMode(event.newValue, true);
    }
  });
}
