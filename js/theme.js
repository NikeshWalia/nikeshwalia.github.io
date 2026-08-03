/**
 * Three-state theme control: light | dark | system.
 *
 * "System" is a real state, not the absence of a choice — the same model
 * GitHub and Linear use. A binary toggle silently overrides the OS
 * preference forever after one click, which is the wrong default.
 */

const KEY = 'theme-preference';
const media = window.matchMedia('(prefers-color-scheme: dark)');

export function resolve(pref) {
  return pref === 'system' ? (media.matches ? 'dark' : 'light') : pref;
}

export function getPreference() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function apply(pref) {
  const resolved = resolve(pref);
  document.documentElement.dataset.theme = resolved;

  // Keep the browser UI (address bar, notch) in step with the page.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.content = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg').trim() || (resolved === 'dark' ? '#08090a' : '#f6f6f7');
  }

  document.querySelectorAll('[data-theme-set]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.themeSet === pref));
  });
}

export function set(pref) {
  try { localStorage.setItem(KEY, pref); } catch { /* private mode */ }
  apply(pref);
}

export function cycle() {
  const order = ['light', 'dark', 'system'];
  const next = order[(order.indexOf(getPreference()) + 1) % order.length];
  set(next);
  return next;
}

export function init() {
  apply(getPreference());

  document.querySelectorAll('[data-theme-set]').forEach((btn) => {
    btn.addEventListener('click', () => set(btn.dataset.themeSet));
  });

  // Only follow the OS while the user is actually on "system".
  media.addEventListener('change', () => {
    if (getPreference() === 'system') apply('system');
  });
}
