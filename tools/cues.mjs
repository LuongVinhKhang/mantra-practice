/* Build-time helper — NOT shipped to the browser.
 *
 * Turns a WebVTT/SubRip caption file into the `cues` array that data.js
 * carries, and refuses to emit anything unless every cue text matches the
 * corresponding line of the stored text exactly. The sacred texts are stored
 * verbatim; timings must be fitted to them, never the other way round.
 *
 *   node tools/cues.mjs <caption-file> <text-id>
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function toSeconds(stamp) {
  const parts = String(stamp).trim().replace(',', '.').split(':');
  let s = 0;
  for (const p of parts) s = s * 60 + parseFloat(p);
  return Number.isFinite(s) ? s : 0;
}

const TIME_LINE = /(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}/;

function parseCues(raw) {
  const text = String(raw || '').replace(/\r\n?/g, '\n').replace(/^﻿/, '');
  const cues = [];
  for (const block of text.split(/\n{2,}/)) {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    const ti = lines.findIndex((l) => TIME_LINE.test(l));
    if (ti === -1) continue;
    const range = lines[ti].split('-->');
    const start = toSeconds(range[0]);
    const end = toSeconds((range[1] || '').split(/\s+/).filter(Boolean)[0] || '');
    const body = lines.slice(ti + 1).join(' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (body) cues.push({ start, end, text: body });
  }
  cues.sort((a, b) => a.start - b.start);
  return cues;
}

const [file, id] = process.argv.slice(2);
if (!file || !id) { console.error('usage: node tools/cues.mjs <caption-file> <text-id>'); process.exit(2); }

const sandbox = { window: {} };
vm.runInNewContext(readFileSync(new URL('../js/data.js', import.meta.url), 'utf8'), sandbox);
const entry = sandbox.window.Mantra.TEXTS.find((t) => t.id === id);
if (!entry) { console.error(`no text with id "${id}"`); process.exit(1); }

const cues = parseCues(readFileSync(file, 'utf8'));
const lines = entry.text.split('\n');

let bad = 0;
if (cues.length !== lines.length) {
  console.error(`MISMATCH: ${cues.length} cues vs ${lines.length} lines`);
  bad++;
}
const n = Math.min(cues.length, lines.length);
for (let i = 0; i < n; i++) {
  if (cues[i].text !== lines[i]) {
    console.error(`line ${i + 1}\n  cue:  ${cues[i].text}\n  text: ${lines[i]}`);
    bad++;
  }
}
if (bad) { console.error(`\n${bad} problem(s) — nothing emitted.`); process.exit(1); }

const round = (x) => Math.round(x * 100) / 100;
const out = cues.map((c) => `[${round(c.start)},${round(c.end)}]`);
const wrapped = [];
for (let i = 0; i < out.length; i += 6) wrapped.push('      ' + out.slice(i, i + 6).join(', '));
console.log(`OK — ${cues.length} cues match all ${lines.length} lines of "${id}".\n`);
console.log('    cues: [\n' + wrapped.join(',\n') + '\n    ],');
