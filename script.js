/* ============================================================
   NIKESH WALIA — PORTFOLIO SCRIPT
   ============================================================ */

'use strict';

/* ── 01 · PRELOADER ──────────────────────────────────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('gone');
    document.body.style.overflow = '';
  }, 1050);
});
document.body.style.overflow = 'hidden';

/* ── 02 · SCROLL PROGRESS BAR ────────────────────────────── */
const progressEl = document.getElementById('progress');
window.addEventListener('scroll', () => {
  const total = document.body.scrollHeight - window.innerHeight;
  progressEl.style.width = (window.scrollY / total * 100) + '%';
}, { passive: true });

/* ── 03 · NAVBAR SCROLL ──────────────────────────────────── */
const navEl = document.getElementById('nav');
window.addEventListener('scroll', () => {
  navEl.classList.toggle('solid', window.scrollY > 60);
}, { passive: true });

/* ── 04 · MOBILE DRAWER ──────────────────────────────────── */
const hamBtn  = document.getElementById('hamBtn');
const drawer  = document.getElementById('drawer');
const overlay = document.getElementById('drawerOverlay');
const drawerX = document.getElementById('drawerX');

function openDrawer() {
  drawer.classList.add('open');
  overlay.classList.add('open');
  hamBtn.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  hamBtn.classList.remove('is-open');
  document.body.style.overflow = '';
}

hamBtn.addEventListener('click', openDrawer);
drawerX.addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);

// Close on any drawer link click
document.querySelectorAll('#drawer a').forEach(link => {
  link.addEventListener('click', closeDrawer);
});

// Close on ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDrawer();
});

/* ── 05 · CUSTOM CURSOR ──────────────────────────────────── */
const cRing = document.getElementById('cRing');
const cDot  = document.getElementById('cDot');
let mX = 0, mY = 0, rX = 0, rY = 0;

document.addEventListener('mousemove', e => {
  mX = e.clientX; mY = e.clientY;
  cDot.style.transform = `translate(${mX}px,${mY}px) translate(-50%,-50%)`;
}, { passive: true });

(function rafCursor() {
  rX += (mX - rX) * 0.12;
  rY += (mY - rY) * 0.12;
  cRing.style.transform = `translate(${rX}px,${rY}px) translate(-50%,-50%)`;
  requestAnimationFrame(rafCursor);
})();

const hoverEls = 'a, button, .proj-card, .ab-card, .sk-card, .why-card, .c-card';
document.querySelectorAll(hoverEls).forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cur-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cur-hover'));
});

/* ── 06 · TYPING EFFECT ──────────────────────────────────── */
const phrases  = ['QA Engineer', 'Automation Tester', 'Selenium Expert', 'SQL Specialist', 'Bug Hunter'];
const typedEl  = document.getElementById('typed');
let pIdx = 0, cIdx = 0, del = false;

function type() {
  const phrase = phrases[pIdx];
  typedEl.textContent = del ? phrase.slice(0, --cIdx) : phrase.slice(0, ++cIdx);
  let ms = del ? 50 : 88;
  if (!del && cIdx === phrase.length) { ms = 2200; del = true; }
  else if (del && cIdx === 0)         { del = false; pIdx = (pIdx + 1) % phrases.length; ms = 400; }
  setTimeout(type, ms);
}
setTimeout(type, 1200);

/* ── 07 · SCROLL REVEAL ──────────────────────────────────── */
const rvItems = document.querySelectorAll('.rv');
const rvIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('show');
      rvIO.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });
rvItems.forEach(el => rvIO.observe(el));

/* ── 08 · COUNTER ANIMATION ──────────────────────────────── */
function countUp(el, target, suffix, isFloat) {
  const dur = 1900, start = performance.now();
  const run = now => {
    const p    = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 4);
    const val  = isFloat ? (target * ease).toFixed(1) : Math.floor(target * ease);
    el.textContent = val + suffix;
    if (p < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

// Hero stats
let heroCountDone = false;
const heroStatsEl = document.querySelector('.h-stats');
if (heroStatsEl) {
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !heroCountDone) {
      heroCountDone = true;
      heroStatsEl.querySelectorAll('[data-n]').forEach(el => {
        countUp(el, parseFloat(el.dataset.n), el.dataset.s || '', 'float' in el.dataset);
      });
    }
  }, { threshold: 0.4 }).observe(heroStatsEl);
}

// Big stat in about
const bigStatEl = document.querySelector('.ab-big[data-n]');
if (bigStatEl) {
  let done = false;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !done) {
      done = true;
      countUp(bigStatEl, parseFloat(bigStatEl.dataset.n), bigStatEl.dataset.s || '', 'float' in bigStatEl.dataset);
    }
  }, { threshold: 0.5 }).observe(bigStatEl);
}

/* ── 09 · SKILL BAR ANIMATION ────────────────────────────── */
const skIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.sk-fill').forEach((bar, i) => {
        setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, i * 110);
      });
      skIO.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.sk-card').forEach(c => skIO.observe(c));

/* ── 10 · 3D CARD TILT ───────────────────────────────────── */
document.querySelectorAll('.proj-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const x  = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
    const y  = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
    card.style.transform = `perspective(1100px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ── 11 · MAGNETIC BUTTONS ───────────────────────────────── */
document.querySelectorAll('.btn-lime, .btn-ghost, .c-card').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r  = el.getBoundingClientRect();
    const x  = e.clientX - r.left - r.width  / 2;
    const y  = e.clientY - r.top  - r.height / 2;
    el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    el.style.transition = 'transform 0.08s';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
    el.style.transition = 'transform 0.5s cubic-bezier(.16,1,.3,1), border-color 0.25s, background 0.25s, box-shadow 0.35s';
  });
});

/* ── 12 · PARALLAX HERO BLOBS ────────────────────────────── */
const blob1 = document.querySelector('.h-blob-1');
const blob2 = document.querySelector('.h-blob-2');
if (blob1 && blob2) {
  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    blob1.style.transform = `translate(${dx * 26}px, ${dy * 20}px)`;
    blob2.style.transform = `translate(${-dx * 18}px, ${-dy * 14}px)`;
  }, { passive: true });
}

/* ── 13 · ACTIVE NAV LINK ────────────────────────────────── */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('#navMenu a:not(.nav-cta-pill)');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
  });
  navLinks.forEach(a => {
    a.style.color = (a.getAttribute('href') === `#${current}`) ? 'var(--t1)' : '';
  });
}, { passive: true });
