/**
 * Entry point. Each concern is a module with a single init; nothing here
 * knows how the others work. Loaded as type="module", so it is deferred by
 * default and never blocks first paint.
 */

import * as theme from './theme.js';
import * as palette from './palette.js';
import {
  initReveal, initHeader, initDrawer, initPortrait, initType, initToTop, initCounters, initSpotlight, initRevealGlow, initProgress,
  initPipeline, initCaseToggles, initKeycaps, initClipboard,
  initThemeSwitchKeys, toast,
} from './ui.js';

theme.init();
initHeader();
initDrawer();
initPortrait();
initType();
initToTop();
initCounters();
initProgress();
initReveal();
initSpotlight();
initRevealGlow();
initPipeline();
initCaseToggles();
initKeycaps();
initClipboard();
initThemeSwitchKeys((pref) => theme.set(pref));

// Keep the handle: other code should ask the palette whether it is open
// rather than sniffing the DOM for its data attribute.
const cmdk = palette.init();

/* Year in the footer, so the page never goes stale. */
const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

/* Single-key shortcuts, ignored while typing or while a dialog is open. */
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  // A modal owns the keyboard while it is open: otherwise a single-key
  // shortcut fires on characters the user believes they are typing into it.
  if (cmdk?.isOpen()) return;

  const el = document.activeElement;
  const typing = el instanceof HTMLElement &&
    (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  if (typing) return;

  if (e.key.toLowerCase() === 't') {
    e.preventDefault();
    toast(`Theme: ${theme.cycle()}`);
  }
});
