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

  M.store = {
    read: read,
    write: write,
    patch: patch,
    available: available,
    clearSession: function () { patch({ session: null }); }
  };

})(window.Mantra = window.Mantra || {});
