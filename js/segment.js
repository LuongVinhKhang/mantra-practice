/* Mantra Practice — text → practice items.
 *
 * This is the deliberately-dumb, deliberately-swappable part. No linguistics,
 * no dictionary, no NLP. When you want smarter phrase splitting later, replace
 * ONLY segmentChanting() — nothing else in the app knows how items are made.
 */
(function (M) {
  'use strict';

  /* Characters that are structure, not content. Stripped in writing mode and
   * used as segment boundaries in chanting mode. */
  var PUNCT = new Set(Array.from(
    '，。、；：！？،…—–－‧·・「」『』（）〔〕【】《》〈〉〖〗｛｝［］' +
    ',.;:!?()[]{}<>"\'`~@#$%^&*_=+|\\/' +
    '“”‘’„«»' +
    '－—–‑' +
    '。'
  ));

  function isSpace(ch) { return /\s/.test(ch); }
  function isPunct(ch) { return PUNCT.has(ch); }
  function isSkippable(ch) { return isSpace(ch) || isPunct(ch); }

  /* Array.from — NOT split('') — so characters outside the BMP
   * (rare CJK Ext-B glyphs, e.g. 𠀀) survive as one item instead of
   * being cut into two broken halves. */
  function chars(text) { return Array.from(String(text || '')); }

  /* Writing mode: one content character per item. */
  function segmentWriting(text) {
    return chars(text).filter(function (ch) { return !isSkippable(ch); });
  }

  /* Split a run of characters that has no punctuation into balanced chunks,
   * so a long unpunctuated paste does not become one unreadable item. */
  function chunkRun(run, max, target) {
    if (run.length <= max) return [run.join('')];
    var parts = Math.ceil(run.length / target);
    var size = Math.ceil(run.length / parts);
    var out = [];
    for (var i = 0; i < run.length; i += size) {
      out.push(run.slice(i, i + size).join(''));
    }
    return out;
  }

  /* Chanting mode: break on punctuation and line breaks first (that is where
   * a real text already tells you to breathe), then chunk anything still too
   * long to read in one breath. */
  function segmentChanting(text, opts) {
    opts = opts || {};
    /* Whatever spacing the source already has IS the phrasing — the person who
     * wrote it down knew where the breaths go. Chunking is only a fallback for
     * text with no phrasing at all, so `max` is set above every real phrase we
     * have seen: 千字文 4, Manjushri 9, 21 Taras 7, 楞嚴咒 up to 13. An
     * 8-character limit would have split every Manjushri line into 5+4 and cut
     * 陀突嚧迦建咄嚧吉知婆路多毗 in half. */
    var max = opts.max || 16;      // longest item we leave alone
    var target = opts.target || 8; // preferred item length when chunking

    var items = [];
    var run = [];

    chars(text).forEach(function (ch) {
      if (isSkippable(ch)) {
        if (run.length) { items = items.concat(chunkRun(run, max, target)); run = []; }
      } else {
        run.push(ch);
      }
    });
    if (run.length) items = items.concat(chunkRun(run, max, target));

    return items;
  }

  /* Single entry point used by the UI. */
  function segment(text, mode) {
    return mode === 'chanting' ? segmentChanting(text) : segmentWriting(text);
  }

  /* Repeat the whole sequence N times (108 recitations, etc.). */
  function repeat(items, times) {
    var n = Math.max(1, Math.floor(Number(times) || 1));
    if (n === 1) return items.slice();
    var out = [];
    for (var i = 0; i < n; i++) out = out.concat(items);
    return out;
  }

  M.segment = segment;
  M.segmentWriting = segmentWriting;
  M.segmentChanting = segmentChanting;
  M.repeat = repeat;
  M.chars = chars;

})(window.Mantra = window.Mantra || {});
