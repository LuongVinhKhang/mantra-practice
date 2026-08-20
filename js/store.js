/* Mantra Practice — everything remembered between visits.
 *
 * localStorage only. Nothing is sent anywhere. Every call is wrapped because
 * some browsers throw on localStorage in private mode or over file://; when
 * that happens the app simply stops remembering and keeps working.
 */
(function (M) {
  'use strict';

  var KEY = 'mantra.v1';

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
  }

  function write(obj) {
    try { window.localStorage.setItem(KEY, JSON.stringify(obj)); return true; }
    catch (e) { return false; }
  }

  function patch(changes) {
    var o = read();
    for (var k in changes) { if (changes.hasOwnProperty(k)) o[k] = changes[k]; }
    write(o);
    return o;
  }

  function available() {
    try {
      window.localStorage.setItem(KEY + '.probe', '1');
      window.localStorage.removeItem(KEY + '.probe');
      return true;
    } catch (e) { return false; }
  }

  /* Timings tapped in by hand, per text. They live here rather than in
   * data.js because they belong to whoever recorded them — until they are
   * copied out and committed, at which point everyone gets them. */
  function cuesFor(textId) {
    var all = read().cues;
    var c = all && all[textId];
    return (c && c.length) ? c : null;
  }

  function saveCues(textId, cues) {
    var all = read().cues || {};
    all[textId] = cues;
    return patch({ cues: all });
  }

  function clearCues(textId) {
    var all = read().cues || {};
    delete all[textId];
    return patch({ cues: all });
  }

  M.store = {
    read: read,
    write: write,
    patch: patch,
    available: available,
    cuesFor: cuesFor,
    saveCues: saveCues,
    clearCues: clearCues,
    clearSession: function () { patch({ session: null }); }
  };

})(window.Mantra = window.Mantra || {});
