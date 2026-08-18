/* Mantra Practice — the recording that goes with a text.
 *
 * The recordings are NOT in this repository. They are somebody else's work,
 * so the app embeds the original YouTube video instead of copying the audio:
 * it streams from YouTube, the reciter keeps their view and their credit, and
 * nothing copyrighted is redistributed from here.
 *
 * A text may also carry `cues` — one [start, end] pair per line, taken from
 * that video's own caption track (see tools/cues.mjs). With those the player
 * drives the screen: the app advances exactly when the reciter does.
 *
 * Needs a connection. With no recording — or no network — the app falls back
 * to its own timer, and to the device voice if you switched that on.
 */
(function (M) {
  'use strict';

  var API_SRC = 'https://www.youtube.com/iframe_api';
  var API_TIMEOUT = 10000;
  var POLL_MS = 200;          // the IFrame API has no timeupdate event

  /* "00:01:02.066" or "01:02,066" → seconds. Used by tools/cues.mjs too. */
  function toSeconds(stamp) {
    var parts = String(stamp).trim().replace(',', '.').split(':');
    var s = 0;
    for (var i = 0; i < parts.length; i++) s = s * 60 + parseFloat(parts[i]);
    return isFinite(s) ? s : 0;
  }

  /* Index of the cue covering `t`, or the last cue that has started.
   * -1 before the first cue. Cues are [start, end] pairs, in order. */
  function cueAt(cues, t) {
    if (!cues || !cues.length) return -1;
    var lo = 0, hi = cues.length - 1, best = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (cues[mid][0] <= t) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return best;
  }

  function watchUrl(id) { return 'https://www.youtube.com/watch?v=' + id; }

  /* ── the IFrame API, loaded once and only if a recording is asked for ── */

  var apiPromise = null;

  function loadApi() {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise(function (resolve, reject) {
      if (window.YT && window.YT.Player) { resolve(window.YT); return; }

      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === 'function') prev();
        resolve(window.YT);
      };

      var s = document.createElement('script');
      s.src = API_SRC;
      s.onerror = function () { apiPromise = null; reject(new Error('api')); };
      document.head.appendChild(s);

      /* Offline, or the request is being swallowed: fail instead of hanging
       * on a practice screen that will never start. */
      setTimeout(function () {
        if (!(window.YT && window.YT.Player)) { apiPromise = null; reject(new Error('timeout')); }
      }, API_TIMEOUT);
    });
    return apiPromise;
  }

  /* Resolves with a small controller once the video is ready to play.
   * `mount` is replaced by the iframe, so hand it a throwaway element.
   * handlers: { onTime(seconds), onState(playing), onEnded() }
   * opts.start: whole seconds to begin at.
   *
   * The starting point goes through `start` rather than a seekTo() on ready,
   * because YouTube may run an advert first and seeks aimed at an advert are
   * silently dropped — the practice screen would then sit on line 1 until the
   * real recording caught up. `start` is applied to the video itself, so it
   * survives whatever plays in front of it. */
  function createPlayer(mount, videoId, handlers, opts) {
    handlers = handlers || {};
    opts = opts || {};
    var vars = { playsinline: 1, rel: 0, modestbranding: 1 };
    if (opts.start) vars.start = Math.max(0, Math.floor(opts.start));
    return loadApi().then(function (YT) {
      return new Promise(function (resolve, reject) {
        var timer = null, ctl = null, settled = false;

        var p = new YT.Player(mount, {
          videoId: videoId,
          playerVars: vars,
          events: {
            onReady: function () {
              timer = setInterval(function () {
                if (handlers.onTime) handlers.onTime(p.getCurrentTime() || 0);
              }, POLL_MS);
              settled = true;
              resolve(ctl);
            },
            onStateChange: function (e) {
              if (handlers.onState) handlers.onState(e.data === YT.PlayerState.PLAYING);
              if (e.data === YT.PlayerState.ENDED && handlers.onEnded) handlers.onEnded();
            },
            /* Embedding disabled, video pulled, region-blocked… */
            onError: function () { if (!settled) { settled = true; reject(new Error('video')); } }
          }
        });

        ctl = {
          play:    function () { try { p.playVideo(); } catch (e) {} },
          pause:   function () { try { p.pauseVideo(); } catch (e) {} },
          seek:    function (t) { try { p.seekTo(t, true); } catch (e) {} },
          time:    function () { try { return p.getCurrentTime() || 0; } catch (e) { return 0; } },
          paused:  function () {
            try { return p.getPlayerState() !== YT.PlayerState.PLAYING; } catch (e) { return true; }
          },
          destroy: function () {
            if (timer) clearInterval(timer);
            timer = null;
            try { p.destroy(); } catch (e) {}
          }
        };
      });
    });
  }

  M.media = {
    cueAt: cueAt,
    toSeconds: toSeconds,
    watchUrl: watchUrl,
    /* Swapped out by the test suite so it never touches the network. */
    createPlayer: createPlayer
  };

})(window.Mantra = window.Mantra || {});
