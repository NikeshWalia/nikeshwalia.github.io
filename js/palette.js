/**
 * Command palette (⌘K / Ctrl-K).
 *
 * Sections, case studies and capabilities are indexed from the DOM at open
 * time, so they can't drift from the markup; the Actions group (contact
 * details, theme) is declared here and must be kept in step with the
 * contact section. Focus is trapped, the page behind is inert, the active
 * option is tracked with aria-activedescendant, and focus returns to the
 * trigger on close.
 */

import { copy, toast, prefersReducedMotion } from './ui.js';
import * as theme from './theme.js';

const ICON = {
  section: '<path d="M4 6h16M4 12h16M4 18h11"/>',
  case:    '<path d="M4 5h16v14H4z"/><path d="M4 9h16"/>',
  skill:   '<path d="m12 3 2.6 5.8 6.4.7-4.8 4.3 1.3 6.2L12 17l-5.5 3 1.3-6.2L3 9.5l6.4-.7z"/>',
  mail:    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 8 9 5 9-5"/>',
  phone:   '<path d="M21 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.4 2.1L9 10.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z"/>',
  file:    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  link:    '<path d="M7 17 17 7M9 7h8v8"/>',
  theme:   '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M5 5l1.5 1.5M17.5 17.5 19 19M2 12h2M20 12h2M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  copy:    '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
};

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export function init() {
  const root    = document.querySelector('[data-cmdk]');
  const input   = root?.querySelector('input');
  const results = root?.querySelector('[data-cmdk-results]');
  if (!root || !input || !results) return null;

  let items = [];
  let matches = [];
  let cursor = 0;
  let lastFocused = null;

  /* ---------------------------------------------------- build the index */
  function buildIndex() {
    const nav = [...document.querySelectorAll('[data-index-section]')].map((el) => ({
      group: 'Jump to',
      icon: 'section',
      title: el.dataset.indexSection,
      sub: '',
      run: () => go(`#${el.id}`),
    }));

    const cases = [...document.querySelectorAll('[data-index-case]')].map((el) => ({
      group: 'Work',
      icon: 'case',
      title: el.dataset.indexCase,
      sub: el.dataset.indexSub || '',
      run: () => {
        const details = el.querySelector('details');
        if (details) details.open = true;
        go(`#${el.id}`);
      },
    }));

    const caps = [...document.querySelectorAll('[data-index-skill]')].map((el) => ({
      group: 'Capabilities',
      icon: 'skill',
      title: el.dataset.indexSkill,
      sub: el.dataset.indexSub || '',
      run: () => go('#capabilities'),
    }));

    const actions = [
      { group: 'Actions', icon: 'file',  title: 'Download resume (PDF)', sub: 'Nikesh_CV.pdf', run: download },
      { group: 'Actions', icon: 'mail',  title: 'Send an email',         sub: 'nikeshwalia@gmail.com', run: () => { location.href = 'mailto:nikeshwalia@gmail.com'; } },
      { group: 'Actions', icon: 'copy',  title: 'Copy email address',    sub: 'nikeshwalia@gmail.com', run: () => copyValue('nikeshwalia@gmail.com') },
      { group: 'Actions', icon: 'copy',  title: 'Copy phone number',     sub: '+91 62396 77566', run: () => copyValue('+916239677566') },
      { group: 'Actions', icon: 'link',  title: 'Open LinkedIn profile', sub: 'linkedin.com/in/nikesh-walia', run: () => window.open('https://www.linkedin.com/in/nikesh-walia/', '_blank', 'noopener') },
      { group: 'Actions', icon: 'theme', title: 'Cycle theme',           sub: 'light → dark → system', run: () => toast(`Theme: ${theme.cycle()}`) },
    ];

    items = [...nav, ...cases, ...caps, ...actions];
  }

  function go(hash) {
    const el = document.querySelector(hash);
    // An explicit behavior option overrides the CSS scroll-behavior override,
    // so reduced-motion has to be honoured here too.
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function download() {
    const a = document.createElement('a');
    a.href = 'Nikesh_CV.pdf';
    a.download = 'Nikesh_Walia_CV.pdf';
    document.body.append(a);
    a.click();
    a.remove();
  }

  async function copyValue(v) {
    try { await copy(v); toast(`Copied ${v}`); } catch { toast('Copy blocked'); }
  }

  /* ------------------------------------------------------------ filter */
  function score(item, q) {
    const title = item.title.toLowerCase();
    const hay = `${title} ${item.sub} ${item.group}`.toLowerCase();
    if (!q) return 1;
    if (title.startsWith(q)) return 3;
    if (title.includes(q)) return 2;
    if (hay.includes(q)) return 1;
    return 0;
  }

  function filter(query) {
    const q = query.trim().toLowerCase();
    const scored = items
      .map((item) => ({ item, s: score(item, q) }))
      .filter((r) => r.s > 0);

    // Sort groups by their best hit, then by score within a group — a plain
    // score sort interleaves groups and renders duplicate group headers.
    const best = new Map();
    scored.forEach(({ item, s }) => {
      best.set(item.group, Math.max(best.get(item.group) || 0, s));
    });
    scored.sort((a, b) =>
      (best.get(b.item.group) - best.get(a.item.group)) ||
      a.item.group.localeCompare(b.item.group) ||
      (b.s - a.s));

    matches = scored.map((r) => r.item);
    cursor = 0;
    render();
  }

  /* ------------------------------------------------------------ render */
  function render() {
    results.textContent = '';

    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'cmdk-empty';
      empty.textContent = 'No matches';
      results.append(empty);
      input.removeAttribute('aria-activedescendant');
      return;
    }

    // Group wrappers carry role="group" + a label, so screen-reader users
    // hear the group names a presentational header would erase.
    let groupEl = null;
    let lastGroup = null;
    matches.forEach((item, i) => {
      if (item.group !== lastGroup) {
        lastGroup = item.group;
        const h = document.createElement('div');
        h.className = 'cmdk-group';
        h.id = `cmdk-group-${i}`;
        h.textContent = item.group;
        h.setAttribute('role', 'presentation');
        results.append(h);
        groupEl = document.createElement('div');
        groupEl.setAttribute('role', 'group');
        groupEl.setAttribute('aria-labelledby', h.id);
        results.append(groupEl);
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cmdk-item';
      btn.id = `cmdk-opt-${i}`;
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(i === cursor));
      btn.dataset.active = String(i === cursor);
      btn.tabIndex = -1;

      btn.innerHTML =
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ` +
        `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[item.icon] || ICON.section}</svg>` +
        `<span class="t"></span><span class="s"></span>`;

      // Content is set as text, never markup — indexed strings come from the
      // DOM and user input never reaches innerHTML.
      btn.querySelector('.t').textContent = item.title;
      btn.querySelector('.s').textContent = item.sub;

      btn.addEventListener('click', () => execute(i));
      btn.addEventListener('mousemove', () => {
        if (cursor === i) return;
        cursor = i;
        syncActive();
      });

      (groupEl || results).append(btn);
    });

    syncActive();
  }

  function syncActive() {
    const opts = results.querySelectorAll('.cmdk-item');
    opts.forEach((el, i) => {
      const on = i === cursor;
      el.dataset.active = String(on);
      el.setAttribute('aria-selected', String(on));
      if (on) {
        input.setAttribute('aria-activedescendant', el.id);
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function move(step) {
    if (!matches.length) return;
    cursor = (cursor + step + matches.length) % matches.length;
    syncActive();
  }

  function execute(i) {
    const item = matches[i];
    if (!item) return;
    close();
    // Let the dialog finish closing before scrolling or navigating.
    setTimeout(() => item.run(), 90);
  }

  /* -------------------------------------------------------- open/close */
  function isOpen() { return root.dataset.open === 'true'; }

  // Everything behind the dialog goes inert while it is open — aria-modal
  // alone doesn't stop pointer or Tab interaction with the page.
  const inertTargets = () => [...document.querySelectorAll('body > header, body > main, body > footer')];

  function open() {
    if (isOpen()) return;
    lastFocused = document.activeElement;
    buildIndex();
    root.dataset.open = 'true';
    input.value = '';
    input.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    inertTargets().forEach((el) => { el.inert = true; });
    filter('');
    requestAnimationFrame(() => input.focus());
  }

  function close() {
    if (!isOpen()) return;
    root.dataset.open = 'false';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    document.body.style.overflow = '';
    inertTargets().forEach((el) => { el.inert = false; });
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  /* ------------------------------------------------------------ events */
  input.addEventListener('input', () => filter(input.value));

  root.addEventListener('pointerdown', (e) => {
    if (e.target === root) close();
  });

  // Focus trap. Only SEQUENTIALLY focusable elements count: the option rows
  // are tabindex="-1" (they're driven by aria-activedescendant), but they
  // still match a bare `button` selector — including them made first !== last
  // for the input, so plain Tab sailed straight out of the open modal.
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = [...root.querySelectorAll(FOCUSABLE)]
      .filter((el) => el.tabIndex >= 0 && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first === last) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();

    if ((e.metaKey || e.ctrlKey) && k === 'k') {
      e.preventDefault();
      isOpen() ? close() : open();
      return;
    }

    if (!isOpen()) return;

    switch (e.key) {
      case 'Escape':    e.preventDefault(); close(); break;
      case 'ArrowDown': e.preventDefault(); move(1); break;
      case 'ArrowUp':   e.preventDefault(); move(-1); break;
      case 'Home':      e.preventDefault(); cursor = 0; syncActive(); break;
      case 'End':       e.preventDefault(); cursor = matches.length - 1; syncActive(); break;
      case 'Enter':     e.preventDefault(); execute(cursor); break;
      default: break;
    }
  });

  document.querySelectorAll('[data-cmdk-open]').forEach((btn) => {
    btn.addEventListener('click', open);
  });

  return { open, close };
}
