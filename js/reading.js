/* Mantra Practice — the pronunciation line.
 *
 * Per-character lookup in js/readings.js, with a small override table for
 * fixed Buddhist compounds where the chanted reading differs from the
 * character-by-character one.
 */
(function (M) {
  'use strict';

  /* 南無 is the big one: character by character it is "nam vô", but every
   * Vietnamese Buddhist chants "nam mô" (the 無 here carries its mó reading).
   * Keep this list short and only for readings you are sure of. */
  var OVERRIDES = {
    '南無': ['nam', 'mô'],
    '般若': ['bát', 'nhã']
  };
  var MAX_OVERRIDE = 2;   // longest key above, in characters

  var MISSING = '·';

  /* One reading per content character, in order — same length and same order
   * as segmentWriting(text), so a practice item at character offset N lines up
   * with readingArray(...)[N].
   *
   * Overrides are matched across the WHOLE text, not per item. That is the
   * point: in 南無觀世音菩薩 the second character must read "mô", and it still
   * must read "mô" when writing mode shows 無 on its own. Every override maps
   * n characters to exactly n readings, so the alignment always holds.
   *
   * kind: 0 = Hán-Việt, 1 = pinyin */
  function readingArray(text, kind) {
    var table = M.READINGS;
    if (!table) return [];               // readings.js has not loaded yet

    var cs = M.segmentWriting(text);     // content characters only
    var out = [];
    var i = 0;

    while (i < cs.length) {
      var hit = null;
      if (kind === 0) {
        for (var n = MAX_OVERRIDE; n >= 2; n--) {
          var seq = cs.slice(i, i + n).join('');
          if (OVERRIDES[seq]) { hit = { r: OVERRIDES[seq], n: n }; break; }
        }
      }
      if (hit) {
        out = out.concat(hit.r);
        i += hit.n;
      } else {
        var row = table[cs[i]];
        out.push((row && row[kind]) || MISSING);
        i++;
      }
    }
    return out;
  }

  /* Convenience for a standalone string — same rules, joined. */
  function reading(text, kind) {
    return readingArray(text, kind).join(' ');
  }

  M.reading = reading;
  M.readingArray = readingArray;
  M.readingOverrides = OVERRIDES;

})(window.Mantra = window.Mantra || {});
