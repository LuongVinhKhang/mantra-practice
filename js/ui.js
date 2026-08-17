/* Mantra Practice — all DOM code lives here.
 * Nothing above this file touches the document.
 */
(function (M) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var el = {
    screens:   document.querySelectorAll('.screen'),
    home:      $('screen-home'),
    practice:  $('screen-practice'),
    done:      $('screen-done'),

    resumeBox:   $('resume-box'),
    resumeText:  $('resume-text'),
    resumeGo:    $('resume-go'),
    resumeClear: $('resume-clear'),

    select:    $('text-select'),
    input:     $('text-input'),
    preview:      $('preview'),
    meta:         $('preview-meta'),
    previewItems: $('preview-items'),
    previewHint:  $('preview-hint'),
    speedField:$('speed-field'),
    speed:     $('speed-select'),
    repeat:    $('repeat-input'),
    optHv:     $('opt-hv'),
    optPy:     $('opt-py'),
    optYue:    $('opt-yue'),
    lang:      $('lang-select'),
    speakField:$('speak-field'),
    speak:     $('speak-select'),
    speakNote: $('speak-note'),
    btnSpeak:  $('btn-speak'),
    sizeDown:  $('size-down'),
    sizeUp:    $('size-up'),
    sizeVal:   $('size-val'),
    start:     $('start-btn'),
    error:     $('home-error'),
    share:     $('share-btn'),
    shareNote: $('share-note'),

    stage:     $('stage'),
    item:      $('item'),
    readHv:    $('reading-hv'),
    readPy:    $('reading-py'),
    readYue:   $('reading-yue'),
    counter:   $('counter'),
    counterTxt:$('counter-text'),
    fill:      $('bar-fill'),
    prev:      $('btn-prev'),
    toggle:    $('btn-toggle'),
    next:      $('btn-next'),
    restart:   $('btn-restart'),
    exit:      $('btn-exit'),
    again:     $('btn-again'),
    homeBtn:   $('btn-home'),

    modal:     $('confirm'),
    cancel:    $('confirm-cancel'),
    replace:   $('confirm-replace'),

    audioField: $('audio-field'),
    audioFile:  $('audio-file'),
    cueFile:    $('cue-file'),
    audioStatus:$('audio-status'),
    audioClear: $('audio-clear'),
    audio:      $('audio'),

    overview:  $('overview'),
    ovTitle:   $('ov-title'),
    ovGrid:    $('ov-grid'),
    ovClose:   $('ov-close')
  };

  var state = {
    loadedId: 'custom',
    loadedSnapshot: '',   // what we last injected, to detect user edits
    lastSelect: 'custom',
    pendingId: null,
    engine: null,
    session: null,        // {items, mode, auto, intervalMs, textId, …}
    scale: 1,             // text-size multiplier
    wakeLock: null,
    audioUrl: null,       // object URL for the local recording
    audioName: '',
    cues: null,           // [{start,end,text}] from a .vtt/.srt, or null
    cueName: ''
  };

  var MIN_SCALE = 0.6, MAX_SCALE = 1.8, SCALE_STEP = 0.15;

  /* ── helpers ───────────────────────────────────────────────────── */

  function show(screen) {
    for (var i = 0; i < el.screens.length; i++) {
      el.screens[i].classList.remove('is-active');
    }
    screen.classList.add('is-active');
  }

  function textById(id) {
    for (var i = 0; i < M.TEXTS.length; i++) {
      if (M.TEXTS[i].id === id) return M.TEXTS[i];
    }
    return null;
  }

  function currentMode() {
    var r = document.querySelector('input[name="mode"]:checked');
    return r ? r.value : M.DEFAULTS.mode;
  }

  function currentProgression() {
    var r = document.querySelector('input[name="prog"]:checked');
    return r ? r.value : M.DEFAULTS.progression;
  }

  function isDirty() {
    return el.input.value.trim() !== '' && el.input.value !== state.loadedSnapshot;
  }

  /* English needs singular/plural; Vietnamese and Chinese do not mark number,
   * so both keys hold the same word there and this is a no-op for them. */
  function unit(n, singularKey, pluralKey) {
    return n + ' ' + M.i18n.t(n === 1 ? singularKey : pluralKey);
  }

  /* ── preferences ───────────────────────────────────────────────── */

  function prefs() {
    return {
      textId: el.select.value,
      mode: currentMode(),
      prog: currentProgression(),
      speed: el.speed.value,
      repeat: clampRepeat(el.repeat.value),
      hv: el.optHv.checked,
      py: el.optPy.checked,
      yue: el.optYue.checked,
      lang: M.i18n.current(),
      speak: el.speak.value,
      scale: state.scale
    };
  }

  function savePrefs() { M.store.patch({ prefs: prefs() }); }

  function applyPrefs(p) {
    if (!p) return;
    if (p.mode) {
      var m = document.querySelector('input[name="mode"][value="' + p.mode + '"]');
      if (m) m.checked = true;
    }
    if (p.prog) {
      var g = document.querySelector('input[name="prog"][value="' + p.prog + '"]');
      if (g) g.checked = true;
    }
    if (p.speed)  el.speed.value = p.speed;
    if (p.repeat) el.repeat.value = clampRepeat(p.repeat);
    el.optHv.checked = !!p.hv;
    el.optPy.checked = !!p.py;
    el.optYue.checked = !!p.yue;
    if (p.speak && hasSpeakOption(p.speak)) el.speak.value = p.speak;
    if (p.scale) setScale(p.scale, true);
  }

  function setScale(v, silent) {
    state.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(v) || 1));
    el.sizeVal.textContent = Math.round(state.scale * 100) + '%';
    if (state.engine && !state.engine.finished) {
      fitItem(state.engine.items[state.engine.index]);
    }
    if (!silent) savePrefs();
  }

  /* ── home screen ───────────────────────────────────────────────── */

  var GROUP_ORDER = ['long', 'short', 'practice', 'custom'];

  function buildSelect() {
    var keep = el.select.value;
    el.select.textContent = '';
    GROUP_ORDER.forEach(function (g) {
      var members = M.TEXTS.filter(function (t) { return (t.group || 'custom') === g; });
      if (!members.length) return;
      var grp = document.createElement('optgroup');
      grp.label = M.i18n.t('group.' + g);
      members.forEach(function (t) {
        var o = document.createElement('option');
        o.value = t.id;
        o.textContent = t.name;
        grp.appendChild(o);
      });
      el.select.appendChild(grp);
    });
    el.select.value = keep && textById(keep) ? keep : 'custom';
  }

  function loadText(id) {
    var t = textById(id);
    if (!t) return;
    state.loadedId = id;
    if (id === 'custom') {
      /* Do not wipe what the user has: just hand the buffer back to them. */
      state.loadedSnapshot = '';
    } else {
      el.input.value = t.text;
      state.loadedSnapshot = t.text;
    }
    state.lastSelect = id;
    el.select.value = id;
    updateMeta();
    savePrefs();
  }

  function clampRepeat(v) {
    var n = Math.floor(Number(v));
    if (!isFinite(n) || n < 1) n = 1;
    if (n > 1080) n = 1080;
    return n;
  }

  var PREVIEW_ITEMS = 6;

  /* With a recording + timings loaded, one cue is one item — the segmenter
   * must not re-cut them, or the audio and the screen drift apart. The
   * preview has to agree with the practice screen, so both go through here. */
  function followActive(mode) {
    return !!(state.audioUrl && state.cues && mode === 'chanting');
  }

  function itemsFor(raw, mode) {
    return followActive(mode)
      ? state.cues.map(function (c) { return c.text; })
      : M.segment(raw, mode);
  }

  function updateMeta() {
    var raw = el.input.value;
    if (!raw.trim()) {
      el.preview.hidden = true;
      el.meta.textContent = '';
      el.previewItems.textContent = '';
      return;
    }
    el.preview.hidden = false;

    var mode = currentMode();
    var items = itemsFor(raw, mode);
    var reps = followActive(mode) ? 1 : clampRepeat(el.repeat.value);
    var line;

    var T = M.i18n.t;
    if (mode === 'writing') {
      /* Count content characters only — line breaks and punctuation are not
       * things you write, so counting them would overstate the session. */
      line = unit(items.length, 'preview.character', 'preview.chars') +
             ' ' + T('preview.toWrite');
    } else {
      line = unit(M.segmentWriting(raw).length, 'preview.character', 'preview.chars') +
             ' · ' +
             unit(items.length, 'preview.phrase', 'preview.phrases') +
             ' ' + T('preview.toChant');
    }
    if (reps > 1) {
      line += ' × ' + reps + ' = ' + (items.length * reps) + ' ' + T('preview.items');
    }
    el.meta.textContent = line;

    /* Show the first few items exactly as the practice screen will show them.
     * Switching mode visibly re-cuts these boxes, which is the whole point —
     * the counts alone do not make the difference obvious. */
    var frag = document.createDocumentFragment();
    var shown = Math.min(PREVIEW_ITEMS, items.length);
    for (var i = 0; i < shown; i++) {
      var cell = document.createElement('span');
      cell.className = 'pv-cell';
      cell.textContent = items[i];
      frag.appendChild(cell);
    }
    if (items.length > shown) {
      var more = document.createElement('span');
      more.className = 'pv-more';
      more.textContent = '+' + (items.length - shown);
      frag.appendChild(more);
    }
    el.previewItems.textContent = '';
    el.previewItems.appendChild(frag);

    el.previewHint.textContent = M.i18n.t(
      mode === 'writing' ? 'preview.write' : 'preview.chant');
  }

  /* Speed only means something when the app is advancing on a timer.
   * Disable rather than hide, so the layout does not shift. */
  function syncSpeedField() {
    var auto = currentProgression() === 'auto';
    el.speed.disabled = !auto;
    el.speedField.classList.toggle('is-off', !auto);
  }

  function setError(msg) {
    if (!msg) { el.error.hidden = true; el.error.textContent = ''; return; }
    el.error.hidden = false;
    el.error.textContent = msg;
  }

  /* ── replace-text confirmation ─────────────────────────────────── */

  function openConfirm(id) {
    state.pendingId = id;
    el.modal.hidden = false;
    el.cancel.focus();
  }

  function closeConfirm(accepted) {
    el.modal.hidden = true;
    var id = state.pendingId;
    state.pendingId = null;
    if (accepted && id) {
      loadText(id);
    } else {
      el.select.value = state.lastSelect;   // put the dropdown back
    }
  }

  el.select.addEventListener('change', function () {
    var id = el.select.value;
    if (id !== 'custom' && isDirty()) {
      openConfirm(id);
    } else {
      loadText(id);
    }
    setError('');
  });

  el.cancel.addEventListener('click', function () { closeConfirm(false); });
  el.replace.addEventListener('click', function () { closeConfirm(true); });

  /* ── practice ──────────────────────────────────────────────────── */

  /* Font size is driven by how many characters have to fit across the screen.
   * Past 9 characters a single line gets too small to chant from at arm's
   * length (a 13-character phrase came out at 25px on a phone), so long items
   * wrap onto two lines and the type roughly doubles. Verse lines of 7 or 9 —
   * the common case — stay on one line. */
  var WRAP_ABOVE = 9;

  function fitItem(text) {
    var len = Math.max(1, M.chars(text).length);
    var perLine = len > WRAP_ABOVE ? Math.ceil(len / 2) : len;
    var vw = (82 / perLine * state.scale).toFixed(2);
    var vh = (len === 1 ? 38 : (perLine === len ? 18 : 15)) * state.scale;
    el.item.style.fontSize = 'min(' + vw + 'vw, ' + vh.toFixed(2) + 'vh)';
  }

  /* Readings are computed once for the whole text, then sliced per item, so a
   * character keeps its in-context reading even when writing mode shows it
   * alone (無 stays "mô" inside 南無). */
  function sliceReading(list, index) {
    var s = state.session;
    if (!list || !s || !s.offsets.length) return '';
    var o = s.offsets[index % s.offsets.length];
    return list.slice(o[0], o[0] + o[1]).join(' ');
  }

  function renderReadings(index) {
    var s = state.session;
    el.readHv.hidden  = !(s && s.showHv);
    el.readPy.hidden  = !(s && s.showPy);
    el.readYue.hidden = !(s && s.showYue);
    if (s && s.showHv)  el.readHv.textContent  = sliceReading(s.rHv, index);
    if (s && s.showPy)  el.readPy.textContent  = sliceReading(s.rPy, index);
    if (s && s.showYue) el.readYue.textContent = sliceReading(s.rYue, index);
  }

  function render(s) {
    if (s.finished) {
      M.store.clearSession();
      M.speech.cancel();
      stopAudio();
      releaseWake();
      show(el.done);
      return;
    }

    el.item.textContent = s.item;
    fitItem(s.item);
    renderReadings(s.index);
    el.counterTxt.textContent = (s.index + 1) + ' / ' + s.total;
    el.fill.style.width = (((s.index + 1) / s.total) * 100).toFixed(2) + '%';

    if (s.auto) {
      el.toggle.hidden = false;
      el.toggle.textContent = M.i18n.t(s.playing ? 'btn.pause' : 'btn.resume');
      el.stage.classList.toggle('is-paused', !s.playing);
    } else if (state.session && state.session.followCues) {
      renderPausedState();
    } else {
      el.toggle.hidden = true;
      el.stage.classList.remove('is-paused');
    }

    saveSession(s.index);
    speakCurrent();
  }

  function saveSession(index) {
    if (!state.session) return;
    M.store.patch({
      session: {
        textId: state.session.textId,
        name: state.session.name,
        text: state.session.text,
        mode: state.session.mode,
        auto: state.session.auto,
        speed: state.session.speed,
        repeat: state.session.repeat,
        index: index,
        total: state.session.items.length
      }
    });
  }

  function startSession(session, startIndex) {
    state.session = session;
    if (state.engine) state.engine.destroy();
    state.engine = new M.Engine(session.items, {
      intervalMs: session.intervalMs,
      auto: session.auto,
      onChange: render
    });
    show(el.practice);
    state.engine.start(startIndex || 0);

    if (state.audioUrl) {
      if (session.followCues) {
        attachAudioFollow();
        var c = state.cues[Math.min(startIndex || 0, state.cues.length - 1)];
        try { el.audio.currentTime = c ? c.start : 0; } catch (e) {}
      }
      el.audio.play()['catch'](function () {});   // iOS may need a second tap
    }
    if (session.auto || state.audioUrl) requestWake();
  }

  function buildSession() {
    var raw = el.input.value;
    var mode = currentMode();
    var follow = followActive(mode);
    var base = itemsFor(raw, mode);
    if (!base.length) return null;

    var reps = clampRepeat(el.repeat.value);
    el.repeat.value = reps;
    var t = textById(el.select.value);

    /* Where each base item starts in the character-aligned reading array. */
    var offsets = [], pos = 0;
    base.forEach(function (it) {
      var n = M.chars(it).length;
      offsets.push([pos, n]);
      pos += n;
    });

    /* How many items each source line contributes, so the overview can show
     * one row per line of the original text instead of one long block. */
    var lineGroups = [];
    raw.split('\n').forEach(function (ln) {
      var n = M.segment(ln, mode).length;
      if (n) lineGroups.push(n);
    });
    if (!lineGroups.length) lineGroups = [base.length];
    if (follow) { lineGroups = [1]; reps = 1; }

    return {
      followCues: follow,
      items: M.repeat(base, reps),
      offsets: offsets,
      lineGroups: lineGroups,
      /* Hán-Việt is also needed when a Vietnamese voice is selected, even if
       * the reading line itself is switched off. */
      rHv:  (el.optHv.checked || M.speech.readsOf(el.speak.value) === 0)
              ? M.readingArray(raw, 0) : null,
      rPy:  el.optPy.checked  ? M.readingArray(raw, 1) : null,
      rYue: el.optYue.checked ? M.readingArray(raw, 2) : null,
      showHv:  el.optHv.checked,
      showPy:  el.optPy.checked,
      showYue: el.optYue.checked,
      text: raw,
      textId: el.select.value,
      name: (t && el.select.value !== 'custom') ? t.name : 'My own text',
      mode: mode,
      speed: el.speed.value,
      repeat: reps,
      auto: currentProgression() === 'auto',
      intervalMs: M.SPEEDS[mode][el.speed.value] || M.SPEEDS[mode].normal
    };
  }

  el.start.addEventListener('click', function () {
    var session = buildSession();
    if (!session) {
      setError(M.i18n.t(el.input.value.trim() ? 'err.punct' : 'err.empty'));
      return;
    }
    setError('');
    savePrefs();
    M.store.patch({ customText: el.input.value });
    startSession(session, 0);
  });

  function exitPractice() {
    M.speech.cancel();
    stopAudio();
    if (state.engine) {
      saveSession(state.engine.index);
      state.engine.destroy();
      state.engine = null;
    }
    releaseWake();
    showResume();
    show(el.home);
  }

  function seekToItem(i) {
    if (!state.session || !state.session.followCues || !state.cues[i]) return;
    try { el.audio.currentTime = state.cues[i].start; } catch (e) {}
  }
  el.prev.addEventListener('click', function () {
    if (!state.engine) return;
    state.engine.prev(); seekToItem(state.engine.index);
  });
  el.next.addEventListener('click', function () {
    if (!state.engine) return;
    state.engine.next(); seekToItem(state.engine.index);
  });
  function toggleAll() {
    if (state.session && state.session.followCues) {
      if (el.audio.paused) el.audio.play()['catch'](function () {});
      else el.audio.pause();
      renderPausedState();
      return;
    }
    if (state.audioUrl) {
      if (el.audio.paused) el.audio.play()['catch'](function () {}); else el.audio.pause();
    }
    if (state.engine) state.engine.toggle();
  }

  /* In follow mode the engine has no timer of its own, so the paused look has
   * to come from the audio element. */
  function renderPausedState() {
    if (!state.session || !state.session.followCues) return;
    var paused = el.audio.paused;
    el.toggle.hidden = false;
    el.toggle.textContent = M.i18n.t(paused ? 'btn.resume' : 'btn.pause');
    el.stage.classList.toggle('is-paused', paused);
  }

  el.toggle.addEventListener('click', toggleAll);
  el.restart.addEventListener('click', function () { state.engine && state.engine.restart(); });
  el.exit.addEventListener('click', exitPractice);

  /* Tap zones — left third / centre / right third of the character area. */
  el.stage.addEventListener('click', function (e) {
    var act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
    if (!act || !state.engine) return;
    if (act === 'prev') state.engine.prev();
    else if (act === 'next') state.engine.next();
    else if (state.engine.auto || state.session.followCues) toggleAll();
    else state.engine.next();
  });

  /* ── your own recording ────────────────────────────────────────── */

  function audioStatusText() {
    var T = M.i18n.t;
    if (!state.audioUrl) return T('audio.none');
    var line = T('audio.loaded') + ' · ' + state.audioName;
    line += state.cues
      ? '  ·  ' + T('audio.follow') + ' (' + state.cues.length + ' ' + T('audio.cues') + ')'
      : '  ·  ' + T('audio.nocues');
    return line;
  }

  function refreshAudioUi() {
    el.audioStatus.textContent = audioStatusText();
    el.audioClear.hidden = !state.audioUrl && !state.cues;
  }

  el.audioFile.addEventListener('change', function () {
    var f = el.audioFile.files && el.audioFile.files[0];
    if (!f) return;
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    /* createObjectURL points the <audio> element at the file already on this
     * device. Nothing is read into the page, uploaded, or persisted. */
    state.audioUrl = URL.createObjectURL(f);
    state.audioName = f.name;
    el.audio.src = state.audioUrl;
    updateMeta();
    refreshAudioUi();
  });

  el.cueFile.addEventListener('change', function () {
    var f = el.cueFile.files && el.cueFile.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      var cues = M.media.parseCues(reader.result);
      if (!cues.length) {
        state.cues = null;
        el.audioStatus.textContent = M.i18n.t('audio.badcue');
        return;
      }
      state.cues = cues;
      state.cueName = f.name;
      /* The cue lines become the text, so the preview, the overview and the
       * readings all line up with what the recording actually says. */
      el.input.value = cues.map(function (c) { return c.text; }).join('\n');
      state.loadedSnapshot = '';
      el.select.value = 'custom';
      state.lastSelect = 'custom';
      updateMeta();
      refreshAudioUi();
    };
    reader.readAsText(f);
  });

  el.audioClear.addEventListener('click', function () {
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    state.audioUrl = null; state.audioName = '';
    state.cues = null; state.cueName = '';
    el.audio.removeAttribute('src');
    el.audioFile.value = '';
    el.cueFile.value = '';
    updateMeta();
    refreshAudioUi();
  });

  /* Follow-along: the recording drives the index, so the app advances exactly
   * when the reciter does. */
  function attachAudioFollow() {
    el.audio.addEventListener('timeupdate', onAudioTime);
    el.audio.addEventListener('ended', onAudioEnded);
  }
  function detachAudioFollow() {
    el.audio.removeEventListener('timeupdate', onAudioTime);
    el.audio.removeEventListener('ended', onAudioEnded);
  }
  function onAudioTime() {
    var s = state.session;
    if (!s || !s.followCues || !state.engine || state.engine.finished) return;
    var i = M.media.cueAt(state.cues, el.audio.currentTime);
    if (i >= 0 && i !== state.engine.index) state.engine.jumpTo(i);
  }
  function onAudioEnded() {
    if (state.session && state.session.followCues && state.engine) {
      state.engine.finish();
    }
  }

  function stopAudio() {
    detachAudioFollow();
    try { el.audio.pause(); } catch (e) {}
  }

  /* ── overview map ──────────────────────────────────────────────── */

  function openOverview() {
    if (!state.engine || !state.session) return;
    var items = state.engine.items;
    var cur = state.engine.index;

    el.ovTitle.textContent = state.session.name + ' · ' + items.length +
                             ' ' + M.i18n.t('ov.items');

    /* One row per line of the source text. Packing everything into one
     * uniform block loses the verse structure and is unreadable — 二十一度母讚
     * is 7 characters per line and should look like it. */
    var groups = state.session.lineGroups;
    var frag = document.createDocumentFragment();
    var i = 0, g = 0;

    while (i < items.length) {
      var take = Math.min(groups[g % groups.length], items.length - i);
      var row = document.createElement('div');
      row.className = 'ov-row';

      /* Mark where each repetition of the text starts. */
      if (state.session.repeat > 1 && i % state.session.offsets.length === 0) {
        var tag = document.createElement('span');
        tag.className = 'ov-round';
        tag.textContent = '×' + (Math.floor(i / state.session.offsets.length) + 1);
        row.appendChild(tag);
      }

      for (var k = 0; k < take; k++, i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ov-cell' + (i === cur ? ' is-current' : '');
        b.setAttribute('data-i', i);
        b.textContent = items[i];
        row.appendChild(b);
      }
      frag.appendChild(row);
      g++;
    }
    el.ovGrid.textContent = '';
    el.ovGrid.appendChild(frag);

    el.overview.hidden = false;
    var node = el.ovGrid.querySelector('.is-current');
    if (node && node.scrollIntoView) node.scrollIntoView({ block: 'center' });
    el.ovClose.focus();
  }

  function closeOverview() {
    el.overview.hidden = true;
    el.ovGrid.textContent = '';   // 2600 nodes should not linger
  }

  el.counter.addEventListener('click', openOverview);
  el.ovClose.addEventListener('click', closeOverview);
  el.ovGrid.addEventListener('click', function (e) {
    var i = e.target && e.target.getAttribute && e.target.getAttribute('data-i');
    if (i === null || i === undefined || !state.engine) return;
    state.engine.jumpTo(Number(i));
    seekToItem(state.engine.index);
    closeOverview();
  });
  el.overview.addEventListener('click', function (e) {
    if (e.target === el.overview) closeOverview();
  });

  /* ── resume ────────────────────────────────────────────────────── */

  function showResume() {
    var s = M.store.read().session;
    if (!s || !s.text || s.index < 1 || s.index >= s.total) {
      el.resumeBox.hidden = true;
      return;
    }
    el.resumeText.textContent = s.name + ' · ' +
      M.i18n.t(s.mode === 'writing' ? 'mode.writing' : 'mode.chanting') + ' · ' +
      (s.index + 1) + ' / ' + s.total;
    el.resumeBox.hidden = false;
  }

  el.resumeGo.addEventListener('click', function () {
    var s = M.store.read().session;
    if (!s) { showResume(); return; }

    el.input.value = s.text;
    state.loadedSnapshot = (s.textId !== 'custom') ? s.text : '';
    el.select.value = textById(s.textId) ? s.textId : 'custom';
    state.lastSelect = el.select.value;
    var m = document.querySelector('input[name="mode"][value="' + s.mode + '"]');
    if (m) m.checked = true;
    var g = document.querySelector('input[name="prog"][value="' +
              (s.auto ? 'auto' : 'manual') + '"]');
    if (g) g.checked = true;
    if (s.speed) el.speed.value = s.speed;
    if (s.repeat) el.repeat.value = s.repeat;
    syncSpeedField();
    updateMeta();

    var session = buildSession();
    if (!session) { showResume(); return; }
    startSession(session, s.index);
  });

  el.resumeClear.addEventListener('click', function () {
    M.store.clearSession();
    showResume();
  });

  /* ── wake lock ─────────────────────────────────────────────────── */

  function requestWake() {
    try {
      if (!('wakeLock' in navigator)) return;
      navigator.wakeLock.request('screen').then(function (lock) {
        state.wakeLock = lock;
      })['catch'](function () {});
    } catch (e) {}
  }

  function releaseWake() {
    if (!state.wakeLock) return;
    try { state.wakeLock.release(); } catch (e) {}
    state.wakeLock = null;
  }

  /* The lock is dropped whenever the tab is hidden; take it again on return. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    if (el.practice.classList.contains('is-active') &&
        state.engine && state.engine.auto && state.engine.playing) {
      requestWake();
    }
  });

  /* ── share link ────────────────────────────────────────────────── */

  function shareUrl() {
    var p = prefs();
    var q = ['t=' + encodeURIComponent(p.textId), 'm=' + p.mode, 'p=' + p.prog,
             's=' + p.speed, 'r=' + p.repeat];
    if (p.hv) q.push('hv=1');
    if (p.py) q.push('py=1');
    if (p.yue) q.push('yue=1');
    q.push('l=' + p.lang);
    return location.origin + location.pathname + '#' + q.join('&');
  }

  function applyHash() {
    var h = location.hash.replace(/^#/, '');
    if (!h) return false;
    var q = {};
    h.split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i > 0) q[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1));
    });
    if (!q.t) return false;
    if (q.l) setLang(q.l, true);
    applyPrefs({
      mode: q.m, prog: q.p, speed: q.s, repeat: q.r,
      hv: q.hv === '1', py: q.py === '1', yue: q.yue === '1'
    });
    loadText(textById(q.t) ? q.t : 'custom');
    syncSpeedField();
    updateMeta();
    return true;
  }

  /* Following a share link while the page is already open only changes the
   * hash — the page does not reload — so apply it here too. Never yank a
   * session that is already running. */
  window.addEventListener('hashchange', function () {
    if (el.practice.classList.contains('is-active')) return;
    applyHash();
  });

  el.share.addEventListener('click', function () {
    var url = shareUrl();
    var done = function (ok) {
      el.shareNote.hidden = false;
      el.shareNote.textContent = ok ? M.i18n.t('share.copied') : url;
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { done(true); },
                                                function () { done(false); });
        return;
      }
    } catch (e) {}
    done(false);
  });

  /* ── done screen ───────────────────────────────────────────────── */

  el.again.addEventListener('click', function () {
    if (state.session) startSession(state.session, 0);
  });

  el.homeBtn.addEventListener('click', function () {
    if (state.engine) { state.engine.destroy(); state.engine = null; }
    releaseWake();
    showResume();
    show(el.home);
  });

  /* ── keyboard ──────────────────────────────────────────────────── */

  document.addEventListener('keydown', function (e) {
    if (!el.overview.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeOverview(); }
      return;
    }
    if (!el.modal.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeConfirm(false); }
      return;
    }
    if (!el.practice.classList.contains('is-active') || !state.engine) return;

    if (e.key === 'ArrowLeft')       { e.preventDefault(); state.engine.prev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); state.engine.next(); }
    else if (e.key === 'o' || e.key === 'O') { e.preventDefault(); openOverview(); }
    else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (state.engine.auto || (state.session && state.session.followCues)) toggleAll();
      else state.engine.next();
    }
    else if (e.key === 'Escape')     { e.preventDefault(); exitPractice(); }
  });

  /* ── live preview wiring ───────────────────────────────────────── */

  el.input.addEventListener('input', function () { updateMeta(); setError(''); });
  el.repeat.addEventListener('input', function () { updateMeta(); savePrefs(); });
  el.speed.addEventListener('change', savePrefs);
  el.optHv.addEventListener('change', savePrefs);
  el.optPy.addEventListener('change', savePrefs);
  el.optYue.addEventListener('change', savePrefs);
  el.sizeUp.addEventListener('click', function () { setScale(state.scale + SCALE_STEP); });
  el.sizeDown.addEventListener('click', function () { setScale(state.scale - SCALE_STEP); });

  Array.prototype.forEach.call(
    document.querySelectorAll('input[name="mode"]'),
    function (r) { r.addEventListener('change', function () { updateMeta(); savePrefs(); }); }
  );
  Array.prototype.forEach.call(
    document.querySelectorAll('input[name="prog"]'),
    function (r) { r.addEventListener('change', function () { syncSpeedField(); savePrefs(); }); }
  );

  /* ── language ──────────────────────────────────────────────────── */

  function buildLangSelect() {
    el.lang.textContent = '';
    M.i18n.order.forEach(function (code) {
      var o = document.createElement('option');
      o.value = code;
      o.textContent = M.i18n.name(code);
      el.lang.appendChild(o);
    });
  }

  function setLang(code, silent) {
    M.i18n.set(code);
    el.lang.value = M.i18n.current();
    M.i18n.apply();
    buildSelect();          // optgroup labels are translated
    buildSpeakSelect();
    updateMeta();
    showResume();
    if (state.engine && !state.engine.finished) render({
      item: state.engine.items[state.engine.index],
      index: state.engine.index,
      total: state.engine.items.length,
      playing: state.engine.playing,
      finished: false,
      auto: state.engine.auto
    });
    if (!silent) savePrefs();
  }

  el.lang.addEventListener('change', function () { setLang(el.lang.value); });

  /* ── speech ────────────────────────────────────────────────────── */

  function hasSpeakOption(v) {
    for (var i = 0; i < el.speak.options.length; i++) {
      if (el.speak.options[i].value === v) return true;
    }
    return false;
  }

  var SPEAK_NAMES = {
    'zh-TW': '國語 Mandarin (TW)', 'zh-CN': '普通话 Mandarin (CN)',
    'yue-HK': '粵語 Cantonese', 'vi-VN': 'Tiếng Việt — Hán-Việt'
  };

  /* Only list languages this device actually has a voice for — offering a
   * voice that silently does nothing is worse than not offering it. */
  function buildSpeakSelect() {
    var keep = el.speak.value;
    var langs = M.speech.available();
    el.speak.textContent = '';

    var off = document.createElement('option');
    off.value = 'off';
    off.textContent = M.i18n.t('speak.off');
    el.speak.appendChild(off);

    langs.forEach(function (id) {
      var o = document.createElement('option');
      o.value = id;
      o.textContent = SPEAK_NAMES[id] || id;
      el.speak.appendChild(o);
    });

    el.speakField.hidden = !M.speech.supported();
    el.speakNote.textContent = M.i18n.t(langs.length ? 'speak.note' : 'speak.unavailable');
    el.speak.value = hasSpeakOption(keep) ? keep : 'off';
  }

  function speakCurrent() {
    if (!state.engine || state.engine.finished) return;
    var lang = el.speak.value;
    if (!lang || lang === 'off') return;

    var idx = state.engine.index;
    var reads = M.speech.readsOf(lang);
    /* A Vietnamese voice cannot read Chinese characters — hand it the
     * Hán-Việt romanisation instead. Mandarin/Cantonese voices get the
     * characters as-is. */
    var text = (reads === 'han')
      ? state.engine.items[idx]
      : sliceReading(state.session && state.session.rHv, idx);
    if (!text) return;
    M.speech.speak(text, lang);
  }

  el.speak.addEventListener('change', function () {
    M.speech.cancel();
    savePrefs();
    syncSpeakButton();
  });

  function syncSpeakButton() {
    var on = M.speech.supported() && el.speak.value && el.speak.value !== 'off';
    el.btnSpeak.hidden = !on;
  }

  el.btnSpeak.addEventListener('click', speakCurrent);

  if (M.speech.supported() &&
      typeof window.speechSynthesis.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', function () {
      buildSpeakSelect();
      syncSpeakButton();
    });
  }

  /* ── boot ──────────────────────────────────────────────────────── */

  buildLangSelect();
  buildSelect();

  var saved = M.store.read();
  setLang((saved.prefs && saved.prefs.lang) || M.i18n.detect(), true);
  applyPrefs(saved.prefs);
  setScale(state.scale, true);
  syncSpeakButton();

  if (!applyHash()) {
    var pid = saved.prefs && saved.prefs.textId;
    if (pid && textById(pid) && pid !== 'custom') {
      loadText(pid);
    } else if (saved.customText) {
      el.input.value = saved.customText;
      state.loadedSnapshot = '';
    }
  }

  /* A share link is only useful when the page has a real URL. */
  el.share.hidden = (location.protocol === 'file:');

  syncSpeedField();
  updateMeta();
  showResume();
  refreshAudioUi();
  show(el.home);

})(window.Mantra = window.Mantra || {});
