/* Mantra Practice — read the current item aloud.
 *
 * Uses the browser's own speechSynthesis. No network, no API key, no audio
 * files. Two honest limitations, surfaced in the UI rather than hidden:
 *
 *   1. It reads MODERN pronunciation. A transliterated mantra like 楞嚴咒 was
 *      written to carry Sanskrit sounds; a Mandarin voice reading it is a
 *      rough guide, not correct recitation.
 *   2. Voices are whatever the device has. Cantonese (yue-HK) and Vietnamese
 *      are common on iOS/macOS and hit-and-miss elsewhere, so the UI only
 *      offers languages a voice actually exists for.
 */
(function (M) {
  'use strict';

  var LANGS = [
    { id: 'zh-TW', match: ['zh-tw', 'zh-hk', 'zh-hant', 'cmn-hant'] },
    { id: 'zh-CN', match: ['zh-cn', 'zh-hans', 'cmn-hans', 'zh'] },
    { id: 'yue-HK', match: ['yue', 'zh-yue', 'zh-hk'] },
    { id: 'vi-VN', match: ['vi'] },
    { id: 'en-US', match: ['en'] }
  ];

  var voices = [];

  function supported() {
    return typeof window !== 'undefined' &&
           'speechSynthesis' in window &&
           typeof window.SpeechSynthesisUtterance === 'function';
  }

  function refresh() {
    if (!supported()) { voices = []; return voices; }
    try { voices = window.speechSynthesis.getVoices() || []; }
    catch (e) { voices = []; }
    return voices;
  }

  function voiceFor(langId) {
    var spec = null, i;
    for (i = 0; i < LANGS.length; i++) if (LANGS[i].id === langId) spec = LANGS[i];
    if (!spec) return null;

    var list = voices.length ? voices : refresh();
    /* Exact tag first, then any prefix the language is known by. */
    for (i = 0; i < list.length; i++) {
      if (String(list[i].lang).toLowerCase().replace('_', '-') === langId.toLowerCase()) return list[i];
    }
    for (i = 0; i < list.length; i++) {
      var vl = String(list[i].lang).toLowerCase().replace('_', '-');
      for (var k = 0; k < spec.match.length; k++) {
        if (vl.indexOf(spec.match[k]) === 0) return list[i];
      }
    }
    return null;
  }

  /* Only offer languages this device can actually speak. */
  function available() {
    if (!supported()) return [];
    refresh();
    return LANGS.filter(function (l) { return !!voiceFor(l.id); })
                .map(function (l) { return l.id; });
  }

  function cancel() {
    if (!supported()) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }

  function speak(text, langId, rate) {
    if (!supported() || !text) return false;
    var v = voiceFor(langId);
    if (!v) return false;
    cancel();
    try {
      var u = new window.SpeechSynthesisUtterance(text);
      u.voice = v;
      u.lang = v.lang;
      u.rate = rate || 0.85;   // slower than default; this is practice, not news
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  if (supported() && typeof window.speechSynthesis.addEventListener === 'function') {
    /* Chrome populates the voice list asynchronously. */
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
  }

  M.speech = {
    supported: supported,
    available: available,
    voiceFor: voiceFor,
    speak: speak,
    cancel: cancel,
    refresh: refresh,
    LANGS: LANGS
  };

})(window.Mantra = window.Mantra || {});
