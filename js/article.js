/**
 * Article pages. They share the home page's tokens, palette and progress bar
 * but none of its rail, spy or case-study machinery, so this imports the two
 * things a piece of prose actually needs rather than pulling in main.js.
 */

import * as theme from './theme.js';
import { initProgress } from './ui.js';

theme.init();
initProgress();

/* Reading time, measured rather than guessed. 220 wpm is the usual figure for
   technical prose; code blocks are scanned, not read, so they count at a
   quarter weight instead of inflating the estimate. */
const slot = document.querySelector('[data-read-time]');
if (slot) {
  const body = document.querySelector('.art-body');
  const code = [...body.querySelectorAll('pre')];
  const codeWords = code.reduce((n, el) => n + el.textContent.trim().split(/\s+/).length, 0);
  const clone = body.cloneNode(true);
  clone.querySelectorAll('pre').forEach((el) => el.remove());
  const proseWords = clone.textContent.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round((proseWords + codeWords * 0.25) / 220));
  slot.textContent = `${minutes} minute read`;
}
