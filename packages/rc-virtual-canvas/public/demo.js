const THEMES = ['', 'light', 'dark', 'solarized-light', 'solarized-dark'];
const LABELS = ['Auto', 'Light', 'Dark', 'Solarized ☀', 'Solarized ☾'];

const stored = localStorage.getItem('rc-demo-theme') ?? '';
applyTheme(stored);

function applyTheme(theme) {
  if (theme) {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

function currentIndex() {
  const current = document.documentElement.dataset.theme ?? '';
  const idx = THEMES.indexOf(current);
  return idx === -1 ? 0 : idx;
}

function updateButtons() {
  const label = LABELS[currentIndex()];
  document.querySelectorAll('.theme-picker').forEach((btn) => {
    btn.textContent = label;
  });
}

window.cycleTheme = function () {
  const next = THEMES[(currentIndex() + 1) % THEMES.length];
  applyTheme(next);
  localStorage.setItem('rc-demo-theme', next);
  updateButtons();
};

document.addEventListener('DOMContentLoaded', () => {
  updateButtons();
  document.querySelectorAll('.theme-picker').forEach((btn) => {
    btn.addEventListener('click', window.cycleTheme);
  });
});
