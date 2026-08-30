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
/* The rotating "I build ___" line. Written by hand rather than pulled from a
   typing library, because the whole effect is one interval and a substring.
   Under prefers-reduced-motion it prints the first phrase and stops: motion
   that conveys nothing must not be forced on someone who asked for none. */
export function initType() {
  const host = document.querySelector('[data-type]');
  if (!host) return;
  const out = host.querySelector('.type-text');
  const caret = host.querySelector('.type-caret');
  const phrases = host.dataset.type.split('|').map((p) => p.trim()).filter(Boolean);
  if (!out || phrases.length < 2) return;

  if (prefersReducedMotion) {
    out.textContent = phrases[0];
    if (caret) caret.remove();
    return;
  }

  // No ARIA is set here: the markup already carries a visually-hidden copy of
  // the full list for screen readers, and the animated span is aria-hidden.
  // aria-label on a bare span is prohibited and would be ignored anyway.

  // The markup already prints phrase 0 in full, so the first action is to
  // erase it. Starting with deleting=false made the first tick increment past
  // the string length, so `i === word.length` never matched and it sat on the
  // same full phrase forever.
  let p = 0, i = phrases[0].length, deleting = true, timer;
  const TYPE = 55, ERASE = 28, HOLD = 1900, GAP = 320;

  const tick = () => {
    const word = phrases[p];
    i += deleting ? -1 : 1;
    out.textContent = word.slice(0, i);

    let wait = deleting ? ERASE : TYPE;
    if (!deleting && i === word.length) { deleting = true; wait = HOLD; }
    else if (deleting && i === 0) { deleting = false; p = (p + 1) % phrases.length; wait = GAP; }
    timer = setTimeout(tick, wait);
  };
  timer = setTimeout(tick, HOLD);

  // A tab in the background still runs timers; stop burning them.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else { clearTimeout(timer); timer = setTimeout(tick, GAP); }
  });
}

/* The portrait is optional. CSP blocks inline onerror (hashes do not cover
   event handlers), so the fallback lives here: if portrait.jpg is missing the
   img is removed and the monogram beneath it shows. Drop a square photo at
   portrait.jpg and it takes over with no other change. */
export function initPortrait() {
  const img = document.querySelector('[data-portrait]');
  if (!img) return;
  const drop = () => img.remove();
  if (img.complete && img.naturalWidth === 0) drop();
  img.addEventListener('error', drop, { once: true });
}

/* The rail becomes a drawer below 1080px. Focus moves into it on open and
   returns to the trigger on close, and Escape dismisses it. */
export function initDrawer() {
  const btn = document.querySelector('[data-drawer-toggle]');
  const rail = document.getElementById('sidebar');
  const veil = document.querySelector('[data-drawer-veil]');
  if (!btn || !rail || !veil) return;

  const set = (open) => {
    rail.dataset.open = String(open);
    veil.dataset.open = String(open);
    veil.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) rail.querySelector('a, button')?.focus({ preventScroll: true });
    else btn.focus({ preventScroll: true });
  };

  btn.addEventListener('click', () => set(rail.dataset.open !== 'true'));
  veil.addEventListener('click', () => set(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && rail.dataset.open === 'true') set(false);
  });
  // Following a link should close the drawer, or the destination stays hidden
  // behind it.
  rail.addEventListener('click', (e) => {
    if (e.target.closest('a[href^="#"]') && matchMedia('(max-width: 1080px)').matches) set(false);
  });
}

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
    if (!ink) return;                       // vertical rail: no ink to move
    if (!link) { ink.dataset.on = 'false'; return; }
    // Read the link's own horizontal padding rather than hard-coding --s-3;
    // duplicating a CSS value in JS silently breaks when the token changes.
    const pad = parseFloat(getComputedStyle(link).paddingLeft) || 12;
    const navRect = nav.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    const x = r.left - navRect.left + pad;
    const w = Math.max(r.width - pad * 2, 12);
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
    // #top is a zero-height anchor span, so the observer never reports it and
    // the first nav item stayed unmarked at the top of the page. Fall back to
    // it while the page is still near the top.
    let active = targets.find((t) => visible.has(t.el.id));
    if (!active && window.scrollY < window.innerHeight * 0.6) active = targets[0];
    links.forEach((a) => {
      // 'location' is the correct aria-current token for in-page navigation.
      if (active && a === active.a) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    moveInk(active ? active.a : null);
  }, { rootMargin: '-20% 0px -68% 0px' });

  targets.forEach((t) => spy.observe(t.el));

  // The panels open on :focus-within, so Escape closes one by moving focus
  // back to the trigger and out of the panel.

  // The ink is positioned from measured geometry, so it has to be recomputed
  // when that geometry changes.
  addEventListener('resize', () => {
    const cur = links.find((a) => a.hasAttribute('aria-current'));
    if (cur) moveInk(cur);
  }, { passive: true });

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
/* Reveals the back-to-top control once the page has scrolled a screen. */
/* Counts the impact figures up as they arrive.
   An earlier version of this froze part-way and left wrong numbers on screen,
   so the loop is driven by ELAPSED TIME with a hard end, not by accumulating
   increments: whatever happens to the frame rate, the last write is always
   the exact target. A watchdog also force-completes if rAF is throttled. */
/* Splits section headings into words so they can arrive one after another.
   Only bare text is split: the visually-hidden section prefix and any inline
   markup are left alone, so the accessible name is unchanged. Words are
   inline spans, which screen readers concatenate normally. */
/* The hero drifts up and dims slightly as it leaves, so the first scroll has
   something to respond to rather than the page simply sliding. Driven off a
   rAF-throttled scroll listener; nothing reads layout in the handler. */
export function initHeroParallax() {
  const hero = document.querySelector('.hero-inner');
  if (!hero || prefersReducedMotion) return;
  let queued = false;
  const paint = () => {
    queued = false;
    const y = window.scrollY;
    const h = window.innerHeight;
    if (y > h) return;                       // past the hero: stop working
    const t = Math.min(1, y / (h * 0.85));
    hero.style.setProperty('--hero-shift', `${(t * -38).toFixed(1)}px`);
    hero.style.setProperty('--hero-fade', String(1 - t * 0.75));
  };
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paint);
  }, { passive: true });
  paint();
}

export function initSplitHeadings() {
  const heads = [...document.querySelectorAll('[data-split]')];
  if (!heads.length) return;
  if (prefersReducedMotion) return;   // nothing to stagger

  heads.forEach((h) => {
    [...h.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const text = node.textContent;
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((chunk) => {
        if (!chunk.trim()) { frag.append(chunk); return; }
        const w = document.createElement('span');
        w.className = 'w';
        w.textContent = chunk;
        frag.append(w);
      });
      node.replaceWith(frag);
    });
    // Index each word so CSS can stagger without a per-word inline style.
    [...h.querySelectorAll('.w')].forEach((w, i) => w.style.setProperty('--w-i', Math.min(i, 12)));
  });
}

export function initCounters() {
  const els = [...document.querySelectorAll('[data-count]')];
  if (!els.length) return;

  const settle = (el, target) => { el.textContent = String(target); };

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => settle(el, Number(el.dataset.count)));
    return;
  }

  const run = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    // Short on purpose. Every frame before the last shows a number that is
    // not true, and on a page whose whole argument is "these figures are
    // real", a long count is a long time spent displaying a wrong one.
    const DUR = 700;
    const start = performance.now();
    let done = false;
    const finish = () => { if (!done) { done = true; settle(el, target); } };
    // If the tab is backgrounded mid-count, rAF stops; land on the real value.
    const watchdog = setTimeout(finish, DUR + 600);

    const step = (now) => {
      if (done) return;
      const t = Math.min(1, (now - start) / DUR);
      const eased = 1 - Math.pow(1 - t, 3);          // ease-out-cubic
      const from = Number(el.dataset.from || 0);
      el.textContent = String(Math.round(from + (target - from) * eased));
      if (t < 1) requestAnimationFrame(step);
      else { clearTimeout(watchdog); finish(); }
    };
    // Small figures start partway: counting 0,1,2,3,4 to reach 5 spends most
    // of the animation on a number that misrepresents the work.
    const from = target <= 40 ? Math.floor(target * 0.4) : 0;
    el.dataset.from = String(from);
    el.textContent = String(from);
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      run(e.target);
    });
  }, { rootMargin: '0px 0px -18% 0px' });

  els.forEach((el) => io.observe(el));
}

export function initToTop() {
  const btn = document.querySelector('[data-to-top]');
  if (!btn) return;
  const update = () => { btn.dataset.on = String(window.scrollY > window.innerHeight * 0.8); };
  addEventListener('scroll', update, { passive: true });
  update();
}

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
