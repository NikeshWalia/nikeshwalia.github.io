/**
 * Entry point. Each concern is a module with a single init; nothing here
 * knows how the others work. Loaded as type="module", so it is deferred by
 * default and never blocks first paint.
 */

import * as theme from './theme.js';
import * as palette from './palette.js';
import {
  initReveal, initHeader, initSpotlight, initRevealGlow,
  initPipeline, initCaseToggles, initKeycaps, initClipboard, toast,
} from './ui.js';

theme.init();
initHeader();
initReveal();
initSpotlight();
initRevealGlow();
initPipeline();
initCaseToggles();
initKeycaps();
initClipboard();
palette.init();

/* Year in the footer, so the page never goes stale. */
const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

/* Single-key shortcuts, ignored while the user is typing. */
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const el = document.activeElement;
  const typing = el instanceof HTMLElement &&
    (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  if (typing) return;

  if (e.key.toLowerCase() === 't') {
    e.preventDefault();
    toast(`Theme: ${theme.cycle()}`);
  }
});
