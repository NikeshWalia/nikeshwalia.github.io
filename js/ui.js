/**
 * Shared UI: reduced-motion flag, scroll reveal, sticky header + scroll-spy
 * with a sliding ink underline, pointer spotlight, Fluent-style reveal glow,
 * interactive pipeline, platform-aware keycaps, clipboard + toast.
 *
 * Every effect is opt-out under prefers-reduced-motion and every listener is
 * passive, so scrolling never waits on JavaScript.
 */

export const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

/* ---------------------------------------------------------------- reveal */
export function initReveal() {
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!items.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => { el.dataset.shown = 'true'; });
    return;
  }

  // Stagger is scoped per group so a long section doesn't accumulate a
  // multi-second delay on its last child.
  const groups = new Map();
  items.forEach((el) => {
    const key = el.closest('[data-reveal-group]') || document.body;
    const list = groups.get(key) || [];
    list.push(el);
    groups.set(key, list);
  });
  groups.forEach((list) => list.forEach((el, i) => el.style.setProperty('--i', Math.min(i, 6))));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.dataset.shown = 'true';
      io.unobserve(entry.target);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -8% 0px' });

  items.forEach((el) => io.observe(el));
}

/* ------------------------------------------------- header + spy + ink */
export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (header) {
    const onScroll = () => { header.dataset.stuck = String(window.scrollY > 4); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const nav = document.querySelector('[data-spy]');
  const links = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
  const ink = document.querySelector('[data-nav-ink]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const moveInk = (link) => {
    if (!ink) return;
    if (!link) { ink.dataset.on = 'false'; return; }
    // Read the link's own horizontal padding rather than hard-coding --s-3;
    // duplicating a CSS value in JS silently breaks when the token changes.
    const pad = parseFloat(getComputedStyle(link).paddingLeft) || 12;
    const x = link.offsetLeft + pad;
    const w = Math.max(link.offsetWidth - pad * 2, 12);
    ink.style.transform = `translateX(${x}px) scaleX(${w / 24})`;
    ink.dataset.on = 'true';
  };

  const targets = links
    .map((a) => {
      const el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      return el ? { a, el } : null;
    })
    .filter(Boolean);

  const visible = new Set();
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
    const active = targets.find((t) => visible.has(t.el.id));
    links.forEach((a) => {
      // 'location' is the correct aria-current token for in-page navigation.
      if (active && a === active.a) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    moveInk(active ? active.a : null);
  }, { rootMargin: '-20% 0px -68% 0px' });

  targets.forEach((t) => spy.observe(t.el));

  // Keep the ink honest across resizes (font metrics shift positions).
  window.addEventListener('resize', () => {
    const current = nav.querySelector('a[aria-current]');
    if (current) moveInk(current);
  }, { passive: true });
}

/* --------------------------------------------------------- scroll progress
   Drives a single custom property consumed by a scaleX transform, so the bar
   animates on the compositor and never triggers layout. Reads are coalesced
   to one per frame because scroll fires far above display refresh rate.
   ------------------------------------------------------------------------ */
export function initProgress() {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return;

  let queued = false;
  const paint = () => {
    queued = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.setProperty('--p', String(p));
  };

  const onScroll = () => {
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  paint();
}

/* -------------------------------------------------------------- spotlight */
export function initSpotlight() {
  const el = document.querySelector('[data-spotlight]');
  if (!el || prefersReducedMotion || isCoarsePointer) return;

  let x = 0, y = 0, queued = false;

  const paint = () => {
    queued = false;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
  };

  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    x = e.clientX - r.left;
    y = e.clientY - r.top;
    // Coalesce to one write per frame; pointermove can fire far above 60Hz.
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }, { passive: true });

  el.addEventListener('pointerenter', () => el.style.setProperty('--spot-o', '1'), { passive: true });
  el.addEventListener('pointerleave', () => el.style.setProperty('--spot-o', '0'), { passive: true });
}

/* ------------------------------------------------------------ reveal glow
   Fluent's reveal highlight: every .rvl card inside a [data-rvl-scope]
   gets the pointer position in its own coordinate space, so borders glow
   as the pointer approaches: including from outside the card. One
   delegated listener per scope, one write batch per frame.
   ------------------------------------------------------------------------ */
export function initRevealGlow() {
  if (prefersReducedMotion || isCoarsePointer) return;

  document.querySelectorAll('[data-rvl-scope]').forEach((scope) => {
    const cards = scope.matches('.rvl') ? [scope] : [...scope.querySelectorAll('.rvl')];
    if (!cards.length) return;

    let cx = 0, cy = 0, queued = false, rects = [];

    // Rects are cached on enter/scroll/resize instead of being read per frame.
    // getBoundingClientRect() forces layout, and doing it for every card on
    // every pointermove frame put a layout read in the animation hot path.
    const measure = () => { rects = cards.map((c) => c.getBoundingClientRect()); };

    const paint = () => {
      queued = false;
      cards.forEach((card, i) => {
        const r = rects[i];
        if (!r) return;
        card.style.setProperty('--rvl-x', `${cx - r.left}px`);
        card.style.setProperty('--rvl-y', `${cy - r.top}px`);
      });
    };

    scope.addEventListener('pointermove', (e) => {
      cx = e.clientX; cy = e.clientY;
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    }, { passive: true });

    scope.addEventListener('pointerenter', () => {
      measure();
      cards.forEach((c) => c.style.setProperty('--rvl-o', '1'));
    }, { passive: true });

    scope.addEventListener('pointerleave', () => {
      cards.forEach((c) => c.style.setProperty('--rvl-o', '0'));
    }, { passive: true });

    // The pointer can stay inside a scope while the page scrolls under it.
    window.addEventListener('scroll', () => { if (rects.length) measure(); }, { passive: true });
    window.addEventListener('resize', () => { if (rects.length) measure(); }, { passive: true });
  });
}

/* --------------------------------------------------------------- pipeline
   A tab set, not five toggles. aria-pressed announced five independent
   on/off buttons when this is a single-select group with one shared panel
   (the detail line). Tabs give the correct semantics plus the keyboard
   contract users expect: arrows move, Home/End jump, one tab stop total.
   ------------------------------------------------------------------------ */
export function initPipeline() {
  const list = document.querySelector('[data-pipeline]');
  const detail = document.querySelector('[data-pipeline-detail]');
  if (!list || !detail) return;

  const stages = [...list.querySelectorAll('.stage')];
  if (!stages.length) return;

  const select = (stage, moveFocus) => {
    stages.forEach((s) => {
      const on = s === stage;
      s.setAttribute('aria-selected', String(on));
      // Roving tabindex: the group is one stop, arrows move within it.
      s.tabIndex = on ? 0 : -1;
    });
    detail.textContent = stage.dataset.detail || '';
    if (moveFocus) stage.focus();
  };

  stages.forEach((stage, i) => {
    stage.addEventListener('click', () => select(stage, false));

    stage.addEventListener('keydown', (e) => {
      const last = stages.length - 1;
      let next = null;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': next = stages[i === last ? 0 : i + 1]; break;
        case 'ArrowLeft':  case 'ArrowUp':   next = stages[i === 0 ? last : i - 1]; break;
        case 'Home':                         next = stages[0]; break;
        case 'End':                          next = stages[last]; break;
        default: return;
      }
      e.preventDefault();
      select(next, true);
    });
  });

  // Establish the initial roving-tabindex state from the authored markup.
  const initial = stages.find((s) => s.getAttribute('aria-selected') === 'true') || stages[0];
  select(initial, false);
}

/* ----------------------------------------------------------- theme switch
   Radio group semantics: three mutually exclusive choices, not three
   independent toggles. Arrow keys move and select, matching the pattern a
   screen-reader user is told to expect once they hear "radio group".
   ------------------------------------------------------------------------ */
export function initThemeSwitchKeys(onSelect) {
  const group = document.querySelector('[data-theme-switch]');
  if (!group) return;
  const radios = [...group.querySelectorAll('[data-theme-set]')];
  if (!radios.length) return;

  radios.forEach((radio, i) => {
    radio.addEventListener('keydown', (e) => {
      const last = radios.length - 1;
      let next = null;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': next = radios[i === last ? 0 : i + 1]; break;
        case 'ArrowLeft':  case 'ArrowUp':   next = radios[i === 0 ? last : i - 1]; break;
        case 'Home':                         next = radios[0]; break;
        case 'End':                          next = radios[last]; break;
        default: return;
      }
      e.preventDefault();
      onSelect(next.dataset.themeSet);
      next.focus();
    });
  });
}

/* ------------------------------------------------------- case-head toggle */
export function initCaseToggles() {
  document.querySelectorAll('[data-case-toggle]').forEach((head) => {
    head.addEventListener('click', (e) => {
      // A click that lands on a link/button inside the head keeps its meaning.
      if (e.target.closest('a, button')) return;
      // Don't hijack text selection.
      const sel = window.getSelection();
      if (sel && sel.type === 'Range') return;
      const details = head.parentElement.querySelector('details');
      if (details) details.open = !details.open;
    });
  });
}

/* ------------------------------------------------------------ kbd platform */
export function initKeycaps() {
  // Case-insensitive: userAgentData.platform reports "macOS" (lowercase m),
  // which a /Mac/ test silently misses: Chrome and Edge on macOS were then
  // told their shortcut is Ctrl. Safari was unaffected because it has no
  // userAgentData and falls through to platform === "MacIntel".
  const isApple = /mac|iphone|ipad|ipod/i.test(
    navigator.userAgentData?.platform || navigator.platform || ''
  );
  if (isApple) return; // ⌘ is already in the markup
  document.querySelectorAll('[data-kbd-mod]').forEach((k) => { k.textContent = 'Ctrl'; });
}

/* ------------------------------------------------------------------ toast */
let toastTimer;
export function toast(message) {
  const el = document.querySelector('[data-toast]');
  if (!el) return;
  const label = el.querySelector('[data-toast-msg]');
  clearTimeout(toastTimer);

  // Reveal the region BEFORE writing to it. Mutating an aria-live region that
  // is still visibility:hidden is commonly not announced at all, so the
  // "Copied …" confirmation was silent for screen-reader users.
  el.dataset.open = 'true';
  requestAnimationFrame(() => {
    if (label) label.textContent = message;
  });

  toastTimer = setTimeout(() => { el.dataset.open = 'false'; }, 2400);
}

/* -------------------------------------------------------------- clipboard */
export async function copy(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // file:// and other insecure contexts have no async clipboard.
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.append(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  if (!ok) throw new Error('copy blocked');
}

export function initClipboard() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const value = btn.dataset.copy;
      try {
        await copy(value);
        toast(`Copied ${value}`);
      } catch {
        // The fallback path may have moved focus; hand it back, and show the
        // value itself: "press Ctrl+C" is useless once the selection is gone.
        toast(`Copy blocked. ${value}`);
      } finally {
        btn.focus();
      }
    });
  });
}
