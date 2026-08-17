/* Mantra Practice — your own recording, played locally.
 *
 * The file NEVER leaves the browser. It is read through URL.createObjectURL,
 * which hands the <audio> element a pointer to the file already on your
 * device; nothing is uploaded, copied into the page, or stored on a server.
 * That also keeps the repository free of copyrighted recordings.
 *
 * Optionally a subtitle file (.vtt or .srt — what yt-dlp writes next to the
 * audio) turns playback into a follow-along: each cue becomes one practice
 * item and the app advances exactly when the reciter does.
 */
(function (M) {
  'use strict';

  /* "00:01:02.066" or "00:01:02,066" or "01:02.066" → seconds */
  function toSeconds(stamp) {
    var parts = String(stamp).trim().replace(',', '.').split(':');
    var s = 0;
    for (var i = 0; i < parts.length; i++) s = s * 60 + parseFloat(parts[i]);
    return isFinite(s) ? s : 0;
  }

  var TIME_LINE = /(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}/;

  /* Handles both WebVTT and SubRip. Returns [{start, end, text}] in order. */
  function parseCues(raw) {
    var text = String(raw || '').replace(/\r\n?/g, '\n').replace(/^﻿/, '');
    var blocks = text.split(/\n{2,}/);
    var cues = [];

    blocks.forEach(function (block) {
      var lines = block.split('\n').filter(function (l) { return l.trim() !== ''; });
      if (!lines.length) return;

      var ti = -1;
      for (var i = 0; i < lines.length; i++) {
        if (TIME_LINE.test(lines[i])) { ti = i; break; }
      }
      if (ti === -1) return;                       // header block, or a stray note

      var range = lines[ti].split('-->');
      var start = toSeconds(range[0]);
      var end = toSeconds((range[1] || '').split(/\s+/).filter(Boolean)[0] || '');
      var body = lines.slice(ti + 1)
        .join(' ')
        .replace(/<[^>]*>/g, '')                   // karaoke / styling tags
        .replace(/\s+/g, ' ')
        .trim();

      if (body) cues.push({ start: start, end: end, text: body });
    });

    cues.sort(function (a, b) { return a.start - b.start; });
    return cues;
  }

  /* Index of the cue covering `t`, or the last cue that has started.
   * -1 before the first cue. Callers poll this on timeupdate. */
  function cueAt(cues, t) {
    if (!cues || !cues.length) return -1;
    var lo = 0, hi = cues.length - 1, best = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (cues[mid].start <= t) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return best;
  }

  M.media = {
    parseCues: parseCues,
    cueAt: cueAt,
    toSeconds: toSeconds
  };

})(window.Mantra = window.Mantra || {});
